/* Filter.tsx — uses local React context inside registered sheet */

import { useQueries } from '@tanstack/react-query';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import ActionSheet, {
  Route,
  ScrollView,
  SheetManager,
  SheetProps,
  useSheetRouter,
} from 'react-native-actions-sheet';
import { createStyleSheet } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import {
  getAllCategories,
  getAllCategoriesByCoach,
} from '../../api/functions/category.api';
import {
  getAllStatuses,
  getAllStatusesByCoach,
} from '../../api/functions/status.api';
import { assets } from '../../assets';
import { VALUELESS_OPERATORS } from '../../helpers/utils';
import { theme } from '../../theme';
import { fontSize, scale, spacing, verticalScale } from '../../utils';
import AppButton from '../ui/AppButton';

/* ---------- Types ---------- */
type Filter = {
  selectedKey: string;
  selectedOperator: string;
  selectedValue: string;
};

// Cap the scrollable area so long filter/option lists scroll inside the sheet
// instead of growing the sheet past the top of the screen (which left it
// unscrollable). The header and footer stay pinned outside the ScrollView.
const SHEET_SCROLL_MAX = Math.round(Dimensions.get('window').height * 0.55);

/* ---------- Filter config (kept in lock-step with the web's FilterBox) ---------- */
// dueDate option values must match getDueDateQuery in task.api.ts exactly.
const DUE_DATE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Week', value: 'thisWeek' },
  { label: 'Next Week', value: 'nextWeek' },
];

const OPERATOR_LABELS: Record<string, string> = {
  is: 'is',
  isNot: 'is not',
  isSet: 'is set',
  isNotSet: 'is not set',
};

// Human labels for the filter keys (raw keys are used everywhere in logic).
const KEY_LABELS: Record<string, string> = {
  status: 'Status',
  dueDate: 'Due Date',
  category: 'Category',
  priority: 'Priority',
};
const keyLabel = (key?: string) => (key ? (KEY_LABELS[key] ?? key) : '');

const FILTER_TYPES: { key: string; label: string }[] = [
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'category', label: 'Category' },
  { key: 'priority', label: 'Priority' },
];

// Operators offered per filter key. Only dueDate gets the presence checks.
const operatorsForKey = (key?: string): string[] =>
  key === 'dueDate' ? ['is', 'isNot', 'isSet', 'isNotSet'] : ['is', 'isNot'];

const dueDateLabel = (value?: string) =>
  DUE_DATE_OPTIONS.find(o => o.value === value)?.label ?? value;

type TempFilter = (Partial<Filter> & { editIndex?: number | null }) | null;

type SheetPayload = {
  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
  // When a staff member filters a viewed client's tasks, the category/status
  // options must come from the client, not the logged-in staff.
  userId?: string;
};

/* ---------- Local Context for sheet state (NOT SheetProvider) ---------- */
type InternalSheetState = {
  localFilters: Filter[]; // local reactive copy so UI updates inside sheet
  setLocalFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
  tempFilter: TempFilter;
  setTempFilter: (f: TempFilter) => void;
  commitFilter: (final: Filter, editIndex?: number | null) => void;
  removeFilter: (filter: Filter[]) => void;
  userId?: string;
};

const TempFilterContext = createContext<InternalSheetState | null>(null);
export const useTempFilter = () => {
  const ctx = useContext(TempFilterContext);
  if (!ctx) throw new Error('useTempFilter must be used inside FilterSheet');
  return ctx;
};

