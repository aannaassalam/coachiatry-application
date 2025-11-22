import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import TouchableButton from '../../components/TouchableButton';
import AppHeader from '../../components/ui/AppHeader';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { PaginatedResponse } from '../../typescript/interface/common.interface';
import { fontSize, scale, spacing } from '../../utils';
import {
  getAllConversations,
  getConversation,
} from '../../api/functions/chat.api';
import { Message } from '../../typescript/interface/message.interface';
import { useSocket } from '../../hooks/useSocket';
import { useEffect, useRef } from 'react';
import { queryClient } from '../../../App';
import { getMessages } from '../../api/functions/message.api';

type ChatScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'ChatRoom'
>;

export default function ChatList() {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { profile } = useAuth();
  const socket = useSocket();

  const viewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<ViewToken & { item: ChatConversation }>;
    }) => {
      viewableItems.forEach(({ item }) => {
        queryClient.prefetchQuery({
          queryKey: ['conversations', item._id],
          queryFn: () => getConversation(item._id),
        });
        queryClient.prefetchInfiniteQuery({
          queryKey: ['messages', item._id],
          queryFn: getMessages,
          initialPageParam: 1,
        });
      });
    },
  ).current;

  // const {
  //   data,
  //   isLoading,
  //   isFetchingNextPage,
  //   fetchNextPage,
  //   hasNextPage,
  //   refetch,
  //   isRefetching,
  // } = useInfiniteQuery<PaginatedResponse<ChatConversation[]>>({
  //   queryKey: ['conversations'],
  //   queryFn: ({ pageParam = 1 }) =>
  //     getAllConversations({ page: pageParam as number, sort: '-updatedAt' }),
  //   getNextPageParam: lastPage => {
  //     if (!lastPage?.meta) return undefined;
  //     const { currentPage, totalPages } = lastPage.meta;
  //     return currentPage < totalPages ? currentPage + 1 : undefined;
  //   },
  //   initialPageParam: 1,
  //   staleTime: 60 * 1000,
  // });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getAllConversations({ limit: 50, sort: '-updatedAt' }),
  });

  // const chats = data?.pages.flatMap(page => page.data) ?? [];
  // const isRefreshing =
  //   !!data && isRefetching && !isFetchingNextPage && !isLoading;

  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdated = (update: {
      chatId: string;
      lastMessage: Message;
      updatedAt: string;
    }) => {
      console.log('message');
      queryClient.setQueryData<PaginatedResponse<ChatConversation[]>>(
        ['conversations'],
        old => {
          if (!old) return old;

          const existing = Array.isArray(old.data) ? [...old.data] : [];
          const idx = existing.findIndex(c => c._id === update.chatId);

          const isMyMessage = update.lastMessage?.sender?._id === profile?._id;

          const current = existing[idx];
          const updatedConv = {
            ...current,
            lastMessage: update.lastMessage,
            updatedAt: update.updatedAt,
            unreadCount: current.unreadCount || 0,
          } as ChatConversation;

          if (idx > -1) {
            // ✅ Only increase unread count if:
            // - this message is NOT mine
            // - and I am NOT currently inside that chat
            if (!isMyMessage) {
              updatedConv.unreadCount = (current.unreadCount || 0) + 1;
            }
          }

          const newList = [
            updatedConv,
            ...existing.filter((_, i) => i !== idx),
          ];

          // ✅ Sort newest → oldest
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
    };

    socket.on('conversation_updated', handleConversationUpdated);
    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
    };
  }, [socket, profile?._id]);

  return (
    <View style={styles.container}>
      <AppHeader heading="Chats" showSearch />

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={data?.data}
          renderItem={({ item }) => {
            const chatUser = item.members.find(
              _member => _member.user._id !== profile?._id,
            );
            const details: { photo?: string; name?: string } = {
              photo: chatUser?.user.photo,
              name: chatUser?.user.fullName,
            };

            if (item && item.type === 'group') {
              details.photo = item.groupPhoto;
              details.name = item.name;
            }

            return (
              <TouchableButton
                onPress={() => {
                  // handle onPress
                  navigation.navigate('ChatRoom', { roomId: item._id! });
                }}
                style={styles.card}
              >
                <SmartAvatar
                  src={details.photo}
                  name={details.name}
                  size={scale(40)}
                  fontSize={fontSize(18)}
                />

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{details.name}</Text>

                  <Text
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    style={[
                      styles.cardContent,
                      item.unreadCount > 0 && {
                        fontFamily: theme.fonts.archivo.semiBold,
                        color: theme.colors.gray[600],
                      },
                    ]}
                  >
                    {item.lastMessage?.sender?._id === profile?._id &&
                    item.isDeletable
                      ? 'You: '
                      : null}
                    {item.lastMessage?.content ||
                      (item.lastMessage?.type === 'image'
                        ? '📷 Images'
                        : item.lastMessage?.type === 'video'
                          ? '🎥 Videos'
                          : item.lastMessage?.type === 'file'
                            ? '📁 Files'
                            : undefined)}
                  </Text>
                </View>

                <View style={styles.meta}>
                  <Text
                    style={[
                      styles.time,
                      item.unreadCount > 0 && {
                        fontFamily: theme.fonts.archivo.semiBold,
                      },
                    ]}
                  >
                    {item.lastMessage?.createdAt
                      ? moment(item.lastMessage?.createdAt).fromNow(true)
                      : null}
                  </Text>

                  {item.unreadCount > 0 && (
                    <View style={styles.unreadCount}>
                      <Text style={styles.unreadCountText}>
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableButton>
            );
          }}
          keyExtractor={item => item._id ?? item.createdAt}
          refreshing={isFetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 60, // triggers when 60% visible
          }}
          // onEndReached={() => {
          //   if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          // }}
          // onEndReachedThreshold={0.3}
          // ListFooterComponent={
          //   isFetchingNextPage ? (
          //     <View
          //       style={{ paddingVertical: spacing(10), alignItems: 'center' }}
          //     >
          //       <Text
          //         style={{
          //           color: theme.colors.gray[500],
          //           fontSize: fontSize(14),
          //         }}
          //       >
          //         Loading...
          //       </Text>
          //     </View>
          //   ) : null
          // }
          contentContainerStyle={{ paddingHorizontal: spacing(10) }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Header */
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
    position: 'relative',
  },
  /** Card */
  card: {
    // height: 66,
    // paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(10),
    gap: spacing(12),
    // justifyContent: 'flex-start',
  },
  cardImg: {
    width: 40,
    height: 40,
    borderRadius: 9999,
  },
  cardBody: {
    // maxWidth: '100%',
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.semiBold,
    color: '#222',
    lineHeight: 20,
  },
  cardContent: {
    fontSize: 15,
    fontFamily: theme.fonts.archivo.medium,
    color: '#808080',
    lineHeight: 20,
    marginTop: spacing(3),
  },
  meta: {
    flexDirection: 'column',
    gap: spacing(8),
    alignItems: 'flex-end',
  },
  time: {
    color: theme.colors.gray[500],
    fontSize: fontSize(12),
    fontFamily: theme.fonts.archivo.medium,
  },
  unreadCount: {
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(2),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  unreadCountText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.archivo.medium,
  },
});
