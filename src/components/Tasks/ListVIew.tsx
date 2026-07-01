import { useQueries, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { getAllTasks, getTask } from '../../api/functions/task.api';
import { Task } from '../../typescript/interface/task.interface';
import { getAllStatuses } from '../../api/functions/status.api';
import { InteractionManager, Text, View } from 'react-native';
import { FLOATING_BAR_FOOTPRINT } from '../Chat/FloatingChatHost';
import { Filter } from '../../typescript/interface/common.interface';
import { createStyleSheet } from 'react-native-unistyles';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import TaskListSkeleton from '../skeletons/TaskListSkeleton';
import TaskSectionList from './TaskSectionList';

export default function ListView({
  sort,
  filters,
}: {
  sort: string;
  filters: Filter[];
}) {
  const queryClient = useQueryClient();

  const [
    { data: tasks = [], isLoading, isFetching, refetch },
    {
      data: status = [],
      isLoading: isStatusLoading,
      isFetching: isStatusFetching,
      refetch: statusRefetch,
    },
  ] = useQueries({
    queries: [
      {
        // Sort is applied client-side (see TaskSectionList), so it is NOT part
        // of the query key — changing sort re-orders the cached list instantly
        // without a refetch.
        queryKey: ['tasks', filters],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getAllTasks(
            {
              filter: filters,
            },
            signal,
          ),
        placeholderData: (prev: Task[] | undefined) => prev,
      },
      {
        queryKey: ['status'],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getAllStatuses(signal),
      },
    ],
  });

  // Stable key that only changes when the actual task list changes
  const taskIds = tasks.map(t => t._id).join(',');

  // Prefetch individual task details after tasks load,
  // staggered via InteractionManager so the UI doesn't freeze
  React.useEffect(() => {
    if (tasks.length === 0) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const handle = InteractionManager.runAfterInteractions(() => {
      const BATCH_SIZE = 3;
      let i = 0;

      const prefetchBatch = () => {
        const batch = tasks.slice(i, i + BATCH_SIZE);
        batch.forEach(task => {
          queryClient.prefetchQuery({
            queryKey: ['task', task._id],
            queryFn: ({ signal }) => getTask(task._id, signal),
            staleTime: 5 * 60 * 1000,
          });
        });
        i += BATCH_SIZE;
        if (i < tasks.length) {
          timeouts.push(setTimeout(prefetchBatch, 200));
        }
      };

      prefetchBatch();
    });

    return () => {
      handle.cancel();
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskIds, queryClient]);

  if (isLoading || isStatusLoading) return <TaskListSkeleton />;

  return (
    <TaskSectionList
      tasks={tasks}
      statuses={status}
      sort={sort}
      refreshing={isFetching || isStatusFetching}
      onRefresh={() => {
        refetch();
        statusRefetch();
      }}
      contentContainerStyle={{ paddingBottom: FLOATING_BAR_FOOTPRINT }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks found.</Text>
        </View>
      }
    />
  );
}

const styles = createStyleSheet({
  emptyContainer: {
    marginTop: spacing(30),
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.gray[500],
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
  },
});
