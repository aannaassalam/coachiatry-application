import { useInfiniteQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
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
import { useDebounce } from '../../hooks/useDebounce';
import { theme } from '../../theme';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import AvatarListSkeleton from '../skeletons/AvatarListSkeleton';
import { fontSize, spacing } from '../../utils';
import ChatMessage from './ChatMessage';

export default function FloatingChatList() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 300);
  const isSearching = debouncedQuery.length > 0;

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

  const mainQuery = useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam = 1, signal }) =>
      getAllConversations({ page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  // Server-side search (matches all conversations, not just loaded pages).
  const searchQuery = useInfiniteQuery({
    queryKey: ['conversations-search', debouncedQuery],
    queryFn: ({ pageParam = 1, signal }) =>
      getAllConversations({ page: pageParam, search: debouncedQuery }, signal),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: isSearching,
  });

  const active = isSearching ? searchQuery : mainQuery;
  const listData = useMemo(
    () => active.data?.pages.flatMap(page => page.data) ?? [],
    [active.data],
  );

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

      {active.isLoading ? (
        <AvatarListSkeleton trailing paddingHorizontal={16} count={6} />
      ) : (
        <FlatList
          data={listData}
          renderItem={({ item }) => <ChatMessage item={item} fromFloating />}
          keyExtractor={item => item._id ?? item.createdAt}
          refreshing={active.isFetching && !active.isFetchingNextPage}
          onRefresh={active.refetch}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          onEndReached={() => {
            if (active.hasNextPage && !active.isFetchingNextPage)
              active.fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {isSearching ? 'No matching chats' : 'No conversations yet'}
              </Text>
            </View>
          }
          ListFooterComponent={
            active.isFetchingNextPage ? (
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
