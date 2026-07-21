import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import ChatRoomSkeleton from '../../components/skeletons/ChatRoomSkeleton';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import moment from 'moment';
import Animated, {
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { getConversationByCoach } from '../../api/functions/chat.api';
import { getMessagesByCoach } from '../../api/functions/message.api';
import { formatChatDateSeparator } from '../../helpers/utils';
import {
  clearChatNotifications,
  setFocusedChat,
} from '../../notifications';
import { ChevronLeft } from '../../assets';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { theme } from '../../theme';
import { getSenderColor } from '../../constants/taxonomyColors';
import { AppStackParamList } from '../../types/navigation';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { PaginatedResponse } from '../../typescript/interface/common.interface';
import {
  Message,
  MessageStatus,
} from '../../typescript/interface/message.interface';
import { queryClient } from '../../../App';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import {
  fontSize,
  isAndroid,
  scale,
  spacing,
  verticalScale,
} from '../../utils';
// import { , scheduleOnRN } from 'react-native-worklets';
import { Platform } from 'react-native';
import { randomUUID } from 'react-native-quick-crypto';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AttachmentViewer from '../../components/Chat/AttachementViewer';
import { FileMessage } from '../../components/Chat/FileMessage';
import LinkifiedText from '../../components/Chat/LinkifiedText';
import { ImageMessage } from '../../components/Chat/ImageMessage';
import { VideoMessage } from '../../components/Chat/VideoMessage';
import TouchableButton from '../../components/TouchableButton';
import Feather from 'react-native-vector-icons/Feather';

type ChatRoomTaskNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'CoachChatRoom'
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
  userId,
}: {
  item: Message;
  conversation: ChatConversation | undefined;
  userId: string;
}) => {
  const bubbleRef = useRef<any>(null);
  const isMe = conversation?.isDeletable ? item.sender?._id === userId : false;

  const [attachmentIndex, setAttachmentIndex] = useState<number | null>(null);

  return (
    <>
      <Animated.View
        entering={FadeInUp.springify().mass(0.5).damping(15).duration(120)}
        layout={LinearTransition.springify()}
        style={{ marginBottom: spacing(10) }}
      >
        <View
          style={[
            styles.messageRow,
            { justifyContent: isMe ? 'flex-end' : 'flex-start' },
          ]}
        >
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
            style={[
              styles.messageBubble,
              isMe ? styles.myMessage : styles.otherMessage,
            ]}
          >
            {conversation?.type === 'group' && !isMe && (
              <Text
                style={[
                  styles.senderName,
                  { color: getSenderColor(item.sender?._id) },
                ]}
                numberOfLines={1}
              >
                {item.sender?.fullName}
              </Text>
            )}
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
                    {item.replyTo.sender?._id === userId
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
              <LinkifiedText
                text={item.content}
                linkColor={isMe ? theme.colors.white : '#2563EB'}
                style={[
                  styles.messageText,
                  {
                    color: isMe ? theme.colors.white : theme.colors.gray[900],
                  },
                ]}
              />
            ) : item.type === 'image' ? (
              <View style={{ paddingHorizontal: 0 }}>
                <ImageMessage
                  message={item}
                  setSelected={index => setAttachmentIndex(index)}
                  isMe={isMe}
                />
              </View>
            ) : item.type === 'video' ? (
              <VideoMessage
                message={item}
                setSelected={index => setAttachmentIndex(index)}
                isMe={isMe}
              />
            ) : (
              <FileMessage message={item} isMe={isMe} />
            )}
          </TouchableOpacity>
        </View>

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

const CoachChatScreen = () => {
  const insets = useSafeAreaInsets();
  const activeRoomRef = useRef<string | null>(null);
  const navigation = useNavigation<ChatRoomTaskNavigationProp>();
  const route = useRoute<RouteProp<AppStackParamList, 'CoachChatRoom'>>();
  const { roomId: room, userId } = route.params;

  const socket = useSocket();
  const { profile } = useAuth();
  const messageKeyMap = useRef<Map<string, string>>(new Map());

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
    queryKey: ['messages', room],
    queryFn: ctx => getMessagesByCoach(ctx),
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
    // Coach context: use the coach endpoint (matches ClientDetails' prefetch);
    // the regular getConversation would hit the wrong endpoint on refetch.
    queryFn: ({ signal }) => getConversationByCoach(room, signal),
    enabled: !!room,
  });

  const friend = conversation?.members?.find(
    _member => _member.user._id !== userId,
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

  const [floatingDate, setFloatingDate] = useState<string | null>(null);
  const floatingOpacity = useSharedValue(0);
  const hideFloatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleMessagesScroll = () => {
    floatingOpacity.value = withTiming(1, { duration: 150 });
    if (hideFloatingTimerRef.current) clearTimeout(hideFloatingTimerRef.current);
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

  // NOTE: This is a read-only coach/staff view of a CLIENT's chat. It must NOT
  // emit `mark_seen` — reading here must never change the client's seen status
  // or unread count. (The route `userId` is the CLIENT's id, so emitting it
  // would pass the backend membership guard and wrongly mark the client's
  // messages read.) We only subscribe to realtime updates for display.

  // Join the chat room and subscribe to realtime message/seen/reaction events.
  useEffect(() => {
    if (!socket || !room) return;

    const joinRoom = () => {
      socket.emit('join_room', {
        // Identify with the coach's own id, not the client route param.
        chatId: room,
        userId: profile?._id,
        friendId: friend?.user._id,
        isGroup: conversation?.type === 'group',
      });
    };

    // Join on mount and rejoin on reconnection (new server socket = lost rooms).
    joinRoom();
    socket.on('connect', joinRoom);

    // NEW MESSAGE (from server) — reconcile optimistic tempId, dedup, prepend.
    const handleNewMessage = (msg: Message) => {
      if (msg.chat !== room) return;

      if (msg.tempId && msg._id) {
        const oldKey = messageKeyMap.current.get(msg.tempId);
        if (oldKey) messageKeyMap.current.set(msg._id, oldKey);
      }

      queryClient.setQueryData<
        InfiniteData<PaginatedResponse<Message[]>, number>
      >(['messages', room], old => {
        if (!old) return old;
        const firstPage = old.pages[0];
        if (!firstPage) return old;
        const existingMessages = firstPage.data;

        const tempIdx = existingMessages.findIndex(
          m => m.tempId && msg.tempId && m.tempId === msg.tempId,
        );
        if (tempIdx !== -1) {
          const newMessages = [...existingMessages];
          newMessages[tempIdx] = { ...msg, status: 'sent' as MessageStatus };
          return {
            ...old,
            pages: [{ ...firstPage, data: newMessages }, ...old.pages.slice(1)],
            pageParams: old.pageParams,
          };
        }

        const exists = existingMessages.some(
          m =>
            (m._id && msg._id && m._id === msg._id) ||
            (m.tempId && msg.tempId && m.tempId === msg.tempId),
        );
        if (exists) return old;

        return {
          ...old,
          pages: [
            {
              ...firstPage,
              data: [
                { ...msg, status: 'sent' as MessageStatus },
                ...existingMessages,
              ],
            },
            ...old.pages.slice(1),
          ],
          pageParams: old.pageParams,
        };
      });
    };

    // SEEN receipts — flip my sent messages to 'seen', and zero my own unread.
    const handleSeenBulk = ({
      chatId,
      userId: seenUserId,
    }: {
      chatId: string;
      userId: string;
    }) => {
      if (chatId !== room) return;

      if (seenUserId !== userId) {
        queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
          ['messages', chatId],
          old => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                data: page.data.map(m =>
                  m.sender?._id === userId
                    ? { ...m, status: 'seen' as MessageStatus }
                    : m,
                ),
              })),
            };
          },
        );
      }

      if (seenUserId === userId) {
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
    };

    const handleReaction = ({
      messageId,
      reactions,
    }: {
      messageId: string;
      reactions: Message['reactions'];
    }) => {
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
        ['messages', room],
        old => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              data: page.data.map(m =>
                m._id === messageId ? { ...m, reactions } : m,
              ),
            })),
          };
        },
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_seen_update_bulk', handleSeenBulk);
    socket.on('reaction_updated', handleReaction);

    return () => {
      socket.off('connect', joinRoom);
      socket.emit('leave_room', { chatId: room, userId: profile?._id });
      // Remove the exact handler instances so listeners don't leak/accumulate
      // across room changes and remounts.
      socket.off('new_message', handleNewMessage);
      socket.off('message_seen_update_bulk', handleSeenBulk);
      socket.off('reaction_updated', handleReaction);
    };
  }, [socket, room, userId, profile?._id, friend?.user?._id, conversation?.type]);

  if (isLoading || isConversationLoading) return <ChatRoomSkeleton />;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={insets.top}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableButton
          style={{ paddingVertical: spacing(4), paddingHorizontal: spacing(8) }}
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
          <Text style={styles.userName}>{details.name}</Text>
        </View>
        {conversation?.type === 'direct' ? (
          <View style={{ width: 24 }} />
        ) : (
          <TouchableButton
            style={{ padding: 4, borderRadius: 100 }}
            onPress={() =>
              navigation.navigate('GroupScreen', {
                roomId: room,
                byCoach: true,
              })
            }
          >
            <Feather name="info" color="#333" size={fontSize(18)} />
          </TouchableButton>
        )}
      </View>

      {/* Messages */}
      <View style={{ flex: 1 }}>
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
                userId={userId}
              />
            );
          }}
          keyExtractor={item =>
            isDateSeparator(item) ? item.id : getStableKey(item)
          }
          inverted
          showsVerticalScrollIndicator={false}
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
        {floatingDate && (
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
    </KeyboardAvoidingView>
  );
};

export default CoachChatScreen;

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
  senderName: {
    fontSize: fontSize(11),
    fontFamily: theme.fonts.archivo.semiBold,
    letterSpacing: 0.2,
    marginBottom: spacing(3),
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
  floatingDateContainer: {
    position: 'absolute',
    top: spacing(8),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
});
