import { useQueries } from '@tanstack/react-query';
import React from 'react';
import { getAllTasks } from '../../api/functions/task.api';
import { Task } from '../../typescript/interface/task.interface';
import { getAllStatuses } from '../../api/functions/status.api';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import TaskCard from './TaskCard';
import { Filter } from '../../typescript/interface/common.interface';
import { createStyleSheet } from 'react-native-unistyles';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';

export default function ListView({
  sort,
  filters,
}: {
  sort: string;
  filters: Filter[];
}) {
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
        queryKey: ['tasks', sort, filters],
        queryFn: () =>
          getAllTasks({
            sort: sort,
            filter: filters,
          }),
        placeholderData: (prev: Task[] | undefined) => prev,
      },
      {
        queryKey: ['status'],
        queryFn: getAllStatuses,
      },
    ],
  });

  if (isLoading || isStatusLoading)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <FlatList
      data={status.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))}
      renderItem={({ item, index }) => (
        <TaskCard
          status={item}
          defaultExpanded={index === 0}
          tasks={tasks.filter(_task => _task.status._id === item._id)}
        />
      )}
      keyExtractor={item => item._id}
      refreshing={isFetching || isStatusFetching}
      onRefresh={() => {
        refetch();
        statusRefetch();
      }}
      showsVerticalScrollIndicator={false}
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
