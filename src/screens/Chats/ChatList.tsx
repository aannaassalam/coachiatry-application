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
import ChatMessage from '../../components/Chat/ChatMessage';
import Entypo from 'react-native-vector-icons/Entypo';

type ChatScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'ChatRoom'
>;

export default function ChatList() {
  const { profile } = useAuth();
  const socket = useSocket();
  const navigation = useNavigation<ChatScreenNavigationProp>();

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

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getAllConversations({ limit: 50, sort: '-updatedAt' }),
  });

  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdated = (update: {
      chatId: string;
      lastMessage: Message;
      updatedAt: string;
    }) => {
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
          const getSortTime = (chat: ChatConversation) =>
            moment(chat.lastMessage?.createdAt ?? chat.createdAt).valueOf();

          newList.sort((a, b) => getSortTime(b) - getSortTime(a));

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
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: spacing(20),
              marginTop: spacing(5),
              marginBottom: spacing(10),
            }}
          >
            <Text style={{ color: theme.colors.gray[800] }}>All message</Text>
            <TouchableButton
              onPress={() => navigation.navigate('GroupScreen', {})}
            >
              <Entypo
                name="plus"
                size={fontSize(18)}
                color={theme.colors.gray[700]}
              />
            </TouchableButton>
          </View>
          <FlatList
            data={data?.data}
            renderItem={({ item }) => <ChatMessage item={item} />}
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
        </View>
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
});
