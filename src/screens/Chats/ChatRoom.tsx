import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  GestureResponderEvent,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  assets,
  ChatAttachment,
  ChatClock,
  ChatCoach,
  ChevronLeft,
} from '../../assets';
import EmojiReactor from '../../components/Chat/EmojiReactor';
import { theme } from '../../theme';
import { fontSize, scale, spacing, verticalScale } from '../../utils';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { getConversation } from '../../api/functions/chat.api';
import { getMessages } from '../../api/functions/message.api';
import { useAuth } from '../../hooks/useAuth';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import {
  Message,
  MessageStatus,
} from '../../typescript/interface/message.interface';
import { useSocket } from '../../hooks/useSocket';
import { queryClient } from '../../../App';
import { PaginatedResponse } from '../../typescript/interface/common.interface';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import moment from 'moment';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  LinearTransition,
  FadeInRight,
  FadeOutRight,
  FadeInUp,
} from 'react-native-reanimated';
// import { , scheduleOnRN } from 'react-native-worklets';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { hapticOptions } from '../../helpers/utils';
import Lucide from '@react-native-vector-icons/lucide';
import TypingIndicator from '../../components/Chat/TypingIndicator';
import { KeyboardAvoidingView } from 'react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TouchableButton from '../../components/TouchableButton';

const MAX_SWIPE = 60; // how far message can move, just like WhatsApp
const SWIPE_REPLY_THRESHOLD = 40;
const ACTIVE_SWIPE_START = 12;

type ChatRoomTaskNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'ChatRoom'
>;

