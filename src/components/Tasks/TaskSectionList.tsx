import { FlashList, FlashListProps } from '@shopify/flash-list';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { Status } from '../../typescript/interface/status.interface';
import { Task } from '../../typescript/interface/task.interface';
import { fontSize, spacing } from '../../utils';
import { sortTasks } from '../../helpers/taskSort';
import IndividualTask from './IndividualTask';
import TaskBadge from './TaskBadge';

// FlashList animated for the collapsing-header screen (client details). The
// reanimated scroll handler attaches to this component's onScroll.
const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

type Nav = NativeStackNavigationProp<AppStackParamList, 'Tasks'>;

/**
 * Flattened row model. The whole list (status headers + their tasks) is a
 * single flat array so FlashList virtualizes EVERY task row — not just the
 * status headers — which the previous FlatList-of-accordions did not. Collapsing
 * a status simply omits its task rows from the flattened array.
 */
type HeaderRow = {
  type: 'header';
  key: string;
  status: Status;
  count: number;
  expanded: boolean;
};
type TaskRow = {
  type: 'task';
  key: string;
  task: Task;
  isFirst: boolean;
  isLast: boolean;
};
type EmptyRow = { type: 'empty'; key: string };
type Row = HeaderRow | TaskRow | EmptyRow;

function StatusHeader({
  status,
  count,
  expanded,
  userId,
  onToggle,
}: {
  status: Status;
  count: number;
  expanded: boolean;
  userId?: string;
  onToggle: () => void;
}) {
  const { styles } = useStyles(stylesheet);
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.headerRow}>
      <Pressable style={styles.caretButton} onPress={onToggle}>
        <FontAwesome5
          name={expanded ? 'caret-down' : 'caret-right'}
          solid
          size={fontSize(16)}
          color={theme.colors.black}
        />
      </Pressable>
      <Pressable onPress={onToggle}>
        <TaskBadge
          title={status.title}
          count={count}
          labelColor={status.color.text}
          backgroundColor={status.color.bg}
        />
      </Pressable>
      <Pressable
        style={styles.addTaskButton}
        onPress={() =>
          navigation.navigate('AddEditTask', {
            predefinedStatus: status._id,
            userId,
          })
        }
      >
        <AntDesign name="plus" color="#838383" size={spacing(12)} />
        <Text style={styles.addTaskButtonText}>Add Task</Text>
      </Pressable>
    </View>
  );
}

export interface TaskSectionListProps {
  tasks: Task[];
  statuses: Status[];
  sort: string;
  userId?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: FlashListProps<Row>['ListHeaderComponent'];
  ListEmptyComponent?: FlashListProps<Row>['ListEmptyComponent'];
  contentContainerStyle?: FlashListProps<Row>['contentContainerStyle'];
  onScroll?: FlashListProps<Row>['onScroll'];
  scrollEnabled?: boolean;
  /** Use the reanimated-animated FlashList (collapsing-header screens). */
  animated?: boolean;
}

