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
import {
  GroupColumnKey,
  NO_GROUP,
  TaskGroup,
  getGroups,
} from '../../helpers/taskGroup';
import IndividualTask from './IndividualTask';
import TaskBadge from './TaskBadge';

// Fallback pill colours for groups without their own colour (priority, owner,
// assignee, due date). Mirrors the web ListView's `#F3F4F6` / `#4B5563`.
const DEFAULT_GROUP_BG = '#F3F4F6';
const DEFAULT_GROUP_TEXT = '#4B5563';

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
  group: TaskGroup;
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

function GroupHeader({
  group,
  count,
  expanded,
  userId,
  onToggle,
}: {
  group: TaskGroup;
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
          title={group.label}
          count={count}
          labelColor={group.text ?? DEFAULT_GROUP_TEXT}
          backgroundColor={group.bg ?? DEFAULT_GROUP_BG}
        />
      </Pressable>
      {/* Per-group quick-add only makes sense when grouping by status — the new
          task can inherit that status. Other groupings (priority, due date, …)
          have no such target, matching the web ListView. */}
      {group.statusId && (
        <Pressable
          style={styles.addTaskButton}
          onPress={() =>
            navigation.navigate('AddEditTask', {
              predefinedStatus: group.statusId,
              userId,
            })
          }
        >
          <AntDesign name="plus" color="#838383" size={spacing(12)} />
          <Text style={styles.addTaskButtonText}>Add Task</Text>
        </Pressable>
      )}
    </View>
  );
}

export interface TaskSectionListProps {
  tasks: Task[];
  statuses: Status[];
  sort: string;
  /**
   * Field to bucket by, or `NO_GROUP` for a flat list. Defaults to `status`
   * (the historical behaviour).
   */
  group?: GroupColumnKey | typeof NO_GROUP;
  /** Order of the groups themselves ('asc' | 'desc'). Defaults to 'asc'. */
  groupDir?: string;
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
  /**
   * When set (e.g. arriving from a Dashboard status tap), expand ONLY this
   * status group and collapse all others. Consumed once via `onStatusExpanded`.
   */
  expandStatusId?: string;
  /** Called after `expandStatusId` has been applied, so the caller can clear it. */
  onStatusExpanded?: () => void;
}

export default function TaskSectionList({
  tasks,
  statuses,
  sort,
  group = 'status',
  groupDir = 'asc',
  userId,
  refreshing,
  onRefresh,
  ListHeaderComponent,
  ListEmptyComponent,
  contentContainerStyle,
  onScroll,
  scrollEnabled = true,
  animated = false,
  expandStatusId,
  onStatusExpanded,
}: TaskSectionListProps) {
  const { styles } = useStyles(stylesheet);

  const isGrouped = group !== NO_GROUP;
  // The status pill is redundant on cards when the list is already grouped by
  // status (the group header shows it). Show it for any other grouping.
  const showStatus = group !== 'status';

  // Sort the full list once (client-side, semantic), then bucket by the chosen
  // field. When grouping is off we keep the flat sorted list under a single
  // synthetic group so the row-flattening below stays uniform.
  const groups = React.useMemo<TaskGroup[]>(() => {
    const sorted = sortTasks(tasks, sort);
    if (!isGrouped) {
      return [{ key: NO_GROUP, label: '', tasks: sorted }];
    }
    return getGroups(sorted, group as GroupColumnKey, groupDir, statuses);
  }, [tasks, sort, group, groupDir, statuses, isGrouped]);

  // Expanded state per group. Default-expand the first group; re-default when
  // the grouping itself changes (its buckets, and thus keys, differ).
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const signature = groups.map(g => g.key).join('|');
  const prevSignature = React.useRef<string | null>(null);

  // Consume an incoming "expand only this status" request (from a Dashboard
  // status tap). Declared BEFORE the default-first effect and marks the current
  // signature as handled, so the default doesn't override the requested status.
  React.useEffect(() => {
    if (!expandStatusId || groups.length === 0) return;
    if (!groups.some(g => g.key === expandStatusId)) return;
    prevSignature.current = signature;
    setExpanded({ [expandStatusId]: true });
    onStatusExpanded?.();
  }, [expandStatusId, groups, signature, onStatusExpanded]);

  // Default-expand the first group; re-default when the grouping itself changes
  // (its buckets, and thus keys, differ).
  React.useEffect(() => {
    if (prevSignature.current === signature || groups.length === 0) return;
    prevSignature.current = signature;
    setExpanded({ [groups[0].key]: true });
  }, [signature, groups]);

  const toggle = React.useCallback((groupKey: string) => {
    setExpanded(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  }, []);

  const rows = React.useMemo<Row[]>(() => {
    const out: Row[] = [];
    groups.forEach(_group => {
      const groupTasks = _group.tasks;
      // With grouping off there are no collapsible headers — just the flat rows.
      const isExpanded = isGrouped ? (expanded[_group.key] ?? false) : true;
      if (isGrouped) {
        out.push({
          type: 'header',
          key: `header-${_group.key}`,
          group: _group,
          count: groupTasks.length,
          expanded: isExpanded,
        });
      }
      if (!isExpanded) return;
      if (isGrouped && groupTasks.length === 0) {
        out.push({ type: 'empty', key: `empty-${_group.key}` });
        return;
      }
      groupTasks.forEach((task, i) => {
        out.push({
          type: 'task',
          key: `task-${task._id}`,
          task,
          isFirst: i === 0,
          isLast: i === groupTasks.length - 1,
        });
      });
    });
    return out;
  }, [groups, expanded, isGrouped]);

  const renderItem = React.useCallback<
    NonNullable<FlashListProps<Row>['renderItem']>
  >(
    ({ item }) => {
      if (item.type === 'header') {
        return (
          <GroupHeader
            group={item.group}
            count={item.count}
            expanded={item.expanded}
            userId={userId}
            onToggle={() => toggle(item.group.key)}
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
          <IndividualTask
            task={item.task}
            userId={userId}
            showStatus={showStatus}
          />
        </View>
      );
    },
    [styles, toggle, userId, showStatus],
  );

  // Re-render rows when the expanded set OR the status-pill visibility changes.
  const extraData = React.useMemo(
    () => ({ expanded, showStatus }),
    [expanded, showStatus],
  );

  const commonProps: FlashListProps<Row> = {
    data: rows,
    renderItem,
    keyExtractor: (item: Row) => item.key,
    getItemType: (item: Row) => item.type,
    extraData,
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