const RenderMessage = ({
  item,
  conversation,
}: {
  item: Message;
  conversation: ChatConversation | undefined;
}) => {
  const { profile } = useAuth();
  const isMe = conversation?.isDeletable
    ? item.sender?._id === profile?._id
    : false;

  const triggerHaptics = () => {
    ReactNativeHapticFeedback.trigger('rigid', hapticOptions);
  };

  const translateX = useSharedValue(0);
  const hasTriggered = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .activeOffsetX(isMe ? [-ACTIVE_SWIPE_START, 0] : [0, ACTIVE_SWIPE_START])
    .failOffsetY([-10, 10])
    .onUpdate(e => {
      // Limit movement
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
      }
    })
    .onFinalize(() => {
      // Reset for next swipe
      hasTriggered.value = false;

      // const shouldTrigger =
      //   (!isMe && translateX.value > SWIPE_REPLY_THRESHOLD) ||
      //   (isMe && translateX.value < -SWIPE_REPLY_THRESHOLD);

      translateX.value = withTiming(0, { duration: 150 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => {
    const progress = Math.min(
      1,
      Math.abs(translateX.value) / 40, // fade + slide in early
    );

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
    <Animated.View
      entering={FadeInUp.springify().mass(0.5).damping(15).duration(120)} // <-- WhatsApp-like pop animation
      layout={LinearTransition.springify()} // <-- keeps list smooth when items change
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
              <Lucide name="reply" size={18} color="#666" />
            </Animated.View>
          )}

          {isMe && (
            <Animated.View style={[styles.replyIconRight, arrowStyle]}>
              <Lucide name="reply" size={18} color="#666" />
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
            activeOpacity={0.9}
            // onLongPress={e => handleLongPress(e, item._id!)}
            style={[
              styles.messageBubble,
              isMe ? styles.myMessage : styles.otherMessage,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: isMe ? theme.colors.white : theme.colors.gray[900] },
              ]}
            >
              {item.content}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

const ChatScreen = () => {
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const socket = useSocket();
  const { profile } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeRoomRef = useRef<string | null>(null);
  const navigation = useNavigation<ChatRoomTaskNavigationProp>();
  const route = useRoute<RouteProp<AppStackParamList, 'ChatRoom'>>();
  const { roomId: room } = route.params;

  const [reactorVisible, setReactorVisible] = useState(false);
  const [reactorPos, setReactorPos] = useState({ top: 0, left: 0 });
  const [message, setMessage] = useState('');
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<'online' | 'offline'>(
    'offline',
  );
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const messageKeyMap = useRef<Map<string, string>>(new Map());
  const isTyping = message.length > 0;

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
    const stableKey = crypto.randomUUID();
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
    queryKey: ['messages', room],
    queryFn: getMessages,
    initialPageParam: 1,
    enabled: !!room,
    getNextPageParam: lastPage => {
      if (lastPage.meta.currentPage < lastPage.meta.totalPages) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
  });

  const { data: conversation, isLoading: isConversationLoading } = useQuery({
    queryKey: ['conversations', room],
    queryFn: () => getConversation(room),
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

  useEffect(() => {
    activeRoomRef.current = room; // current chat ID
    return () => {
      activeRoomRef.current = null; // user left chat
    };
  }, [room]);

  useEffect(() => {
    console.log(socket);
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

  useEffect(() => {
    if (!room || !profile?._id || !socket) return;
    if (!messagesData?.pages?.[0]?.data?.length) return;

    socket.emit('mark_seen', { chatId: room, userId: profile?._id });
  }, [messagesData, profile?._id, room, socket]);

  useEffect(() => {
    if (!socket) return;
    if (!room) return;

    socket.emit('join_room', {
      chatId: room,
      userId: profile?._id,
      friendId: friend?.user._id,
      isGroup: conversation?.type === 'group',
    });

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

      // Update conversation preview list
      queryClient.setQueryData<PaginatedResponse<ChatConversation[]>>(
        ['conversations'],
        old => {
          if (!old) return old;

          const idx = old.data.findIndex(c => c._id === msg.chat);

          let newData: ChatConversation[];

          if (idx > -1) {
            const updatedConv = {
              ...old.data[idx],
              lastMessage: msg,
              updatedAt: msg.updatedAt ?? new Date().toISOString(),
            };

            if (
              msg.sender?._id !== profile?._id &&
              activeRoomRef.current !== msg.chat
            ) {
              console.log('INCREMENTING UNREAD:', {
                msgChat: msg.chat,
                activeRoom: activeRoomRef.current,
                text: msg.content,
              });
              updatedConv.unreadCount = (updatedConv.unreadCount || 0) + 1;
            }

            newData = [...old.data];
            newData[idx] = updatedConv;
          } else {
            newData = [...old.data];
          }

          newData.sort((a, b) => {
            const aCreated = a.lastMessage?.createdAt;
            const bCreated = b.lastMessage?.createdAt;

            if (!aCreated && !bCreated) return 0;
            if (!aCreated) return 1; // a goes to bottom
            if (!bCreated) return -1; // b goes to bottom

            return moment(bCreated).valueOf() - moment(aCreated).valueOf();
          });

          return { ...old, data: newData };
        },
      );
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
        queryClient.setQueryData<PaginatedResponse<ChatConversation[]>>(
          ['conversations'],
          old => {
            if (!old) return old;
            const existing = [...old.data];
            const idx = existing.findIndex(c => c._id === chatId);
            if (idx === -1) return old;

            const updatedConv = {
              ...existing[idx],
              unreadCount: 0,
            };

            const newList = [
              updatedConv,
              ...existing.filter((_, i) => i !== idx),
            ];

            newList.sort((a, b) => {
              const aCreated = a.lastMessage?.createdAt;
              const bCreated = b.lastMessage?.createdAt;

              if (!aCreated && !bCreated) return 0;
              if (!aCreated) return 1; // a goes to bottom
              if (!bCreated) return -1; // b goes to bottom

              return moment(bCreated).valueOf() - moment(aCreated).valueOf();
            });

            return { ...old, data: newList };
          },
        );
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

    socket.on('user_typing', ({ userId }) => {
      if (profile?._id !== userId)
        setTypingUsers(prev => [...new Set([...prev, userId])]);
    });

    socket.on('user_stop_typing', ({ userId }) => {
      setTypingUsers(prev => prev.filter(id => id !== userId));
    });

    return () => {
      socket.emit('leave_room', { chatId: room, userId: profile?._id });
      socket.off('new_message');
      socket.off('message_delivered_update');
      socket.off('message_seen_update');
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

  const handleSend = async (text: string, files: File[]) => {
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
      // replyTo: replyingTo?._id,
      files: files.map(f => ({
        url: URL.createObjectURL(f),
        type: f.type.startsWith('video')
          ? 'video'
          : f.type.startsWith('image')
            ? 'image'
            : 'file',
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

    // if (files.length > 0) {
    //   const totalSize = files.reduce((a, f) => a + f.size, 0);
    //   const progressPerFile = Array(files.length).fill(0);

    //   const uploadedFiles = await Promise.all(
    //     files.map(async (file, i) => {
    //       const controller = new AbortController();
    //       uploadManager.add(tempId, controller); // ✅ register it

    //       try {
    //         const url = await uploadMutation.mutateAsync({
    //           file,
    //           chatId: room,
    //           signal: controller.signal,
    //           onProgress: pct => {
    //             progressPerFile[i] = pct;
    //             const uploadedBytes = files.reduce(
    //               (sum, f, idx) =>
    //                 sum + (progressPerFile[idx] / 100) * f.size,
    //               0,
    //             );
    //             const overallPct = (uploadedBytes / totalSize) * 100;

    //             queryClient.setQueryData(['messages', room], (old: any) => {
    //               if (!old) return old;

    //               return {
    //                 ...old,
    //                 pages: old.pages.map((page: any, pageIndex: number) => {
    //                   // Only update the newest page (index 0)
    //                   if (pageIndex !== 0) return page;

    //                   return {
    //                     ...page,
    //                     data: page.data.map((m: any) =>
    //                       m.tempId === tempId
    //                         ? {
    //                             ...m,
    //                             overallProgress:
    //                               overallPct < 100 ? overallPct : 0, // update progress immutably
    //                             files: m.files?.map((f: any, fi: number) =>
    //                               i === fi ? { ...f, progress: pct } : f,
    //                             ),
    //                           }
    //                         : m,
    //                     ),
    //                   };
    //                 }),
    //               };
    //             });
    //           },
    //         });

    //         return {
    //           url,
    //           type: file.type.startsWith('video')
    //             ? 'video'
    //             : file.type.startsWith('image')
    //               ? 'image'
    //               : 'file',
    //           size: file.size,
    //         };
    //       } catch {
    //         if (controller.signal.aborted) {
    //           console.log('Upload cancelled:', file.name);
    //           return null;
    //         }
    //         return null;
    //       }
    //     }),
    //   );

    //   uploadManager.clear(tempId); // ✅ cleanup after done

    //   // Final update (success or fail)
    //   const validFiles = uploadedFiles.filter(Boolean);
    //   queryClient.setQueryData(['messages', room], (old: any) => {
    //     if (!old) return old;

    //     return {
    //       ...old,
    //       pages: old.pages.map((page: any, pageIndex: number) => {
    //         if (pageIndex !== 0) return page; // update only the newest page

    //         return {
    //           ...page,
    //           data: page.data.map((m: any) =>
    //             m.tempId === tempId
    //               ? {
    //                   ...m,
    //                   files: validFiles,
    //                   status: validFiles.length > 0 ? 'sent' : 'failed',
    //                   overallProgress: 100,
    //                   // Optional: mark each file as "uploading: false"
    //                   ...(validFiles?.length
    //                     ? {
    //                         files: validFiles.map((f: any) => ({
    //                           ...f,
    //                           uploading: false,
    //                           progress: 100,
    //                         })),
    //                       }
    //                     : {}),
    //                 }
    //               : m,
    //           ),
    //         };
    //       }),
    //     };
    //   });

    //   if (validFiles.length > 0) {
    //     socket.emit('send_message', {
    //       ...optimisticMessage,
    //       files: validFiles,
    //       status: 'sent',
    //     });
    //   }
    // } else {
    socket.emit('send_message', optimisticMessage);
    // }
    // setTimeout(() => {
    //   bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, 50);
  };

  const handleLongPress = (event: GestureResponderEvent, id: string) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedMsg(id);
    setReactorPos({ top: pageY - 80, left: pageX });
    setReactorVisible(true);
  };

  const handleEmojiSelect = (emoji: string) => {
    console.log(`Reacted to ${selectedMsg} with emoji: ${emoji}`);
    setReactorVisible(false);
  };

  if (isLoading || isConversationLoading)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );

  const openEmojiKeyboard = () => {
    inputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? spacing(70) : spacing(0)}
      style={[styles.container]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <SmartAvatar
            src={details.photo}
            name={details.name}
            size={scale(28)}
          />
          <Text style={styles.userName}>{details.name}</Text>
          {conversation?.type === 'direct' && friendStatus === 'online' && (
            <View style={styles.dot} />
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Messages */}
      <FlatList
        data={allMessages}
        renderItem={({ item }) => (
          <RenderMessage item={item} conversation={conversation} />
        )}
        keyExtractor={item => item._id ?? item.chat}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          typingUsers.length > 0 ? <TypingIndicator /> : null
        }
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
          // gap: spacing(10),
          flexGrow: 1,
        }}
        inverted
      />

      {/* Message Input */}
      <View style={styles.inputBar}>
        <View style={styles.inputWrapper}>
          <TouchableButton onPress={openEmojiKeyboard} activeOpacity={0.7}>
            <Ionicons
              name="happy-outline"
              size={20}
              color={theme.colors.gray[500]}
            />
          </TouchableButton>
          <TextInput
            ref={inputRef}
            placeholder="Write your message..."
            placeholderTextColor={theme.colors.gray[400]}
            style={styles.input}
            value={message}
            onChangeText={handleTyping}
            keyboardType="default"
            textContentType="none"
          />
          <TouchableButton>
            <ChatAttachment />
          </TouchableButton>
        </View>

        {!isTyping && (
          <Animated.View
            entering={FadeInRight.duration(150)}
            exiting={FadeOutRight.duration(150)}
            style={{ flexDirection: 'row', marginLeft: 10 }}
          >
            <TouchableButton style={styles.circleButton}>
              <ChatClock />
            </TouchableButton>

            <TouchableButton style={styles.circleButton}>
              <ChatCoach />
            </TouchableButton>
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
              onPress={() => handleSend(message, [])}
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
      {/* Emoji Reactor
      {reactorVisible && (
        <EmojiReactor
          position={reactorPos}
          onSelect={handleEmojiSelect}
          onDismiss={() => setReactorVisible(false)}
        />
      )} */}
    </KeyboardAvoidingView>
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
    gap: spacing(8),
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
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: spacing(20),
    paddingTop: spacing(10),
    paddingBottom: spacing(5),
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
    height: Platform.OS === 'ios' ? verticalScale(40) : verticalScale(50),
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
});