export default function TaskSectionList({
  tasks,
  statuses,
  sort,
  userId,
  refreshing,
  onRefresh,
  ListHeaderComponent,
  ListEmptyComponent,
  contentContainerStyle,
  onScroll,
  scrollEnabled = true,
  animated = false,
}: TaskSectionListProps) {
  const { styles } = useStyles(stylesheet);

  // Sort a COPY of statuses by priority; never mutate the cached array.
  const sortedStatuses = React.useMemo(
    () => [...statuses].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)),
    [statuses],
  );

  // Sort the full list once (client-side, semantic), then bucket by status.
  const tasksByStatus = React.useMemo(() => {
    const sorted = sortTasks(tasks, sort);
    const map: Record<string, Task[]> = {};
    sorted.forEach(t => {
      const sid = t.status?._id;
      if (!sid) return;
      (map[sid] ??= []).push(t);
    });
    return map;
  }, [tasks, sort]);

  // Expanded state per status. Default-expand the first status once it loads.
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const didInit = React.useRef(false);
  React.useEffect(() => {
    if (didInit.current || sortedStatuses.length === 0) return;
    didInit.current = true;
    setExpanded({ [sortedStatuses[0]._id]: true });
  }, [sortedStatuses]);

  const toggle = React.useCallback((statusId: string) => {
    setExpanded(prev => ({ ...prev, [statusId]: !prev[statusId] }));
  }, []);

  const rows = React.useMemo<Row[]>(() => {
    const out: Row[] = [];
    sortedStatuses.forEach(status => {
      const statusTasks = tasksByStatus[status._id] ?? [];
      const isExpanded = expanded[status._id] ?? false;
      out.push({
        type: 'header',
        key: `header-${status._id}`,
        status,
        count: statusTasks.length,
        expanded: isExpanded,
      });
      if (!isExpanded) return;
      if (statusTasks.length === 0) {
        out.push({ type: 'empty', key: `empty-${status._id}` });
        return;
      }
      statusTasks.forEach((task, i) => {
        out.push({
          type: 'task',
          key: `task-${task._id}`,
          task,
          isFirst: i === 0,
          isLast: i === statusTasks.length - 1,
        });
      });
    });
    return out;
  }, [sortedStatuses, tasksByStatus, expanded]);

  const renderItem = React.useCallback<
    NonNullable<FlashListProps<Row>['renderItem']>
  >(
    ({ item }) => {
      if (item.type === 'header') {
        return (
          <StatusHeader
            status={item.status}
            count={item.count}
            expanded={item.expanded}
            userId={userId}
            onToggle={() => toggle(item.status._id)}
          />
        );
      }
      if (item.type === 'empty') {
        return (
          <View style={[styles.groupBody, styles.groupBodyOnly]}>
            <Text style={styles.emptyGroupText}>No tasks found in this status</Text>
          </View>
        );
      }
      return (
        <View
          style={[
            styles.groupBody,
            item.isFirst && styles.groupBodyTop,
            item.isLast && styles.groupBodyBottom,
          ]}
        >
          <IndividualTask task={item.task} userId={userId} />
        </View>
      );
    },
    [styles, toggle, userId],
  );

  const commonProps: FlashListProps<Row> = {
    data: rows,
    renderItem,
    keyExtractor: (item: Row) => item.key,
    getItemType: (item: Row) => item.type,
    extraData: expanded,
    showsVerticalScrollIndicator: false,
    scrollEnabled,
    ListHeaderComponent,
    ListEmptyComponent,
    contentContainerStyle,
    refreshing,
    onRefresh,
    onScroll,
    scrollEventThrottle: 16,
  };

  if (animated) {
    return <AnimatedFlashList {...(commonProps as any)} />;
  }
  return <FlashList {...commonProps} />;
}

const stylesheet = createStyleSheet({
  headerRow: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(16),
    flexDirection: 'row',
    alignItems: 'center',
  },
  caretButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(12),
  },
  addTaskButton: {
    padding: spacing(5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
    marginLeft: 'auto',
  },
  addTaskButtonText: {
    color: '#838383',
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
  },
  // The secondary-tinted "card group" background that wrapped the accordion
  // body before. With flat rows we recreate it per task row and round the
  // first/last rows so the group still reads as one block.
  groupBody: {
    backgroundColor: theme.colors.secondary,
    marginHorizontal: spacing(20),
    paddingHorizontal: spacing(10),
    paddingTop: spacing(10),
  },
  groupBodyTop: {
    borderTopLeftRadius: fontSize(12),
    borderTopRightRadius: fontSize(12),
  },
  groupBodyBottom: {
    paddingBottom: spacing(10),
    borderBottomLeftRadius: fontSize(12),
    borderBottomRightRadius: fontSize(12),
  },
  groupBodyOnly: {
    paddingBottom: spacing(10),
    borderRadius: fontSize(12),
  },
  emptyGroupText: {
    color: theme.colors.gray[500],
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing(10),
  },
});
