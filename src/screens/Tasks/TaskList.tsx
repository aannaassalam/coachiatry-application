import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { assets } from '../../assets';
import TaskCard from '../../components/Tasks/TaskCard';
import AppHeader from '../../components/ui/AppHeader';
import { theme } from '../../theme';
import { fontSize, scale, spacing } from '../../utils';
import Sort from '../../components/Tasks/Sort';
import Filter from '../../components/Tasks/Filter';

function TaskList() {
  const [tab, setTab] = useState('list');
  const [open, setOpen] = useState(false);

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
          <Filter />
          <Sort />
        </View>
      </View>
      <ScrollView>
        <TaskCard defaultExpanded />
        <TaskCard />
        <TaskCard />
        <TaskCard />
        <TaskCard />
        <TaskCard />
        <TaskCard />
      </ScrollView>
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
});

export default TaskList;
