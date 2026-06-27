import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { getAllTasks, getTask } from '../../api/functions/task.api';
import { Filter } from '../../typescript/interface/common.interface';
import { FlatList, Text, View, ViewToken } from 'react-native';
import WeekTaskCard from './WeekTaskCard';
import WeekViewSkeleton from '../skeletons/WeekViewSkeleton';
import moment from 'moment';
import { createStyleSheet } from 'react-native-unistyles';
import { fontSize, spacing } from '../../utils';
import { theme } from '../../theme';
import { Task } from '../../typescript/interface/task.interface';
import { FLOATING_BAR_FOOTPRINT } from '../Chat/FloatingChatHost';

const days = [
  {
    title: 'Monday',
    bgColor: '#fed7aa99',
    accentColor: '#ea580cCC',
  },
  {
    title: 'Tuesday',
    bgColor: '#9300A91F',
    accentColor: '#9300A9',
  },
  {
    title: 'Wednesday',
    bgColor: '#4302E81F',
    accentColor: '#4302E8',
  },
  {
    title: 'Thursday',
    bgColor: '#026AE81F',
    accentColor: '#026AE8',
  },
  {
    title: 'Friday',
    bgColor: '#fed7aaCC',
    accentColor: '#ea580cCC',
  },
  {
    title: 'Saturday',
    bgColor: '#9300A91F',
    accentColor: '#9300A9',
  },
  {
    title: 'Sunday',
    bgColor: '#4302E81F',
    accentColor: '#4302E8',
  },
];

export default function WeekView({
  dates,
  filters,
}: {
  dates: { start: string; end: string };
  filters: Filter[];
}) {
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['tasks', filters, dates],
    queryFn: ({ signal }) =>
      getAllTasks(
        {
          filter: filters,
          startDate: dates.start,
          endDate: dates.end,
        },
        signal,
      ),
    // placeholderData: (prev: Task[] | undefined) => prev
  });

  const onViewableItemsChanged = React.useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<(typeof days)[number]>[];
    }) => {
      viewableItems.forEach(({ index }) => {
        if (index === null || index === undefined || !data) return;

        // get date for that visible day
        const date = moment(dates.start).add(index, 'day').format('DD/MM/YYYY');

        // filter tasks for that day
        const tasksForDay = data.filter(
          task => moment(task.dueDate).format('DD/MM/YYYY') === date,
        );

        // prefetch each task
        tasksForDay.forEach(task => {
          queryClient.prefetchQuery({
            queryKey: ['task', task._id],
            queryFn: ({ signal }) => getTask(task._id, signal),
            staleTime: 5 * 60 * 1000,
          });
        });
      });
    },
    [data, dates.start, queryClient],
  );

  // Bucket tasks by their due-day and precompute each column's date once per
  // data/range change — the previous renderItem ran 7 × N moment().format()
  // filters on every render.
  const tasksByDay = React.useMemo(() => {
    const map: Record<string, Task[]> = {};
    (data ?? []).forEach(task => {
      const key = moment(task.dueDate).format('DD/MM/YYYY');
      (map[key] ??= []).push(task);
    });
    return map;
  }, [data]);

  const dayDates = React.useMemo(
    () =>
      days.map((_, index) => ({
        key: moment(dates.start).add(index, 'day').format('DD/MM/YYYY'),
        date: moment(dates.start).add(index, 'day').format('YYYY-MM-DD'),
      })),
    [dates.start],
  );

  if (isLoading) return <WeekViewSkeleton />;

  return (
    <FlatList
      data={days}
      renderItem={({ item, index }) => (
        <WeekTaskCard
          day={item}
          defaultExpanded={index === 0}
          tasks={tasksByDay[dayDates[index].key] ?? []}
          date={dayDates[index].date}
        />
      )}
      keyExtractor={item => item.title}
      refreshing={isFetching}
      onRefresh={refetch}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks found.</Text>
        </View>
      }
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 100,
      }}
      contentContainerStyle={{
        padding: spacing(20),
        paddingBottom: FLOATING_BAR_FOOTPRINT,
      }}
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