/* ---------- Shared sheet chrome ---------- */
const SheetHeader = ({
  title,
  subtitle,
  onBack,
  rightLabel,
  onRightPress,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
}) => (
  <View style={styles.headerRow}>
    {onBack ? (
      <Pressable onPress={onBack} hitSlop={10} style={styles.headerIconBtn}>
        <Feather name="chevron-left" size={22} color={theme.colors.gray[800]} />
      </Pressable>
    ) : (
      <View style={styles.headerIconBtn} />
    )}

    <View style={styles.headerTitleWrap}>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      {!!subtitle && (
        <Text style={styles.headerSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>

    {rightLabel && onRightPress ? (
      <Pressable
        onPress={onRightPress}
        hitSlop={10}
        style={styles.headerRightBtn}
      >
        <Text style={styles.headerRightText}>{rightLabel}</Text>
      </Pressable>
    ) : (
      <View style={styles.headerIconBtn} />
    )}
  </View>
);

// A single selectable option row (used by type / operator / value screens).
const OptionRow = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    style={[styles.box, selected && styles.boxSelected]}
    onPress={onPress}
  >
    <Text style={[styles.boxText, selected && styles.boxTextSelected]}>
      {label}
    </Text>
    {selected ? (
      <Feather name="check" size={fontSize(16)} color={theme.colors.primary} />
    ) : (
      <Feather
        name="chevron-right"
        size={fontSize(16)}
        color={theme.colors.gray[300]}
      />
    )}
  </Pressable>
);

/* ---------- ROUTE COMPONENTS (they will use useTempFilter + router) ---------- */

const InitialFilterScreen = () => {
  const router = useSheetRouter('filter-sheet');
  const {
    localFilters,
    setTempFilter,
    setLocalFilters,
    removeFilter: removeParentFilter,
    userId,
  } = useTempFilter();

  const [
    { data: categories = [], isLoading: isCategoryLoading },
    { data: statuses = [], isLoading: isStatusLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ['categories', userId],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          userId
            ? getAllCategoriesByCoach(userId, signal)
            : getAllCategories(signal),
      },
      {
        queryKey: ['status', userId],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          userId
            ? getAllStatusesByCoach(userId, signal)
            : getAllStatuses(signal),
      },
    ],
  });

  const removeFilter = (id: number) => {
    const filter = localFilters.filter((_, idx) => idx !== id);
    setLocalFilters(filter);
    removeParentFilter(filter);
  };

  const clearAll = () => {
    setLocalFilters([]);
    removeParentFilter([]);
  };

  const editField = (
    idx: number,
    field: 'selectedKey' | 'selectedOperator' | 'selectedValue',
  ) => {
    const f = localFilters[idx];
    setTempFilter({ ...f, editIndex: idx });
    if (field === 'selectedKey') router?.navigate('select-type');
    else if (field === 'selectedOperator') router?.navigate('select-operator');
    else router?.navigate('select-values');
  };

  const valueLabel = (filter: Filter) => {
    if (filter.selectedKey === 'status') {
      return statuses.find(_s => _s._id === filter.selectedValue)?.title;
    }
    if (filter.selectedKey === 'category') {
      return categories.find(_c => _c._id === filter.selectedValue)?.title;
    }
    if (filter.selectedKey === 'dueDate')
      return dueDateLabel(filter.selectedValue);
    return filter.selectedValue ?? 'Value';
  };

  const hasFilters = localFilters.length > 0;

  return (
    <View>
      <SheetHeader
        title="Filters"
        subtitle={
          hasFilters
            ? `${localFilters.length} active`
            : 'Narrow down your tasks'
        }
        rightLabel={hasFilters ? 'Clear all' : undefined}
        onRightPress={hasFilters ? clearAll : undefined}
      />

      <ScrollView
        style={{ maxHeight: SHEET_SCROLL_MAX }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasFilters ? (
          <View style={styles.emptyWrap}>
            <Image
              source={assets.images.EmptyFiler}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No active filters</Text>
            <Text style={styles.emptySubtitle}>
              Tap “Add filter” to narrow down your tasks by status, due date,
              category or priority.
            </Text>
          </View>
        ) : isCategoryLoading || isStatusLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" />
          </View>
        ) : (
          localFilters.map((filter, idx) => (
            <View style={styles.filterCard} key={idx}>
              <View style={styles.filterCardHeader}>
                <View style={styles.connectiveChip}>
                  <Text style={styles.connectiveText}>
                    {idx === 0 ? 'Where' : 'And'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => removeFilter(idx)}
                  hitSlop={8}
                  style={styles.removeBtn}
                >
                  <Feather
                    name="trash-2"
                    size={16}
                    color={theme.colors.gray[500]}
                  />
                </Pressable>
              </View>

              <View style={styles.selectsRow}>
                <Pressable
                  style={styles.selectBox}
                  onPress={() => editField(idx, 'selectedKey')}
                >
                  <Text style={styles.selectBoxText} numberOfLines={1}>
                    {keyLabel(filter.selectedKey) || 'Type'}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#4F4D55" />
                </Pressable>

                <Pressable
                  style={styles.selectBox}
                  onPress={() => editField(idx, 'selectedOperator')}
                >
                  <Text style={styles.selectBoxText} numberOfLines={1}>
                    {OPERATOR_LABELS[filter.selectedOperator] ??
                      filter.selectedOperator}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#4F4D55" />
                </Pressable>
              </View>

              {/* Presence-check operators (is set / is not set) carry no
                  value, so the value selector is hidden for them. */}
              {!VALUELESS_OPERATORS.includes(filter.selectedOperator) && (
                <Pressable
                  style={[styles.selectBox, styles.valueBox]}
                  onPress={() => editField(idx, 'selectedValue')}
                >
                  <Text style={styles.selectBoxText} numberOfLines={1}>
                    {valueLabel(filter) || 'Value'}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#4F4D55" />
                </Pressable>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footerContainer}>
        <AppButton
          text="Add filter"
          style={{ paddingVertical: spacing(16) }}
          onPress={() => {
            // start a new tempFilter (create new)
            setTempFilter({
              selectedKey: '',
              selectedOperator: '',
              selectedValue: '',
              editIndex: null,
            });
            router?.navigate('select-type');
          }}
        />
      </View>
    </View>
  );
};

const SelectTypeFilterScreen = () => {
  const router = useSheetRouter('filter-sheet');
  const { tempFilter, setTempFilter } = useTempFilter();

  const pick = (key: string) => {
    setTempFilter({ ...(tempFilter ?? {}), selectedKey: key });
    router?.navigate('select-operator');
  };

  return (
    <View>
      <SheetHeader
        title="Select type"
        subtitle="What do you want to filter by?"
        onBack={() => router?.goBack()}
      />
      <ScrollView
        style={{ maxHeight: SHEET_SCROLL_MAX }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {FILTER_TYPES.map(t => (
          <OptionRow
            key={t.key}
            label={t.label}
            selected={tempFilter?.selectedKey === t.key}
            onPress={() => pick(t.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const SelectOperatorFilterScreen = () => {
  const router = useSheetRouter('filter-sheet');
  const { tempFilter, setTempFilter, commitFilter } = useTempFilter();

  const operators = operatorsForKey(tempFilter?.selectedKey);

  const pick = (op: string) => {
    // Presence-check operators carry no value — commit straight away and return
    // to the active-filters list instead of routing to value selection.
    if (VALUELESS_OPERATORS.includes(op)) {
      commitFilter(
        {
          selectedKey: tempFilter?.selectedKey ?? 'dueDate',
          selectedOperator: op,
          selectedValue: '',
        },
        tempFilter?.editIndex ?? null,
      );
      setTempFilter(null);
      setTimeout(() => {
        router?.initialNavigation();
      }, 10);
      return;
    }
    setTempFilter({ ...(tempFilter ?? {}), selectedOperator: op });
    router?.navigate('select-values');
  };

  return (
    <View>
      <SheetHeader
        title="Select condition"
        subtitle={keyLabel(tempFilter?.selectedKey)}
        onBack={() => router?.goBack()}
      />
      <ScrollView
        style={{ maxHeight: SHEET_SCROLL_MAX }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {operators.map(op => (
          <OptionRow
            key={op}
            label={OPERATOR_LABELS[op] ?? op}
            selected={tempFilter?.selectedOperator === op}
            onPress={() => pick(op)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const SelectValueFilterScreen = () => {
  const router = useSheetRouter('filter-sheet');
  const { tempFilter, setTempFilter, commitFilter, userId } = useTempFilter();

  const [
    { data: categories = [], isLoading: isCategoryLoading },
    { data: statuses = [], isLoading: isStatusLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ['categories', userId],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          userId
            ? getAllCategoriesByCoach(userId, signal)
            : getAllCategories(signal),
      },
      {
        queryKey: ['status', userId],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          userId
            ? getAllStatusesByCoach(userId, signal)
            : getAllStatuses(signal),
      },
    ],
  });

  const key = tempFilter?.selectedKey ?? 'status';

  const onPickValue = (value: string) => {
    const final: Filter = {
      selectedKey: tempFilter?.selectedKey ?? key,
      selectedOperator: tempFilter?.selectedOperator ?? 'is',
      selectedValue: value,
    };

    // commit (this updates local and parent filters immediately)
    commitFilter(final, tempFilter?.editIndex ?? null);

    // clear temp and go back
    setTempFilter(null);
    setTimeout(() => {
      router?.initialNavigation();
    }, 10);
  };

  const renderOptions = () => {
    if (key === 'status') {
      return statuses.map(s => (
        <OptionRow
          key={s._id}
          label={s.title}
          selected={tempFilter?.selectedValue === s._id}
          onPress={() => onPickValue(s._id)}
        />
      ));
    }

    if (key === 'category') {
      return categories.map(c => (
        <OptionRow
          key={c._id}
          label={c.title}
          selected={tempFilter?.selectedValue === c._id}
          onPress={() => onPickValue(c._id)}
        />
      ));
    }

    if (key === 'priority') {
      const priorities = ['low', 'medium', 'high'];
      return priorities.map(p => (
        <OptionRow
          key={p}
          label={p}
          selected={tempFilter?.selectedValue === p}
          onPress={() => onPickValue(p)}
        />
      ));
    }

    if (key === 'dueDate') {
      return DUE_DATE_OPTIONS.map(o => (
        <OptionRow
          key={o.value}
          label={o.label}
          selected={tempFilter?.selectedValue === o.value}
          onPress={() => onPickValue(o.value)}
        />
      ));
    }

    return null;
  };

  return (
    <View>
      <SheetHeader
        title="Select value"
        subtitle={keyLabel(key)}
        onBack={() => router?.goBack()}
      />
      <ScrollView
        style={{ maxHeight: SHEET_SCROLL_MAX }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {isCategoryLoading || isStatusLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" />
          </View>
        ) : (
          renderOptions()
        )}
      </ScrollView>
    </View>
  );
};

/* ---------- Routes ---------- */
export const filterRoutes: Route[] = [
  { name: 'initial-screen', component: InitialFilterScreen },
  { name: 'select-type', component: SelectTypeFilterScreen },
  { name: 'select-operator', component: SelectOperatorFilterScreen },
  { name: 'select-values', component: SelectValueFilterScreen },
];

/* ---------- The registered sheet component (wrapped in local context) ---------- */
export const FilterSheet = (props: SheetProps<'filter-sheet'>) => {
  // read incoming initial payload (passed from SheetManager.show)
  const incoming = props.payload as SheetPayload | undefined;
  const parentSetFilters = incoming?.setFilters;
  const initialFilters = incoming?.filters ?? [];
  const userId = incoming?.userId;

  // local reactive copy of filters to make UI reactive inside sheet
  const [localFilters, setLocalFilters] = useState<Filter[]>(initialFilters);

  // temp filter (single in-progress filter while user navigates)
  const [tempFilter, setTempFilter] = useState<TempFilter>(null);

  // commit helper: update local and call parent's setFilters immediately
  const commitFilter = useCallback(
    (final: Filter, editIndex?: number | null) => {
      setLocalFilters(prev => {
        const copy = [...prev];
        if (typeof editIndex === 'number' && editIndex >= 0) {
          copy[editIndex] = final;
        } else {
          copy.push(final);
        }
        // also commit to parent if available
        if (parentSetFilters) parentSetFilters(copy);
        return copy;
      });
    },
    [parentSetFilters],
  );

  const removeFilter = useCallback(
    (filter: any) => {
      if (parentSetFilters) parentSetFilters(filter);
    },
    [parentSetFilters],
  );

  const ctx = useMemo<InternalSheetState>(
    () => ({
      localFilters,
      setLocalFilters,
      tempFilter,
      setTempFilter,
      commitFilter,
      removeFilter,
      userId,
    }),
    [commitFilter, localFilters, tempFilter, removeFilter, userId],
  );

  return (
    <TempFilterContext.Provider value={ctx}>
      <ActionSheet
        id="filter-sheet"
        useBottomSafeAreaPadding
        backgroundInteractionEnabled={false}
        closeOnTouchBackdrop
        indicatorStyle={styles.indicator}
        gestureEnabled
        routes={filterRoutes}
        initialRoute="initial-screen"
        containerStyle={styles.sheetContainer}
      />
    </TempFilterContext.Provider>
  );
};

/* ---------- Exported small Filter button that calls SheetManager.show ---------- */
export default function FilterButton({
  filters,
  setFilters,
  userId,
}: {
  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
  userId?: string;
}) {
  const present = () => {
    // pass only initial data (do NOT pass setters for temp state)
    SheetManager.show('filter-sheet', {
      payload: {
        filters,
        setFilters,
        userId,
      },
    });
  };

  return (
    <View>
      <Pressable
        style={[
          styles.filterIcon,
          filters.length > 0 && { backgroundColor: theme.colors.gray[200] },
        ]}
        onPress={present}
      >
        <Image source={assets.icons.filter} style={styles.sortIcon} />
        {filters.length > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{filters.length}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = createStyleSheet({
  filterIcon: {
    padding: spacing(7),
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.gray[200],
  },
  sortIcon: { width: 20, height: 20 },
  filterBadge: {
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
  filterBadgeText: {
    color: theme.colors.white,
    fontSize: fontSize(9),
    fontFamily: theme.fonts.archivo.semiBold,
  },

  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#f9f9f9',
  },
  indicator: {
    width: spacing(40),
    height: spacing(5),
    borderRadius: 999,
    backgroundColor: theme.colors.gray[300],
    marginTop: spacing(10),
  },

  /* header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(12),
    paddingTop: spacing(14),
    paddingBottom: spacing(12),
    gap: spacing(6),
  },
  headerIconBtn: {
    width: scale(34),
    height: scale(34),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(17),
    color: theme.colors.gray[950],
  },
  headerSubtitle: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
    color: theme.colors.gray[500],
    marginTop: spacing(1),
  },
  headerRightBtn: {
    minWidth: scale(34),
    height: scale(34),
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: spacing(4),
  },
  headerRightText: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(13),
    color: theme.colors.primary,
  },

  /* list */
  listContent: {
    paddingHorizontal: spacing(20),
    paddingTop: spacing(6),
    paddingBottom: spacing(20),
  },
  loaderWrap: {
    height: verticalScale(150),
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* empty */
  emptyWrap: {
    paddingTop: spacing(28),
    paddingBottom: spacing(40),
    alignItems: 'center',
  },
  image: { height: scale(104), marginBottom: spacing(20) },
  emptyTitle: {
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(16),
    color: theme.colors.gray[900],
    marginBottom: spacing(8),
  },
  emptySubtitle: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[500],
    textAlign: 'center',
    lineHeight: fontSize(19),
    paddingHorizontal: spacing(16),
  },

  /* active filter card */
  filterCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    padding: spacing(12),
    marginBottom: spacing(12),
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
    shadowColor: theme.colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(10),
  },
  connectiveChip: {
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(3),
    borderRadius: 999,
    backgroundColor: 'rgba(14,23,52,0.06)',
  },
  connectiveText: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(11),
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  removeBtn: {
    padding: spacing(2),
  },
  selectsRow: {
    flexDirection: 'row',
    gap: spacing(8),
    marginBottom: spacing(8),
  },
  selectBox: {
    flex: 1,
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(8),
    borderRadius: spacing(10),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    backgroundColor: theme.colors.secondary,
  },
  valueBox: {
    marginBottom: 0,
  },
  selectBoxText: {
    flexShrink: 1,
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[900],
    textTransform: 'capitalize',
  },

  /* option rows */
  box: {
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    marginBottom: spacing(8),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },
  boxSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(14,23,52,0.04)',
  },
  boxText: {
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[900],
    fontSize: fontSize(14),
    textTransform: 'capitalize',
  },
  boxTextSelected: {
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.primary,
  },

  /* footer */
  footerContainer: {
    paddingTop: spacing(8),
    paddingBottom: spacing(10),
    paddingHorizontal: spacing(20),
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
});
