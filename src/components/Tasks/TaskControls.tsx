import React from 'react';
import { Pressable, Text, View } from 'react-native';
import ActionSheet, {
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';
import { createStyleSheet } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';

import { GROUPABLE_COLUMNS, NO_GROUP } from '../../helpers/taskGroup';
import { SORT_COLUMNS } from '../../helpers/taskSort';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';

type Filter = {
  selectedKey: string;
  selectedOperator: string;
  selectedValue: string;
};

export interface TaskControlsPayload {
  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
  /** Group controls — omit to hide the "Group by" row (e.g. client details). */
  group?: string;
  setGroup?: React.Dispatch<React.SetStateAction<string>>;
  groupDir?: string;
  setGroupDir?: React.Dispatch<React.SetStateAction<string>>;
  /** Sort controls — omit to hide the "Sort by" row. */
  sort?: string;
  setSort?: React.Dispatch<React.SetStateAction<string>>;
  userId?: string;
}

// ----------------- Value hints -----------------
const groupHint = (group?: string) => {
  if (!group || group === NO_GROUP) return 'None';
  return GROUPABLE_COLUMNS.find(c => c.key === group)?.label ?? 'None';
};

const sortHint = (sort?: string) => {
  if (!sort) return 'Default';
  const key = sort.replace(/^-/, '');
  const label = SORT_COLUMNS.find(c => c.key === key)?.label ?? key;
  return `${label} · ${sort.startsWith('-') ? 'Desc' : 'Asc'}`;
};

// ----------------- Menu Row -----------------
const ControlRow = ({
  icon,
  label,
  hint,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  hint: string;
  active?: boolean;
  onPress: () => void;
}) => (
  <Pressable style={styles.row} onPress={onPress}>
    <View style={styles.rowIcon}>
      <Feather
        name={icon}
        size={18}
        color={active ? theme.colors.primary : theme.colors.gray[600]}
      />
    </View>
    <View style={styles.rowLabels}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowHint, active && styles.rowHintActive]}>
        {hint}
      </Text>
    </View>
    {active && <View style={styles.activeDot} />}
    <Feather name="chevron-right" size={18} color={theme.colors.gray[400]} />
  </Pressable>
);

// Whether each control differs from its default (so it counts as "active").
const controlActivity = (p: TaskControlsPayload) => {
  const filter = p.filters.length > 0;
  const group =
    !!p.setGroup && (p.group !== 'status' || (p.groupDir ?? 'asc') !== 'asc');
  const sort = !!p.setSort && !!p.sort;
  return { filter, group, sort, any: filter || group || sort };
};

// ----------------- Registered Sheet -----------------
export const TaskControlsSheet = (props: SheetProps<'task-controls-sheet'>) => {
  const p = props.payload;
  if (!p) return null;

  const activity = controlActivity(p);

  // Close this menu, then open the chosen control sheet. RNAS 0.9.8 can't
  // reliably show a sheet while another is still closing, so we hide first and
  // open on a short delay (same pattern used elsewhere, e.g. AddEditTask).
  const open = (
    target: 'filter-sheet' | 'group-sheet' | 'sort-sheet',
    payload: object,
  ) => {
    SheetManager.hide('task-controls-sheet');
    setTimeout(() => {
      SheetManager.show(target, { payload } as never);
    }, 350);
  };

  return (
    <ActionSheet
      id="task-controls-sheet"
      useBottomSafeAreaPadding
      backgroundInteractionEnabled={false}
      closeOnTouchBackdrop
      indicatorStyle={{ display: 'none' }}
      gestureEnabled
      containerStyle={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.heading}>Task controls</Text>

        <ControlRow
          icon="filter"
          label="Filter"
          active={activity.filter}
          hint={
            p.filters.length > 0
              ? `${p.filters.length} active`
              : 'None'
          }
          onPress={() =>
            open('filter-sheet', {
              filters: p.filters,
              setFilters: p.setFilters,
              userId: p.userId,
            })
          }
        />

        {p.setGroup && (
          <ControlRow
            icon="layers"
            label="Group by"
            active={activity.group}
            hint={groupHint(p.group)}
            onPress={() =>
              open('group-sheet', {
                group: p.group,
                setGroup: p.setGroup,
                groupDir: p.groupDir,
                setGroupDir: p.setGroupDir,
              })
            }
          />
        )}

        {p.setSort && (
          <ControlRow
            icon="bar-chart-2"
            label="Sort by"
            active={activity.sort}
            hint={sortHint(p.sort)}
            onPress={() =>
              open('sort-sheet', {
                sort: p.sort,
                setSort: p.setSort,
              })
            }
          />
        )}
      </View>
    </ActionSheet>
  );
};

// ----------------- Trigger Button -----------------
export default function TaskControlsButton(props: TaskControlsPayload) {
  const open = () => {
    SheetManager.show('task-controls-sheet', { payload: props });
  };

  const activeFilters = props.filters.length;
  const activity = controlActivity(props);

  return (
    <Pressable style={styles.trigger} onPress={open}>
      <Feather name="sliders" size={20} color={theme.colors.gray[700]} />
      {/* Filter count takes precedence; otherwise a plain dot flags that a
          group/sort is applied so the collapsed toolbar still reads as active. */}
      {activeFilters > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeFilters}</Text>
        </View>
      ) : activity.any ? (
        <View style={styles.triggerDot} />
      ) : null}
    </Pressable>
  );
}

// ----------------- Styles -----------------
const styles = createStyleSheet({
  trigger: {
    padding: spacing(7),
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.gray[200],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: fontSize(9),
    fontFamily: theme.fonts.archivo.semiBold,
  },
  triggerDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: spacing(10),
    height: spacing(10),
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },
  container: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#f9f9f9',
  },
  content: {
    padding: spacing(20),
    paddingBottom: spacing(10),
  },
  heading: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(18),
    color: theme.colors.black,
    marginBottom: spacing(10),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(12),
    gap: spacing(14),
  },
  rowIcon: {
    width: spacing(38),
    height: spacing(38),
    borderRadius: 100,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabels: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(15),
    color: theme.colors.black,
  },
  rowHint: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
    color: theme.colors.gray[500],
    marginTop: spacing(2),
  },
  rowHintActive: {
    color: theme.colors.primary,
  },
  activeDot: {
    width: spacing(8),
    height: spacing(8),
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    marginRight: spacing(6),
  },
});
