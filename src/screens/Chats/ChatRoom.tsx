import { pick, types } from '@react-native-documents/picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  findNodeHandle,
  FlatList,
  Keyboard,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  ViewToken,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import ChatRoomSkeleton from '../../components/skeletons/ChatRoomSkeleton';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Feather from 'react-native-vector-icons/Feather';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import moment from 'moment';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInRight,
  FadeInUp,
  FadeOutRight,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { queryClient } from '../../../App';
import { getConversation } from '../../api/functions/chat.api';
import { getMessages } from '../../api/functions/message.api';
import { ChatCoach, ChevronLeft } from '../../assets';
import EmojiReactor from '../../components/Chat/EmojiReactor';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { PaginatedResponse } from '../../typescript/interface/common.interface';
import {
  Message,
  MessageReaction,
  MessageStatus,
} from '../../typescript/interface/message.interface';
import {
  fontSize,
  isAndroid,
  scale,
  SCREEN_WIDTH,
  spacing,
  verticalScale,
} from '../../utils';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { randomUUID } from 'react-native-quick-crypto';
import {
  clearChatNotifications,
  setFocusedChat,
} from '../../notifications';
import AttachmentMenu from '../../components/Chat/AttachmentMenu';
import AttachmentFullPreview from '../../components/Chat/AttachmentPreview';
import EmojiKeyboard from '../../components/Chat/EmojiKeyboard';
import { ImageMessage } from '../../components/Chat/ImageMessage';
import TypingIndicator from '../../components/Chat/TypingIndicator';
import CoachAiSheet from '../../components/CoachAi';
import TouchableButton from '../../components/TouchableButton';
import { uploadManager } from '../../helpers/uploadManager';
import { formatChatDateSeparator, hapticOptions } from '../../helpers/utils';
import { useChatUpload } from '../../hooks/useChatHook';
import AttachmentViewer from '../../components/Chat/AttachementViewer';
import { VideoMessage } from '../../components/Chat/VideoMessage';
import { FileMessage } from '../../components/Chat/FileMessage';
import { Reply, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_SWIPE = 60; // how far message can move, just like WhatsApp
const SWIPE_REPLY_THRESHOLD = 40;
const ACTIVE_SWIPE_START = 12;

type ChatRoomTaskNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'ChatRoom'
>;

type DateSeparatorItem = { __type: 'date'; id: string; label: string };
type ChatItem = Message | DateSeparatorItem;

const isDateSeparator = (item: ChatItem): item is DateSeparatorItem =>
  (item as DateSeparatorItem).__type === 'date';

const DateSeparator = ({ label }: { label: string }) => (
  <View style={styles.dateSeparatorRow}>
    <View style={styles.dateSeparatorPill}>
      <Text style={styles.dateSeparatorText}>{label}</Text>
    </View>
  </View>
);

const RenderMessage = ({
  item,
  conversation,
  onReply,
  onOpenReactor,
}: {
  item: Message;
  conversation: ChatConversation | undefined;
  onReply: () => void;
  onOpenReactor: (msg: Message, pos: { x: number; y: number }) => void;
}) => {
  const bubbleRef = useRef<any>(null);
  const { profile } = useAuth();
  const isMe = conversation?.isDeletable
    ? item.sender?._id === profile?._id
    : false;

  const time = item.createdAt ? moment(item.createdAt).format('h:mm A') : '';

  const [attachmentIndex, setAttachmentIndex] = useState<number | null>(null);

  const triggerHaptics = () => {
    ReactNativeHapticFeedback.trigger('rigid', hapticOptions);
  };

  const measureAndOpen = () => {
    const handle = findNodeHandle(bubbleRef.current);
    if (!handle) return;

    UIManager.measure(handle, (_fx, _fy, _w, _h, px, py) => {
      // px, py = absolute coordinates on screen
      onOpenReactor(item, { x: (SCREEN_WIDTH - 220) / 2, y: py });
    });
  };

  const translateX = useSharedValue(0);
  const hasTriggered = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .activeOffsetX(isMe ? [-ACTIVE_SWIPE_START, 0] : [0, ACTIVE_SWIPE_START])
    .failOffsetY([-10, 10])
    .onUpdate(e => {
      if (!isMe) {
        translateX.value = Math.min(MAX_SWIPE, Math.max(0, e.translationX));
      } else {
        translateX.value = Math.max(-MAX_SWIPE, Math.min(0, e.translationX));
      }

      const crossedThreshold =
        (!isMe && translateX.value > SWIPE_REPLY_THRESHOLD) ||
        (isMe && translateX.value < -SWIPE_REPLY_THRESHOLD);

      if (crossedThreshold && !hasTriggered.value) {
        hasTriggered.value = true;
        runOnJS(triggerHaptics)();
        runOnJS(onReply)();
      }
    })
    .onFinalize(() => {
      hasTriggered.value = false;
      translateX.value = withTiming(0, { duration: 150 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.abs(translateX.value) / 40);

    return {
      opacity: progress,
      transform: [
        {
          translateX: isMe ? translateX.value + 70 : translateX.value - 70,
        },
      ],
    };
  });

  return (
    <>
      <Animated.View
        entering={FadeInUp.springify().mass(0.5).damping(15).duration(120)}
        layout={LinearTransition.springify()}
        style={{ marginBottom: spacing(10) }}
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.messageRow,
              { justifyContent: isMe ? 'flex-end' : 'flex-start' },
              animatedStyle,
            ]}
          >
            {!isMe && (
              <Animated.View style={[styles.replyIconLeft, arrowStyle]}>
                <Reply size={18} color="#666" />
              </Animated.View>
            )}

            {isMe && (
              <Animated.View style={[styles.replyIconRight, arrowStyle]}>
                <Reply size={18} color="#666" />
              </Animated.View>
            )}

            {!isMe && (
              <SmartAvatar
                src={
                  conversation?.isDeletable
                    ? item.sender?.photo
                    : 'https://coachiatry.s3.us-east-1.amazonaws.com/Logo+Mark+(1).png'
                }
                name={item.sender?.fullName}
                size={scale(28)}
                style={styles.avatar}
              />
            )}

            <TouchableOpacity
              ref={bubbleRef}
              activeOpacity={0.9}
              onLongPress={() => {
                triggerHaptics();
                measureAndOpen();
              }}
              style={[
                styles.messageBubble,
                isMe ? styles.myMessage : styles.otherMessage,
              ]}
            >
              {item.replyTo?._id && (
                <View
                  style={[
                    styles.replyContainer,
                    {
                      position: 'static',
                      marginHorizontal: 0,
                      borderRadius: 8,
                      paddingLeft: spacing(4),
                      paddingVertical: spacing(6),
                    },
                    !isMe && {
                      paddingHorizontal: spacing(2),
                      paddingVertical: spacing(4),
                    },
                  ]}
                >
                  <View style={styles.replyLine} />
                  <View style={[styles.replyContent, { flex: 0 }]}>
                    <Text style={styles.replyName}>
                      {item.replyTo.sender?._id === profile?._id
                        ? 'You'
                        : item.replyTo.sender?.fullName}
                    </Text>

                    <Text style={styles.replyText} numberOfLines={1}>
                      {item.replyTo?.content ||
                        (item.replyTo?.type === 'image'
                          ? `📷 ${item.replyTo?.files?.length} images`
                          : item.replyTo?.type === 'video'
                            ? `🎥 ${item.replyTo?.files?.length} videos`
                            : `📁 ${item.replyTo?.files?.length} files`)}
                    </Text>
                  </View>
                </View>
              )}
              {item.type === 'text' ? (
                <View style={styles.textWithTime}>
                  <Text
                    style={[
                      styles.messageText,
                      styles.messageTextFlex,
                      {
                        color: isMe
                          ? theme.colors.white
                          : theme.colors.gray[900],
                      },
                    ]}
                  >
                    {item.content}
                  </Text>
                  <Text
                    style={[
                      styles.bubbleTimestamp,
                      {
                        color: isMe
                          ? 'rgba(255,255,255,0.6)'
                          : theme.colors.gray[400],
                      },
                    ]}
                  >
                    {time}
                  </Text>
                </View>
              ) : item.type === 'image' ? (
                <View>
                  <ImageMessage
                    message={item}
                    setSelected={index => setAttachmentIndex(index)}
                  />
                  <Text
                    style={[
                      styles.mediaTimestamp,
                      {
                        color: isMe
                          ? 'rgba(255,255,255,0.6)'
                          : theme.colors.gray[400],
                      },
                    ]}
                  >
                    {time}
                  </Text>
                </View>
              ) : item.type === 'video' ? (
                <View>
                  <VideoMessage
                    message={item}
                    setSelected={index => setAttachmentIndex(index)}
                  />
                  <Text
                    style={[
                      styles.mediaTimestamp,
                      {
                        color: isMe
                          ? 'rgba(255,255,255,0.6)'
                          : theme.colors.gray[400],
                      },
                    ]}
                  >
                    {time}
                  </Text>
                </View>
              ) : (
                <View>
                  <FileMessage message={item} />
                  <Text
                    style={[
                      styles.mediaTimestamp,
                      {
                        color: isMe
                          ? 'rgba(255,255,255,0.6)'
                          : theme.colors.gray[400],
                      },
                    ]}
                  >
                    {time}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>

        {/* Reaction Row */}
        {item.reactions && item.reactions.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              backgroundColor: '#fff',
              paddingHorizontal: 2,
              paddingVertical: 2,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#eee',
              gap: 4,
              position: 'relative',
              top: spacing(-6),
              left: isMe ? 'auto' : spacing(40),
            }}
          >
            {item.reactions.map((r, i) => (
              <Text key={i} style={{ fontSize: 12 }}>
                {r.emoji}
              </Text>
            ))}
          </View>
        )}
      </Animated.View>
      <AttachmentViewer
        files={item.files}
        onClose={() => setAttachmentIndex(null)}
        open={attachmentIndex === 0 ? true : Boolean(attachmentIndex)}
        pressedIndex={attachmentIndex ?? 0}
      />
    </>
  );
};

