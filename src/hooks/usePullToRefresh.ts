import { useState } from 'react';

/**
 * Drives a RefreshControl's spinner from an ACTUAL user pull only — never from
 * background refetches (mount, query invalidation after a mutation, window
 * focus). Feeding `isFetching`/`isRefetching` into `refreshing` makes the
 * spinner appear on those background fetches too — e.g. it pops up when you
 * return to a list after editing an item, which is what we want to avoid.
 *
 * Usage:
 *   const { refreshing, onRefresh } = usePullToRefresh(refetch);
 *   // multiple queries:
 *   const { refreshing, onRefresh } = usePullToRefresh(
 *     () => Promise.all([refetch(), statusRefetch()]),
 *   );
 *   <FlatList refreshing={refreshing} onRefresh={onRefresh} />
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh };
}
