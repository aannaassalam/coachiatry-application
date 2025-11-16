import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useIsFetching } from '@tanstack/react-query';
import moment from 'moment';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import Filter from '../../components/Tasks/Filter';
import ListView from '../../components/Tasks/ListVIew';
import Sort from '../../components/Tasks/Sort';
import WeekView from '../../components/Tasks/WeekView';
import TouchableButton from '../../components/TouchableButton';
import AppHeader from '../../components/ui/AppHeader';
import { sanitizeFilters } from '../../helpers/utils';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { fontSize, scale, spacing } from '../../utils';

type TaskListNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'Tasks'
>;

function TaskList() {
  const navigation = useNavigation<TaskListNavigationProp>();
  const isFetching = useIsFetching();
  const [tab, setTab] = useState('list');
  const [sort, setSort] = useState('');
  const [filters, setFilters] = useState<
    {
      selectedKey: string;
      selectedOperator: string;
      selectedValue: string;
    }[]
  >([]);
  const [dates, setDates] = useState({
    start: moment().startOf('week').toISOString(),
    end: moment().endOf('week').toISOString(),
  });

  const validatedFilters = sanitizeFilters(filters);

  const goPrevWeek = () => {
    setDates(prev => ({
      start: moment(prev.start).subtract(1, 'week').toISOString(),
      end: moment(prev.end).subtract(1, 'week').toISOString(),
    }));
  };

  const goNextWeek = () => {
    setDates(prev => ({
      start: moment(prev.start).add(1, 'week').toISOString(),
      end: moment(prev.end).add(1, 'week').toISOString(),
    }));
  };

  return (
    <View style={styles.container}>
      <AppHeader heading="My Tasks" showSearch />
      <View style={styles.filterContainer}>
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'list' && styles.activeTab]}
            onPress={() => setTab('list')}
          >
            <Text
              style={[styles.tabText, tab === 'list' && styles.activeTabText]}
            >
              List
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'week' && styles.activeTab]}
            onPress={() => setTab('week')}
          >
            <Text
              style={[styles.tabText, tab === 'week' && styles.activeTabText]}
            >
              Week
            </Text>
          </Pressable>
        </View>
        <View style={styles.buttonContainer}>
          <Filter filters={filters} setFilters={setFilters} />
          <Sort sort={sort} setSort={setSort} />
        </View>
      </View>
      {tab === 'week' && (
        <View style={styles.filterContainer}>
          <TouchableButton style={styles.chevronBtn} onPress={goPrevWeek}>
            <Ionicons name="chevron-back" size={fontSize(16)} />
          </TouchableButton>
          <Text style={styles.monthText}>
            {moment(dates.start).format('LL')} -{' '}
            {moment(dates.end).format('LL')}
          </Text>
          <TouchableButton style={styles.chevronBtn} onPress={goNextWeek}>
            <Ionicons name="chevron-forward" size={fontSize(16)} />
          </TouchableButton>
        </View>
      )}
      {tab === 'list' ? (
        <ListView sort={sort} filters={validatedFilters} />
      ) : (
        <WeekView dates={dates} filters={filters} />
      )}
      <TouchableButton
        activeOpacity={0.8}
        style={styles.addBtn}
        onPress={() => navigation.navigate('AddEditTask', {})}
      >
        <Ionicons name="add" size={25} color={theme.colors.white} />
      </TouchableButton>
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(16),
    justifyContent: 'space-between',
    paddingBottom: spacing(8),
    backgroundColor: theme.colors.white,
  },
  tabs: {
    flexDirection: 'row',
    padding: spacing(3),
    backgroundColor: theme.colors.gray[100],
    borderRadius: spacing(8),
  },
  tab: {
    width: scale(103),
    paddingVertical: spacing(7),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: spacing(6),
  },
  activeTab: {
    backgroundColor: theme.colors.white,
  },
  tabText: {
    fontFamily: theme.fonts.archivo.regular,
    fontSize: fontSize(14),
    lineHeight: spacing(20),
    color: theme.colors.gray[800],
  },
  activeTabText: {
    fontFamily: theme.fonts.archivo.semiBold,
  },
  buttonContainer: { flexDirection: 'row', gap: spacing(12) },
  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: 'center',
  },
  addBtn: {
    position: 'absolute',
    bottom: spacing(16),
    right: spacing(16),
    padding: spacing(10),
    backgroundColor: theme.colors.primary,
    borderRadius: 100,
  },
  chevronBtn: {
    padding: spacing(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    color: theme.colors.gray[800],
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(16),
  },
});

export default TaskList;
