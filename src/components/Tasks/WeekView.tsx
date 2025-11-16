import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { getAllTasks } from '../../api/functions/task.api';
import { Filter } from '../../typescript/interface/common.interface';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import WeekTaskCard from './WeekTaskCard';
import moment from 'moment';
import { createStyleSheet } from 'react-native-unistyles';
import { fontSize, spacing } from '../../utils';
import { theme } from '../../theme';

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
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['tasks', filters, dates],
    queryFn: () =>
      getAllTasks({
        filter: filters,
        startDate: dates.start,
        endDate: dates.end,
      }),
    // placeholderData: (prev: Task[] | undefined) => prev
  });

  if (isLoading)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <FlatList
      data={days}
      renderItem={({ item, index }) => (
        <WeekTaskCard
          day={item}
          defaultExpanded={index === 0}
          tasks={
            data?.filter(
              _task =>
                moment(dates.start).add(index, 'day').format('DD/MM/YYYY') ===
                moment(_task.dueDate).format('DD/MM/YYYY'),
            ) ?? []
          }
          date={moment(dates.start).add(index, 'day').format('YYYY-MM-DD')}
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
      contentContainerStyle={{
        padding: spacing(20),
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