const ReplyPreview = ({
  message,
  onClose,
}: {
  message: Message;
  onClose: () => void;
}) => {
  const { profile } = useAuth();

  return (
    <View style={styles.replyContainer}>
      <View style={styles.replyLine} />
      <View style={styles.replyContent}>
        <Text style={styles.replyName}>
          {message.sender?._id === profile?._id
            ? 'You'
            : message.sender?.fullName}
        </Text>

        <Text style={styles.replyText} numberOfLines={1}>
          {message?.content ||
            (message?.type === 'image'
              ? `📷 ${message.files?.length} images`
              : message?.type === 'video'
                ? `🎥 ${message.files?.length} videos`
                : `📁 ${message?.files?.length} files`)}
        </Text>
      </View>

      <TouchableOpacity onPress={onClose} style={styles.replyCloseBtn}>
        <X size={18} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );
};

const ChatScreen = () => {
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [attachments, setAttachments] = useState<
    {
      uri: string;
      type: 'image' | 'video' | 'file';
      name: string;
      size: number;
      mimeType: string;
    }[]
  >([]);
  const [reactorVisibleFor, setReactorVisibleFor] = useState<{
    id: string;
  } | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const socket = useSocket();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRoomRef = useRef<string | null>(null);
  const navigation = useNavigation<ChatRoomTaskNavigationProp>();
  const route = useRoute<RouteProp<AppStackParamList, 'ChatRoom'>>();
  const { roomId: room, fromFloating = false } = route.params;

  const [reactorPos, setReactorPos] = useState({ top: 0, left: 0 });
  const [message, setMessage] = useState('');
  const [friendStatus, setFriendStatus] = useState<'online' | 'offline'>(
    'offline',
  );
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const uploadMutation = useChatUpload();

  const messageKeyMap = useRef<Map<string, string>>(new Map());
  const isTyping = message.length > 0 || attachments.length > 0;

  const getStableKey = (msg: Message) => {
    // prefer a known unique identifier (tempId or _id)
    const id = msg.tempId || msg._id;

    if (!id) {
      // fallback if neither exists — shouldn’t happen, but for safety
      return `unknown-${Math.random().toString(36).substring(2, 9)}`;
    }

    // if we already have a key for this message, return it
    if (messageKeyMap.current.has(id)) {
      return messageKeyMap.current.get(id)!;
    }

    // otherwise create one and store it
    const stableKey = randomUUID();
    messageKeyMap.current.set(id, stableKey);
    return stableKey;
  };

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['messages', room!],
    queryFn: ctx => getMessages(ctx),
    initialPageParam: 1,
    enabled: !!room,
    getNextPageParam: lastPage => {
      if (lastPage.meta.currentPage < lastPage.meta.totalPages) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: conversation, isLoading: isConversationLoading } = useQuery({
    queryKey: ['conversations', room],
    queryFn: ({ signal }) => getConversation(room, signal),
    enabled: !!room,
  });

  const friend = conversation?.members?.find(
    _member => _member.user._id !== profile?._id,
  );

  const details: { photo?: string; name?: string } = {
    photo: friend?.user.photo,
    name: friend?.user.fullName,
  };

  if (conversation && conversation.type === 'group') {
    details.photo = conversation.groupPhoto;
    details.name = conversation.name;
  }

  const allMessages = useMemo(
    () => messagesData?.pages.flatMap(page => [...page.data]) ?? [],
    [messagesData],
  );

  const typingMembers = useMemo(() => {
    if (!conversation || typingUsers.length === 0) return [];
    return typingUsers
      .map(uid => conversation.members?.find(m => m.user._id === uid)?.user)
      .filter((u): u is NonNullable<typeof u> => Boolean(u));
  }, [typingUsers, conversation]);

  const [floatingDate, setFloatingDate] = useState<string | null>(null);
  const floatingOpacity = useSharedValue(0);
  const hideFloatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleMessagesScroll = () => {
    floatingOpacity.value = withTiming(1, { duration: 150 });
    if (hideFloatingTimerRef.current)
      clearTimeout(hideFloatingTimerRef.current);
    hideFloatingTimerRef.current = setTimeout(() => {
      floatingOpacity.value = withTiming(0, { duration: 300 });
    }, 1500);
  };

  const onViewableItemsChangedRef = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<ChatItem>[] }) => {
      let topmostIndex = -1;
      let topmostMessage: Message | null = null;
      for (const v of viewableItems) {
        if (!v.item || isDateSeparator(v.item) || !v.item.createdAt) continue;
        const idx = v.index ?? -1;
        if (idx > topmostIndex) {
          topmostIndex = idx;
          topmostMessage = v.item;
        }
      }
      if (topmostMessage?.createdAt) {
        setFloatingDate(formatChatDateSeparator(topmostMessage.createdAt));
      }
    },
  ).current;

  useEffect(() => {
    return () => {
      if (hideFloatingTimerRef.current)
        clearTimeout(hideFloatingTimerRef.current);
    };
  }, []);

  const floatingDateStyle = useAnimatedStyle(() => ({
    opacity: floatingOpacity.value,
  }));

  const chatItems = useMemo<ChatItem[]>(() => {
    const result: ChatItem[] = [];
    for (let i = 0; i < allMessages.length; i++) {
      const msg = allMessages[i];
      result.push(msg);
      const next = allMessages[i + 1];
      const currentDay = msg.createdAt
        ? moment(msg.createdAt).format('YYYY-MM-DD')
        : null;
      const nextDay = next?.createdAt
        ? moment(next.createdAt).format('YYYY-MM-DD')
        : null;
      if (currentDay && (!next || currentDay !== nextDay)) {
        result.push({
          __type: 'date',
          id: `date-${currentDay}`,
          label: formatChatDateSeparator(msg.createdAt!),
        });
      }
    }
    return result;
  }, [allMessages]);

  useEffect(() => {
    activeRoomRef.current = room; // current chat ID
    if (room) {
      setFocusedChat(room);
      clearChatNotifications(room);
    }
    return () => {
      activeRoomRef.current = null; // user left chat
      setFocusedChat(undefined);
    };
  }, [room]);

  useEffect(() => {
    if (!socket) return;
    if (conversation?.type === 'group') return;

    const handleStatusUpdate = ({
      userId,
      status,
    }: {
      userId: string;
      status: 'online' | 'offline';
    }) => {
      if (userId === friend?.user._id) {
        setFriendStatus(status);
      }
    };

    socket.on('user_status_update', handleStatusUpdate);

    return () => {
      socket.off('user_status_update', handleStatusUpdate);
    };
  }, [socket, friend?.user._id, conversation]);

  const lastSeenSignalRef = useRef<string | null>(null);
  useEffect(() => {
    if (!room || !profile?._id || !socket) return;
    const latest = messagesData?.pages?.[0]?.data?.[0];
    if (!latest) return;
    // Only mark-seen when the newest message actually changes — not on every
    // optimistic send or older-page fetch (which re-create messagesData).
    const signal = `${room}:${latest._id ?? latest.tempId ?? ''}`;
    if (signal === lastSeenSignalRef.current) return;
    lastSeenSignalRef.current = signal;
    socket.emit('mark_seen', { chatId: room, userId: profile?._id });
  }, [messagesData, profile?._id, room, socket]);

  useEffect(() => {
    if (!socket) return;
    if (!room) return;

    const joinRoom = () => {
      socket.emit('join_room', {
        chatId: room,
        userId: profile?._id,
        friendId: friend?.user._id,
        isGroup: conversation?.type === 'group',
      });
    };

    // Join on mount and rejoin on reconnection (new server socket = lost rooms)
    joinRoom();
    socket.on('connect', joinRoom);

    // socket.emit('mark_seen', { chatId: room, userId: profile?._id });

    // NEW MESSAGE (from server)
    socket.on('new_message', (msg: Message) => {
      if (msg.chat !== room) return;

      if (msg.tempId && msg._id) {
        const oldKey = messageKeyMap.current.get(msg.tempId);
        if (oldKey) {
          messageKeyMap.current.set(msg._id, oldKey);
        }
      }

      queryClient.setQueryData<
        InfiniteData<PaginatedResponse<Message[]>, number>
      >(['messages', room], old => {
        if (!old) return old;

        const firstPage = old.pages[0];
        if (!firstPage) return old;

        const existingMessages = firstPage.data;

        // 1. Replace optimistic message using tempId
        const tempIdx = existingMessages.findIndex(
          m => m.tempId && msg.tempId && m.tempId === msg.tempId,
        );

        if (tempIdx !== -1) {
          const newMessages = [...existingMessages];
          newMessages[tempIdx] = {
            ...msg,
            status: 'sent' as MessageStatus,
          };

          const updatedFirstPage: PaginatedResponse<Message[]> = {
            ...firstPage,
            data: newMessages,
          };

          return {
            ...old,
            pages: [updatedFirstPage, ...old.pages.slice(1)],
            pageParams: old.pageParams, // required for strict types
          };
        }

        // 2. Prevent duplicates by _id or tempId
        const exists = existingMessages.some(
          m =>
            (m._id && msg._id && m._id === msg._id) ||
            (m.tempId && msg.tempId && m.tempId === msg.tempId),
        );

        if (exists) return old;

        // 3. Correct append for inverted list:
        // Newest at START of page[0].data
        const updatedFirstPage: PaginatedResponse<Message[]> = {
          ...firstPage,
          data: [
            { ...msg, status: 'sent' as MessageStatus },
            ...existingMessages,
          ],
        };

        return {
          ...old,
          pages: [updatedFirstPage, ...old.pages.slice(1)],
          pageParams: old.pageParams,
        };
      });

      // Conversation list preview/reorder/unread is handled centrally by
      // useConversationsRealtime() (mounted in FloatingChatHost) via the
      // 'conversation_updated' event — no need to duplicate it here.
    });

    // Delivery, seen, reaction updates (same as before)
    socket.on('message_seen_update_bulk', ({ chatId, userId }) => {
      if (chatId !== room) return;

      if (userId !== profile?._id) {
        queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
          ['messages', chatId],
          old => {
            if (!old) return old;

            const updatedPages = old.pages.map(page => ({
              ...page,
              data: page.data.map(m =>
                m.sender?._id === profile?._id
                  ? { ...m, status: 'seen' as MessageStatus }
                  : m,
              ),
            }));

            return { ...old, pages: updatedPages };
          },
        );
      }

      // also update chat list preview
      if (userId === profile?._id) {
        queryClient.setQueryData<
          InfiniteData<PaginatedResponse<ChatConversation[]>>
        >(['conversations'], old => {
          if (!old || !old.pages.length) return old;

          const allItems = old.pages.flatMap(p => p.data);
          const idx = allItems.findIndex(c => c._id === chatId);
          if (idx === -1) return old;

          allItems[idx] = { ...allItems[idx], unreadCount: 0 };

          return {
            ...old,
            pages: [
              {
                ...old.pages[0],
                data: allItems.slice(0, old.pages[0].meta.limit || 20),
              },
              ...old.pages.slice(1),
            ],
          };
        });
      }
    });

    socket.on('reaction_updated', ({ messageId, reactions }) => {
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
        ['messages', room],
        old => {
          if (!old) return old;
          const updatedPages = old.pages.map(page => ({
            ...page,
            data: page.data.map(m =>
              m._id === messageId ? { ...m, reactions } : m,
            ),
          }));
          return { ...old, pages: updatedPages };
        },
      );
    });

    socket.on(
      'user_typing',
      ({ chatId, userId }: { chatId: string; userId: string }) => {
        if (chatId === room && userId !== profile?._id) {
          setTypingUsers(prev =>
            prev.includes(userId) ? prev : [...prev, userId],
          );
        }
      },
    );

    socket.on(
      'user_stop_typing',
      ({ chatId, userId }: { chatId: string; userId: string }) => {
        if (chatId === room) {
          setTypingUsers(prev => prev.filter(id => id !== userId));
        }
      },
    );

    return () => {
      socket.off('connect', joinRoom);
      socket.emit('stop_typing', { chatId: room, userId: profile?._id });
      socket.emit('leave_room', { chatId: room, userId: profile?._id });
      socket.off('new_message');
      // The actual listener registered above is 'message_seen_update_bulk' —
      // the previous two off()s targeted events that were never added, so the
      // real handler leaked and accumulated across room changes/remounts.
      socket.off('message_seen_update_bulk');
      socket.off('reaction_updated');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [socket, room, profile?._id, friend?.user?._id, conversation?.type]);

  const handleTyping = (value: string) => {
    setMessage(value);

    if (value.trim()) {
      socket?.emit('typing', { chatId: room, userId: profile?._id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket?.emit('stop_typing', {
          chatId: room,
          userId: profile?._id,
        });
      }, 1500);
    } else {
      socket?.emit('stop_typing', { chatId: room, userId: profile?._id });
    }
  };

  const handleSend = async (text: string, files: typeof attachments) => {
    if (!profile?._id || !socket) return;
    if (!text && files.length === 0) return;

    // setChatDragShow(false);

    const tempId = Date.now().toString();
    const now = new Date().toISOString();

    const optimisticMessage: Omit<Message, 'replyTo' | 'repeat'> & {
      replyTo?: string;
    } = {
      chat: room,
      sender: profile,
      type:
        files.length > 0
          ? files[0].type.startsWith('image')
            ? 'image'
            : files[0].type.startsWith('video')
              ? 'video'
              : 'file'
          : ('text' as Message['type']),
      content: text,
      replyTo: replyingTo?._id,
      files: files.map((f, i) => ({
        url: f.uri,
        type: f.mimeType,
        size: f.size,
        thumbnailUrl: null,
        duration: null,
        uploading: true,
        progress: 0,
        filename: f.name,
      })),
      tempId,
      status: 'pending',
      createdAt: now,
      overallProgress: 0,
    };
    setMessage('');
    setAttachments([]);

    // Optimistic update
    queryClient.setQueryData(['messages', room], (old: any) => {
      if (!old) {
        return {
          pageParams: [1],
          pages: [
            {
              data: [optimisticMessage],
              meta: {
                currentPage: 1,
                totalPages: 1,
                totalCount: 1,
                results: 1,
                limit: 20,
              },
            },
          ],
        };
      }

      // produce copy of pages with new message prepended to newest page (pages[0] is newest in your backend)
      const newPages = old.pages.map((page: any, idx: number) =>
        idx === 0 ? { ...page, data: [optimisticMessage, ...page.data] } : page,
      );

      return { ...old, pages: newPages };
    });

    // Optimistically update conversations list immediately (infinite query shape)
    queryClient.setQueryData<
      InfiniteData<PaginatedResponse<ChatConversation[]>>
    >(['conversations'], old => {
      if (!old || !old.pages.length) return old;

      const allItems = old.pages.flatMap(p => p.data);
      const idx = allItems.findIndex(c => c._id === room);
      if (idx === -1) return old;

      const updatedConv = {
        ...allItems[idx],
        lastMessage: optimisticMessage as unknown as Message,
        updatedAt: now,
      };

      const withoutUpdated = allItems.filter((_, i) => i !== idx);
      const newFirstPageData = [updatedConv, ...withoutUpdated].slice(
        0,
        old.pages[0].meta.limit || 20,
      );

      return {
        ...old,
        pages: [
          { ...old.pages[0], data: newFirstPageData },
          ...old.pages.slice(1),
        ],
      };
    });

    if (files.length > 0) {
      const totalSize = files.reduce((a, f) => a + f.size, 0);
      const progressPerFile = Array(files.length).fill(0);

      const uploadedFiles = [];
      for await (const [i, file] of files.entries()) {
        const controller = new AbortController();
        uploadManager.add(tempId, controller); // ✅ register it

        try {
          const url = await uploadMutation.mutateAsync({
            file,
            chatId: room,
            signal: controller.signal,
            onProgress: pct => {
              progressPerFile[i] = pct;
              const uploadedBytes = files.reduce(
                (sum, f, idx) => sum + (progressPerFile[idx] / 100) * f.size,
                0,
              );
              const overallPct = (uploadedBytes / totalSize) * 100;

              queryClient.setQueryData(['messages', room], (old: any) => {
                if (!old) return old;

                return {
                  ...old,
                  pages: old.pages.map((page: any, pageIndex: number) => {
                    // Only update the newest page (index 0)
                    if (pageIndex !== 0) return page;

                    return {
                      ...page,
                      data: page.data.map((m: any) =>
                        m.tempId === tempId
                          ? {
                              ...m,
                              overallProgress: Math.min(overallPct, 100),
                              files: m.files?.map((f: any, fi: number) =>
                                i === fi ? { ...f, progress: pct } : f,
                              ),
                            }
                          : m,
                      ),
                    };
                  }),
                };
              });
            },
          });

          uploadedFiles.push({
            url,
            type: file.mimeType,
            size: file.size,
          });
        } catch (err) {
          if (controller.signal.aborted) {
            console.log('Upload cancelled:', file.name);
            // Don't leave the optimistic message stuck on 'pending' and don't
            // leak the upload-manager entry when the user cancels.
            uploadManager.clear(tempId);
            queryClient.setQueryData(['messages', room], (old: any) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page: any, pageIndex: number) =>
                  pageIndex !== 0
                    ? page
                    : {
                        ...page,
                        data: page.data.map((m: any) =>
                          m.tempId === tempId
                            ? { ...m, status: 'failed' }
                            : m,
                        ),
                      },
                ),
              };
            });
            return; // user cancelled — abort entire send
          }
          console.error('Upload failed:', file.name, err);
          continue; // skip this file, try the rest
        }
      }

      uploadManager.clear(tempId); // ✅ cleanup after done

      // Final update (success or fail)
      const validFiles = uploadedFiles.filter(Boolean);
      queryClient.setQueryData(['messages', room], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any, pageIndex: number) => {
            if (pageIndex !== 0) return page; // update only the newest page

            return {
              ...page,
              data: page.data.map((m: any) =>
                m.tempId === tempId
                  ? {
                      ...m,
                      files: validFiles,
                      status: validFiles.length > 0 ? 'sent' : 'failed',
                      overallProgress: 100,
                      // Optional: mark each file as "uploading: false"
                      ...(validFiles?.length
                        ? {
                            files: validFiles.map((f: any) => ({
                              ...f,
                              uploading: false,
                              progress: 100,
                            })),
                          }
                        : {}),
                    }
                  : m,
              ),
            };
          }),
        };
      });

      if (validFiles.length > 0) {
        socket.emit(
          'send_message',
          {
            ...optimisticMessage,
            sender: profile?._id,
            files: validFiles,
            status: 'sent',
          },
          (response: {
            success: boolean;
            messageId?: string;
            status?: string;
            error?: string;
          }) => {
            if (response?.success) {
              queryClient.setQueryData<
                InfiniteData<PaginatedResponse<Message[]>, number>
              >(['messages', room], old => {
                if (!old) return old;
                return {
                  ...old,
                  pages: old.pages.map((page, idx) =>
                    idx === 0
                      ? {
                          ...page,
                          data: page.data.map(m =>
                            m.tempId === tempId
                              ? {
                                  ...m,
                                  _id: response.messageId,
                                  status: (response.status ??
                                    'sent') as MessageStatus,
                                }
                              : m,
                          ),
                        }
                      : page,
                  ),
                };
              });
            } else {
              console.error('File message failed:', response?.error);
              queryClient.setQueryData<
                InfiniteData<PaginatedResponse<Message[]>, number>
              >(['messages', room], old => {
                if (!old) return old;
                return {
                  ...old,
                  pages: old.pages.map((page, idx) =>
                    idx === 0
                      ? {
                          ...page,
                          data: page.data.map(m =>
                            m.tempId === tempId
                              ? { ...m, status: 'failed' as MessageStatus }
                              : m,
                          ),
                        }
                      : page,
                  ),
                };
              });
            }
          },
        );
      }
    } else {
      socket.emit(
        'send_message',
        {
          ...optimisticMessage,
          sender: profile?._id,
        },
        (response: {
          success: boolean;
          messageId?: string;
          status?: string;
          error?: string;
        }) => {
          if (response?.success) {
            queryClient.setQueryData<
              InfiniteData<PaginatedResponse<Message[]>, number>
            >(['messages', room], old => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page, idx) =>
                  idx === 0
                    ? {
                        ...page,
                        data: page.data.map(m =>
                          m.tempId === tempId
                            ? {
                                ...m,
                                _id: response.messageId,
                                status: (response.status ??
                                  'sent') as MessageStatus,
                              }
                            : m,
                        ),
                      }
                    : page,
                ),
              };
            });
          } else {
            console.error('Message failed:', response?.error);
            queryClient.setQueryData<
              InfiniteData<PaginatedResponse<Message[]>, number>
            >(['messages', room], old => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page, idx) =>
                  idx === 0
                    ? {
                        ...page,
                        data: page.data.map(m =>
                          m.tempId === tempId
                            ? { ...m, status: 'failed' as MessageStatus }
                            : m,
                        ),
                      }
                    : page,
                ),
              };
            });
          }
        },
      );
    }
    // setTimeout(() => {
    //   bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, 50);
    setReplyingTo(null);
  };

  const toggleEmojiKeyboard = () => {
    Keyboard.dismiss();
    setShowEmojiPicker(prev => !prev);
  };

  if (isLoading || isConversationLoading) return <ChatRoomSkeleton />;

  const handleOpenCamera = async () => {
    const res = await launchCamera({
      mediaType: 'photo',
      includeBase64: false,
      saveToPhotos: true,
      quality: 0.6,
      cameraType: 'back',
    });

    if (res.didCancel || !res.assets) return;

    const mapped = res.assets.map(asset => ({
      uri: asset.uri!,
      type: 'image' as const,
      name: asset.fileName || `IMG_${Date.now()}.jpg`,
      size: asset.fileSize || 0,
      mimeType: asset.type || 'image/jpeg',
    }));

    setAttachments(prev => [...prev, ...mapped]);
  };

  const handlePickImage = async () => {
    const res = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 10, // 0 = unlimited
      includeBase64: false,
      presentationStyle: 'fullScreen', // iOS fix
      quality: 0.6,
    });

    if (res.didCancel || !res.assets) return;

    const mapped: {
      uri: string;
      type: 'image' | 'video' | 'file';
      name: string;
      size: number;
      mimeType: string;
    }[] = res.assets.map(asset => ({
      uri: asset.uri!,
      type: 'image',
      name: asset.fileName || 'Image',
      size: asset.fileSize || 0,
      mimeType: asset.type || '',
    }));

    setAttachments(prev => [...prev, ...mapped]);
  };

  const handlePickVideo = async () => {
    const res = await launchImageLibrary({
      mediaType: 'video',
      selectionLimit: 0, // multi videos
      includeBase64: false,
      presentationStyle: 'fullScreen', // iOS fix
      videoQuality: 'medium',
      quality: 0.6,
    });

    if (res.didCancel || !res.assets) return;

    const mapped: {
      uri: string;
      type: 'image' | 'video' | 'file';
      name: string;
      size: number;
      mimeType: string;
    }[] = res.assets.map(asset => ({
      uri: asset.uri!,
      type: 'video',
      name: asset.fileName || 'Video',
      size: asset.fileSize || 0,
      mimeType: asset.type || '',
    }));

    setAttachments(prev => [...prev, ...mapped]);
  };

  const handlePickDocument = async () => {
    try {
      const files = await pick({
        type: [
          types.pdf,
          types.doc,
          types.docx,
          types.plainText,
          types.ppt,
          types.pptx,
        ],
        allowMultiSelection: true,
        allowVirtualFiles: true,
        mode: 'open',
        presentationStyle: 'fullScreen',
        transitionStyle: 'crossDissolve',
        requestLongTermAccess: true,
      });

      if (!files || files.length === 0) return;

      const mapped = files.map(file => {
        const uri = (file as any).fileCopyUri ?? file.uri;
        return {
          uri,
          type: 'file' as const,
          name: file.name ?? 'Document',
          size: file.size ?? 0,
          mimeType: file.type || '',
        };
      });

      setAttachments(prev => [...prev, ...mapped]);
    } catch (error: any) {
      if (error?.code === 'DOCUMENT_PICKER_CANCELED') return;
      console.log('Document Picker Error:', error);
    }
  };

  const handleAttachmentSelect = (
    type: 'camera' | 'image' | 'video' | 'file',
  ) => {
    Keyboard.dismiss();

    if (type === 'camera') handleOpenCamera();
    if (type === 'image') handlePickImage();
    if (type === 'video') handlePickVideo();
    if (type === 'file') handlePickDocument();
  };

  const handleSelectReaction = (emoji: string) => {
    if (!reactorVisibleFor) return;
    const id = reactorVisibleFor.id;
    socket?.emit('add_reaction', {
      messageId: id,
      userId: profile?._id,
      emoji,
    });

    // ✅ Optimistic update for infinite query
    queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
      ['messages', room],
      old => {
        if (!old) return old;

        const updatedPages = old.pages.map(page => {
          return {
            ...page,
            data: page.data.map(m => {
              if (m._id !== id) return m;

              const hasSame = m.reactions?.some(
                (r: MessageReaction) =>
                  r.user === profile?._id && r.emoji === emoji,
              );

              let newReactions: MessageReaction[];

              if (hasSame) {
                // toggle off
                newReactions =
                  m.reactions?.filter(
                    (r: MessageReaction) =>
                      !(r.user === profile?._id && r.emoji === emoji),
                  ) ?? [];
              } else {
                // replace old reaction if exists
                newReactions =
                  m.reactions?.filter(
                    (r: MessageReaction) => r.user !== profile?._id,
                  ) ?? [];
                newReactions.push({
                  user: profile?._id,
                  emoji,
                  reactedAt: new Date().toISOString(),
                });
              }

              return { ...m, reactions: newReactions };
            }),
          };
        });

        return { ...old, pages: updatedPages };
      },
    );
    setReactorVisibleFor(null);
  };

  // iOS keeps react-native's KeyboardAvoidingView (the original, correct input
  // layout); Android uses react-native-keyboard-controller's implementation.
  const KeyboardAvoider = isAndroid
    ? KeyboardAvoidingView
    : RNKeyboardAvoidingView;

  return (
    <KeyboardAvoider
      behavior="padding"
      keyboardVerticalOffset={
        fromFloating ? insets.top + spacing(52) : insets.top
      }
      style={styles.container}
    >
      {/* Header */}
      {!fromFloating && (
        <View style={styles.header}>
          <TouchableButton
            style={{
              paddingVertical: spacing(4),
              paddingHorizontal: spacing(8),
              borderRadius: 100,
            }}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft />
          </TouchableButton>
          <View style={styles.userInfo}>
            <SmartAvatar
              src={details.photo}
              name={details.name}
              size={scale(28)}
            />
            <Text style={styles.userName} numberOfLines={1}>
              {details.name}
            </Text>
            {conversation?.type === 'direct' && friendStatus === 'online' && (
              <View style={styles.dot} />
            )}
          </View>
          {conversation?.type === 'direct' ? (
            <View style={{ width: 24 }} />
          ) : (
            <TouchableButton
              style={{ padding: 4, borderRadius: 100 }}
              onPress={() =>
                navigation.navigate('GroupScreen', { roomId: room })
              }
            >
              <Feather name="info" color="#333" size={fontSize(18)} />
            </TouchableButton>
          )}
        </View>
      )}

      {/* Messages */}
      <View style={{ flex: 1 }}>
        {attachments.length > 0 ? (
          <AttachmentFullPreview
            files={attachments}
            onRemove={i =>
              setAttachments(prev => prev.filter((_, idx) => idx !== i))
            }
            onClose={() => setAttachments([])}
          />
        ) : (
          <FlatList
            data={chatItems}
            onScroll={handleMessagesScroll}
            scrollEventThrottle={16}
            onViewableItemsChanged={onViewableItemsChangedRef}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            renderItem={({ item }) => {
              if (isDateSeparator(item)) {
                return <DateSeparator label={item.label} />;
              }
              return (
                <RenderMessage
                  item={item}
                  conversation={conversation}
                  onReply={() => setReplyingTo(item)}
                  onOpenReactor={(msg, pos) => {
                    setReactorVisibleFor({ id: msg._id! });
                    setReactorPos({ top: pos.y, left: pos.x }); // store coordinates
                  }}
                />
              );
            }}
            keyExtractor={item =>
              isDateSeparator(item) ? item.id : getStableKey(item)
            }
            inverted
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              typingMembers.length > 0 ? (
                <View style={styles.typingStack}>
                  {typingMembers.map(member => (
                    <View key={member._id} style={styles.typingRow}>
                      <SmartAvatar
                        src={member.photo}
                        name={member.fullName}
                        size={scale(28)}
                        style={styles.typingAvatar}
                      />
                      <View style={styles.typingBubbleColumn}>
                        {conversation?.type === 'group' && (
                          <Text style={styles.typingName}>
                            {member.fullName?.split(' ')[0]}
                          </Text>
                        )}
                        <TypingIndicator style={styles.typingBubble} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : null
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View
                  style={{ paddingVertical: spacing(10), alignItems: 'center' }}
                >
                  <Text
                    style={{
                      color: theme.colors.gray[500],
                      fontSize: fontSize(14),
                    }}
                  >
                    Loading messages...
                  </Text>
                </View>
              ) : null
            }
            contentContainerStyle={{
              padding: spacing(16),
              flexGrow: 1,
            }}
          />
        )}
        {floatingDate && attachments.length === 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.floatingDateContainer, floatingDateStyle]}
          >
            <View style={styles.dateSeparatorPill}>
              <Text style={styles.dateSeparatorText}>{floatingDate}</Text>
            </View>
          </Animated.View>
        )}
      </View>
      {/* Message Input */}
      {replyingTo && (
        <ReplyPreview
          message={replyingTo}
          onClose={() => setReplyingTo(null)}
        />
      )}
      <View
        style={[
          styles.inputBar,
          { borderTopWidth: replyingTo ? 0 : 1 },
          isAndroid && fromFloating && { paddingBottom: spacing(14) },
        ]}
      >
        <View style={[styles.inputWrapper]}>
          <TouchableOpacity onPress={toggleEmojiKeyboard}>
            <Ionicons
              name="happy-outline"
              size={20}
              color={theme.colors.gray[500]}
            />
          </TouchableOpacity>

          <TextInput
            onFocus={() => {
              setShowEmojiPicker(false);
            }}
            placeholder="Write your message..."
            placeholderTextColor={theme.colors.gray[400]}
            style={styles.input}
            value={message}
            onChangeText={handleTyping}
          />
          <AttachmentMenu
            onSelect={handleAttachmentSelect}
            // onOpen={() => setShowEmojiPicker(false)}
          />
        </View>

        {!isTyping && (
          <Animated.View
            entering={FadeInRight.duration(150)}
            exiting={FadeOutRight.duration(150)}
            style={{ flexDirection: 'row', marginLeft: 10 }}
          >
            {/* <TouchableButton style={styles.circleButton}>
              <ChatClock />
            </TouchableButton> */}

            <CoachAiSheet page="chat" id={room}>
              <View pointerEvents="none" style={styles.circleButton}>
                <ChatCoach />
              </View>
            </CoachAiSheet>
          </Animated.View>
        )}

        {isTyping && (
          <Animated.View
            entering={FadeInRight.duration(150)}
            exiting={FadeOutRight.duration(150)}
            style={{ marginLeft: 10 }}
          >
            <TouchableButton
              style={{
                padding: spacing(10),
                paddingLeft: spacing(11),
                paddingRight: spacing(9),
                backgroundColor: theme.colors.primary,
                borderRadius: 10,
              }}
              onPress={() => handleSend(message, attachments)}
            >
              <Ionicons
                name="send"
                size={fontSize(18)}
                color={theme.colors.white}
              />
            </TouchableButton>
          </Animated.View>
        )}
      </View>

      <EmojiKeyboard
        visible={showEmojiPicker}
        onSelect={(emoji: any) => {
          setMessage(prev => prev + emoji);
        }}
      />
      <EmojiReactor
        visible={!!reactorVisibleFor}
        anchorX={reactorPos.left}
        anchorY={reactorPos.top}
        onSelect={handleSelectReaction}
        onDismiss={() => setReactorVisibleFor(null)}
      />
    </KeyboardAvoider>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(8),
    width: scale(150),
  },
  userName: {
    fontSize: fontSize(15),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[900],
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatar: {
    marginRight: spacing(8),
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(10),
    borderRadius: fontSize(12),
  },
  myMessage: {
    backgroundColor: theme.colors.gray[950],
    borderBottomRightRadius: fontSize(4),
  },
  otherMessage: {
    backgroundColor: theme.colors.gray[100],
    borderBottomLeftRadius: fontSize(4),
  },
  messageText: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
  },
  textWithTime: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  messageTextFlex: {
    flexShrink: 1,
  },
  bubbleTimestamp: {
    fontSize: fontSize(10),
    lineHeight: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    marginLeft: 'auto',
    paddingLeft: spacing(8),
  },
  mediaTimestamp: {
    fontSize: fontSize(10),
    lineHeight: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    alignSelf: 'flex-end' as const,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: spacing(20),
    paddingTop: spacing(10),
    paddingBottom: isAndroid ? spacing(5) : spacing(5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: fontSize(8),
    paddingHorizontal: spacing(14),
    paddingVertical: Platform.OS === 'ios' ? spacing(6) : spacing(2),
    height: Platform.OS === 'ios' ? verticalScale(40) : 'auto',
    shadowColor: theme.colors.gray[400],
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
  },
  input: {
    flex: 1,
    fontSize: fontSize(14),
    lineHeight: 20,
    color: theme.colors.gray[900],
    paddingHorizontal: spacing(8),
    fontFamily: theme.fonts.lato.regular,
  },
  circleButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing(10),
  },
  replyIconLeft: {
    position: 'absolute',
    top: 10,
    left: -35,
    zIndex: 50,
  },
  replyIconRight: {
    position: 'absolute',
    top: 10,
    right: -35,
    zIndex: 50,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[100],

    // borderLeftWidth: 4,
    // borderLeftColor: '#1C2B68', // same navy bar as screenshot
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(12),
    marginHorizontal: spacing(16),
    marginBottom: spacing(4),
    borderRadius: 12,
    position: 'relative',
    top: spacing(12),
    zIndex: 999,
    // borderWidth: 1,
    // borderColor: theme.colors.gray[200],
  },

  replyLine: {
    width: 3,
    height: '100%',
    backgroundColor: theme.colors.primary,

    borderRadius: 20,
  },

  replyContent: {
    flex: 1,
    paddingLeft: spacing(10),
    borderRadius: fontSize(8),
  },

  replyName: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    color: '#111827',
    marginBottom: 2,
  },

  replyText: {
    fontSize: fontSize(14),
    color: '#374151',
    fontFamily: theme.fonts.lato.regular,
  },

  replyCloseBtn: {
    padding: 6,
  },
  dateSeparatorRow: {
    alignItems: 'center',
    marginVertical: spacing(8),
  },
  dateSeparatorPill: {
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(4),
    borderRadius: 100,
  },
  dateSeparatorText: {
    fontSize: fontSize(11),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[700],
  },
  typingStack: {
    gap: spacing(8),
    marginBottom: spacing(8),
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  typingAvatar: {
    marginRight: spacing(8),
  },
  typingBubbleColumn: {
    alignItems: 'flex-start',
  },
  typingBubble: {
    marginBottom: 0,
  },
  typingName: {
    fontSize: fontSize(11),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[600],
    marginBottom: spacing(4),
    paddingLeft: spacing(4),
  },
  floatingDateContainer: {
    position: 'absolute',
    top: spacing(8),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
});
