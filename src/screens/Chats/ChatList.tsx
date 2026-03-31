import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  InfiniteData,
  useInfiniteQuery,
} from '@tanstack/react-query';
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
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { PaginatedResponse } from '../../typescript/interface/common.interface';
import { fontSize, spacing } from '../../utils';
import {
  getAllConversations,
  getConversation,
} from '../../api/functions/chat.api';
import { Message } from '../../typescript/interface/message.interface';
import { useSocket } from '../../hooks/useSocket';
import { useEffect, useRef, useState } from 'react';
import { queryClient } from '../../../App';
import { getMessages } from '../../api/functions/message.api';
import ChatMessage from '../../components/Chat/ChatMessage';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ChatSearch from '../../components/Chat/ChatSearch';

type ChatScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'ChatRoom'
>;

export default function ChatList() {
  const { profile } = useAuth();
  const socket = useSocket();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const [searchVisible, setSearchVisible] = useState(false);

  const viewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<ViewToken & { item: ChatConversation }>;
    }) => {
      viewableItems.forEach(({ item }) => {
        queryClient.prefetchQuery({
          queryKey: ['conversations', item._id],
          queryFn: ({ signal }) => getConversation(item._id, signal),
          staleTime: 5 * 60 * 1000,
        });
        queryClient.prefetchInfiniteQuery({
          queryKey: ['messages', item._id],
          queryFn: ctx => getMessages(ctx),
          initialPageParam: 1,
          staleTime: 5 * 60 * 1000,
        });
      });
    },
  ).current;

  const {
    data,
    isLoading,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam = 1, signal }) =>
      getAllConversations({ page: pageParam, sort: '-updatedAt' }, signal),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  const conversations = data?.pages.flatMap(page => page.data) ?? [];

  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdated = (update: {
      chatId: string;
      lastMessage: Message;
      updatedAt: string;
    }) => {
      console.log(update);

      // Update conversations list (infinite query shape)
      queryClient.setQueryData<
        InfiniteData<PaginatedResponse<ChatConversation[]>, number>
      >(['conversations'], old => {
        if (!old || !old.pages.length) return old;

        // Flatten all pages to find the conversation
        const allConvs = old.pages.flatMap(p => p.data);
        const idx = allConvs.findIndex(c => c._id === update.chatId);
        if (idx === -1) return old;

        const isMyMessage = update.lastMessage?.sender?._id === profile?._id;

        const current = allConvs[idx];
        const updatedConv = {
          ...current,
          lastMessage: update.lastMessage,
          updatedAt: update.updatedAt,
          unreadCount: current.unreadCount || 0,
        } as ChatConversation;

        if (!isMyMessage) {
          updatedConv.unreadCount = (current.unreadCount || 0) + 1;
        }

        // Move updated conversation to top of first page
        const withoutUpdated = allConvs.filter(
          (_, i) => i !== idx,
        );
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

      // Also upsert the message into that chat's messages cache
      if (update.lastMessage) {
        queryClient.setQueryData<
          InfiniteData<PaginatedResponse<Message[]>, number>
        >(['messages', update.chatId], old => {
          if (!old) return old;

          const firstPage = old.pages[0];
          if (!firstPage) return old;

          const exists = firstPage.data.some(
            m =>
              (m._id && m._id === update.lastMessage._id) ||
              (m.tempId &&
                update.lastMessage.tempId &&
                m.tempId === update.lastMessage.tempId),
          );

          if (exists) return old;

          return {
            ...old,
            pages: [
              { ...firstPage, data: [update.lastMessage, ...firstPage.data] },
              ...old.pages.slice(1),
            ],
          };
        });
      }
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
              alignItems: 'center',
              paddingHorizontal: spacing(20),
              marginTop: spacing(5),
              marginBottom: spacing(10),
            }}
          >
            <Text style={{ color: theme.colors.gray[800] }}>All message</Text>
            <View style={{ flexDirection: 'row', gap: spacing(12), alignItems: 'center' }}>
              <TouchableButton onPress={() => setSearchVisible(true)}>
                <Ionicons
                  name="search"
                  size={fontSize(18)}
                  color={theme.colors.gray[700]}
                />
              </TouchableButton>
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
          </View>
          <FlatList
            data={conversations}
            renderItem={({ item }) => <ChatMessage item={item} />}
            keyExtractor={item => item._id ?? item.createdAt}
            refreshing={isFetching && !isFetchingNextPage}
            onRefresh={refetch}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={viewableItemsChanged}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 60,
            }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View
                  style={{
                    paddingVertical: spacing(10),
                    alignItems: 'center',
                  }}
                >
                  <ActivityIndicator size="small" />
                </View>
              ) : null
            }
            contentContainerStyle={{ paddingHorizontal: spacing(10) }}
          />
        </View>
      )}
      <ChatSearch
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />
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
