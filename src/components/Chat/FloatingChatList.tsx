import { useInfiniteQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewToken,
} from 'react-native';
import { queryClient } from '../../../App';
import {
  getAllConversations,
  getConversation,
} from '../../api/functions/chat.api';
import { getMessages } from '../../api/functions/message.api';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { theme } from '../../theme';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { PaginatedResponse } from '../../typescript/interface/common.interface';
import AvatarListSkeleton from '../skeletons/AvatarListSkeleton';
import { Message } from '../../typescript/interface/message.interface';
import { fontSize, spacing } from '../../utils';
import { InfiniteData } from '@tanstack/react-query';
import ChatMessage from './ChatMessage';

export default function FloatingChatList() {
  const { profile } = useAuth();
  const socket = useSocket();
  const [query, setQuery] = useState('');

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

  const conversations = useMemo(
    () => data?.pages.flatMap(page => page.data) ?? [],
    [data],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(c => {
      if (c.type === 'group') {
        return (c.name ?? '').toLowerCase().includes(q);
      }
      const friend = c.members?.find(m => m.user._id !== profile?._id);
      return (friend?.user.fullName ?? '').toLowerCase().includes(q);
    });
  }, [conversations, query, profile?._id]);

  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdated = (update: {
      chatId: string;
      lastMessage: Message;
      updatedAt: string;
    }) => {
      queryClient.setQueryData<
        InfiniteData<PaginatedResponse<ChatConversation[]>, number>
      >(['conversations'], old => {
        if (!old || !old.pages.length) return old;

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

        const withoutUpdated = allConvs.filter((_, i) => i !== idx);
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
    };

    socket.on('conversation_updated', handleConversationUpdated);
    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
    };
  }, [socket, profile?._id]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Search size={16} color={theme.colors.gray[500]} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search chats"
            placeholderTextColor={theme.colors.gray[400]}
            style={styles.searchField}
          />
        </View>
      </View>

      {isLoading ? (
        <AvatarListSkeleton trailing paddingHorizontal={16} count={6} />
      ) : (
        <FlatList
          data={filtered}
          renderItem={({ item }) => <ChatMessage item={item} fromFloating />}
          keyExtractor={item => item._id ?? item.createdAt}
          refreshing={isFetching && !isFetchingNextPage}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {query ? 'No matching chats' : 'No conversations yet'}
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" />
              </View>
            ) : null
          }
          contentContainerStyle={{
            paddingHorizontal: spacing(10),
            paddingBottom: spacing(20),
            flexGrow: 1,
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  searchRow: {
    paddingHorizontal: spacing(16),
    paddingTop: spacing(10),
    paddingBottom: spacing(8),
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
    backgroundColor: theme.colors.gray[100],
    borderRadius: 10,
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(8),
  },
  searchField: {
    flex: 1,
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[900],
    padding: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(60),
  },
  emptyText: {
    color: theme.colors.gray[500],
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
  },
  footer: {
    paddingVertical: spacing(10),
    alignItems: 'center',
  },
});
