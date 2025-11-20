/* Filter.tsx — uses local React context inside registered sheet */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import ActionSheet, {
  Route,
  ScrollView,
  SheetProps,
  useSheetRouter,
} from 'react-native-actions-sheet';
import { createStyleSheet } from 'react-native-unistyles';
import { Feather } from '@react-native-vector-icons/feather';
import { assets } from '../../assets';
import { theme } from '../../theme';
import { fontSize, scale, spacing, verticalScale } from '../../utils';
import AppButton from '../ui/AppButton';
import { useQueries } from '@tanstack/react-query';
import { getAllCategories } from '../../api/functions/category.api';
import { getAllStatuses } from '../../api/functions/status.api';

/* ---------- Types ---------- */
type Filter = {
  selectedKey: string;
  selectedOperator: string;
  selectedValue: string;
};

type TempFilter = (Partial<Filter> & { editIndex?: number | null }) | null;

type SheetPayload = {
  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
};

/* ---------- Local Context for sheet state (NOT SheetProvider) ---------- */
type InternalSheetState = {
  localFilters: Filter[]; // local reactive copy so UI updates inside sheet
  setLocalFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
  tempFilter: TempFilter;
  setTempFilter: (f: TempFilter) => void;
  commitFilter: (final: Filter, editIndex?: number | null) => void;
};

const TempFilterContext = createContext<InternalSheetState | null>(null);
export const useTempFilter = () => {
  const ctx = useContext(TempFilterContext);
  if (!ctx) throw new Error('useTempFilter must be used inside FilterSheet');
  return ctx;
};

/* ---------- ROUTE COMPONENTS (they will use useTempFilter + router) ---------- */

const InitialFilterScreen = () => {
  const router = useSheetRouter('filter-sheet');
  const { localFilters, setTempFilter, setLocalFilters } = useTempFilter();

  const [
    { data: categories = [], isLoading: isCategoryLoading },
    { data: statuses = [], isLoading: isStatusLoading },
  ] = useQueries({
    queries: [
      { queryKey: ['categories'], queryFn: getAllCategories },
      { queryKey: ['status'], queryFn: getAllStatuses },
    ],
  });

  const removeFilter = (id: number) => {
    setLocalFilters(prev => prev.filter((_, idx) => idx !== id));
    // we don't call parent setFilters here — commit happens on selection,
    // but you can also expose a commitNow() that calls payload.setFilters if needed
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

  return (
    <View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.heading}>
          {localFilters.length > 0 ? 'Active Filters' : 'Filters'}
        </Text>

        {localFilters.length === 0 ? (
          <View
            style={{
              paddingTop: spacing(32),
              alignItems: 'center',
              marginBottom: spacing(72),
            }}
          >
            <Image
              source={assets.images.EmptyFiler}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No Active filter</Text>
            <Text style={styles.emptySubtitle}>Add New Filters here</Text>
          </View>
        ) : (
          <View>
            {isCategoryLoading || isStatusLoading ? (
              <View
                style={{
                  height: verticalScale(150),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ActivityIndicator size="small" />
              </View>
            ) : (
              localFilters.map((filter, idx) => (
                <View style={styles.whereContainer} key={idx}>
                  <View style={styles.row}>
                    <Text style={styles.whereText}>Where</Text>
                    <Pressable onPress={() => removeFilter(idx)}>
                      <Feather name="x" size={18} color="#212121" />
                    </Pressable>
                  </View>

                  <View>
                    <View style={styles.row}>
                      <Pressable
                        style={[styles.selectBox, { marginRight: spacing(8) }]}
                        onPress={() => editField(idx, 'selectedKey')}
                      >
                        <Text style={styles.selectBoxText} numberOfLines={1}>
                          {filter.selectedKey || 'Type'}
                        </Text>
                        <Feather
                          name="chevron-down"
                          size={16}
                          color="#4F4D55"
                        />
                      </Pressable>

                      <Pressable
                        style={styles.selectBox}
                        onPress={() => editField(idx, 'selectedOperator')}
                      >
                        <Text style={styles.selectBoxText} numberOfLines={1}>
                          {filter.selectedOperator === 'isNot'
                            ? 'is not'
                            : filter.selectedOperator}
                        </Text>
                        <Feather
                          name="chevron-down"
                          size={16}
                          color="#4F4D55"
                        />
                      </Pressable>
                    </View>

                    <View style={styles.row}>
                      <Pressable
                        style={styles.selectBox}
                        onPress={() => editField(idx, 'selectedValue')}
                      >
                        <Text style={styles.selectBoxText} numberOfLines={1}>
                          {filter.selectedKey === 'status'
                            ? statuses.find(
                                _s => _s._id === filter.selectedValue,
                              )?.title
                            : filter.selectedKey === 'category'
                              ? categories.find(
                                  _c => _c._id === filter.selectedValue,
                                )?.title
                              : 'Value'}
                        </Text>
                        <Feather
                          name="chevron-down"
                          size={16}
                          color="#4F4D55"
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
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
    <>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.heading}>Select Type</Text>
        <View>
          <Pressable style={styles.box} onPress={() => pick('status')}>
            <Text style={styles.boxText}>Status</Text>
            {tempFilter?.selectedKey === 'status' && (
              <Feather name="check" size={fontSize(12)} />
            )}
          </Pressable>
          <Pressable style={styles.box} onPress={() => pick('dueDate')}>
            <Text style={styles.boxText}>Due Date</Text>
            {tempFilter?.selectedKey === 'dueDate' && (
              <Feather name="check" size={fontSize(12)} />
            )}
          </Pressable>
          <Pressable style={styles.box} onPress={() => pick('category')}>
            <Text style={styles.boxText}>Category</Text>
            {tempFilter?.selectedKey === 'category' && (
              <Feather name="check" size={fontSize(12)} />
            )}
          </Pressable>
          <Pressable style={styles.box} onPress={() => pick('priority')}>
            <Text style={styles.boxText}>Priority</Text>
            {tempFilter?.selectedKey === 'priority' && (
              <Feather name="check" size={fontSize(12)} />
            )}
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.footerContainer}>
        <AppButton
          text="Go Back"
          style={{ paddingVertical: spacing(16) }}
          onPress={() => router?.goBack()}
        />
      </View>
    </>
  );
};

const SelectOperatorFilterScreen = () => {
  const router = useSheetRouter('filter-sheet');
  const { tempFilter, setTempFilter } = useTempFilter();

  const pick = (op: string) => {
    setTempFilter({ ...(tempFilter ?? {}), selectedOperator: op });
    router?.navigate('select-values');
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.heading}>Select Operator</Text>
        <View>
          <Pressable style={styles.box} onPress={() => pick('is')}>
            <Text style={styles.boxText}>is</Text>
            {tempFilter?.selectedOperator === 'is' && (
              <Feather name="check" size={fontSize(12)} />
            )}
          </Pressable>
          <Pressable style={styles.box} onPress={() => pick('isNot')}>
            <Text style={styles.boxText}>is not</Text>
            {tempFilter?.selectedOperator === 'isNot' && (
              <Feather name="check" size={fontSize(12)} />
            )}
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.footerContainer}>
        <AppButton
          text="Go Back"
          style={{ paddingVertical: spacing(16) }}
          onPress={() => router?.goBack()}
        />
      </View>
    </>
  );
};

const SelectValueFilterScreen = () => {
  const router = useSheetRouter('filter-sheet');
  const { tempFilter, setTempFilter, commitFilter } = useTempFilter();

  const [
    { data: categories = [], isLoading: isCategoryLoading },
    { data: statuses = [], isLoading: isStatusLoading },
  ] = useQueries({
    queries: [
      { queryKey: ['categories'], queryFn: getAllCategories },
      { queryKey: ['status'], queryFn: getAllStatuses },
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
      if (isStatusLoading) return <ActivityIndicator />;
      return statuses.map(s => (
        <Pressable
          key={s._id}
          style={styles.box}
          onPress={() => onPickValue(s._id)}
        >
          <Text style={styles.boxText}>{s.title}</Text>
          {tempFilter?.selectedValue === s._id && (
            <Feather name="check" size={fontSize(12)} />
          )}
        </Pressable>
      ));
    }

    if (key === 'category') {
      if (isCategoryLoading) return <ActivityIndicator />;
      return categories.map(c => (
        <Pressable
          key={c._id}
          style={styles.box}
          onPress={() => onPickValue(c._id)}
        >
          <Text style={styles.boxText}>{c.title}</Text>
          {tempFilter?.selectedValue === c._id && (
            <Feather name="check" size={fontSize(12)} />
          )}
        </Pressable>
      ));
    }

    if (key === 'priority') {
      const priorities = ['low', 'medium', 'high'];
      return priorities.map(p => (
        <Pressable key={p} style={styles.box} onPress={() => onPickValue(p)}>
          <Text style={styles.boxText}>{p}</Text>
          {tempFilter?.selectedValue === p && (
            <Feather name="check" size={fontSize(12)} />
          )}
        </Pressable>
      ));
    }

    if (key === 'dueDate') {
      const options = ['Today', 'This week', 'This month'];
      return options.map(o => (
        <Pressable key={o} style={styles.box} onPress={() => onPickValue(o)}>
          <Text style={styles.boxText}>{o}</Text>
          {tempFilter?.selectedValue === o && (
            <Feather name="check" size={fontSize(12)} />
          )}
        </Pressable>
      ));
    }

    return null;
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.heading}>Select Value</Text>
        {isCategoryLoading || isStatusLoading ? (
          <View
            style={{
              height: verticalScale(150),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="small" />
          </View>
        ) : (
          <View>{renderOptions()}</View>
        )}
      </ScrollView>

      <View style={styles.footerContainer}>
        <AppButton
          text="Go Back"
          style={{ paddingVertical: spacing(16) }}
          onPress={() => router?.goBack()}
        />
      </View>
    </>
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

  const ctx = useMemo<InternalSheetState>(
    () => ({
      localFilters,
      setLocalFilters,
      tempFilter,
      setTempFilter,
      commitFilter,
    }),
    [commitFilter, localFilters, tempFilter],
  );

  return (
    <TempFilterContext.Provider value={ctx}>
      <ActionSheet
        id="filter-sheet"
        useBottomSafeAreaPadding
        backgroundInteractionEnabled={false}
        closeOnTouchBackdrop
        indicatorStyle={{ display: 'none' }}
        gestureEnabled
        routes={filterRoutes}
        initialRoute="initial-screen"
        containerStyle={{
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          backgroundColor: '#f9f9f9',
        }}
        // keep props.payload untouched — it's for initial data & returning value
      />
    </TempFilterContext.Provider>
  );
};

/* ---------- Exported small Filter button that calls SheetManager.show ---------- */
import { SheetManager } from 'react-native-actions-sheet';

export default function FilterButton({
  filters,
  setFilters,
}: {
  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
}) {
  const present = () => {
    // pass only initial data (do NOT pass setters for temp state)
    SheetManager.show('filter-sheet', {
      payload: {
        filters,
        setFilters,
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
      </Pressable>
    </View>
  );
}

/* ---------- styles (same as your original) ---------- */
const styles = createStyleSheet({
  /* ...your styles here (omitted for brevity; reuse existing styles) */
  filterIcon: {
    padding: spacing(7),
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.gray[200],
  },
  sortIcon: { width: 20, height: 20 },
  contentContainer: {
    padding: spacing(20),
    paddingTop: spacing(28),
    paddingBottom: spacing(20),
  },
  heading: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(18),
    color: theme.colors.black,
    marginBottom: spacing(20),
  },
  image: { height: scale(104), marginBottom: spacing(24) },
  emptyTitle: {
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(16),
    color: theme.colors.black,
    marginBottom: spacing(8),
  },
  emptySubtitle: {
    fontFamily: theme.fonts.archivo.regular,
    fontSize: fontSize(14),
    color: theme.colors.gray[300],
  },
  box: {
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    marginBottom: spacing(8),
    borderRadius: 8,
  },
  boxText: {
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.black,
    fontSize: fontSize(14),
  },
  whereContainer: {
    padding: spacing(14),
    borderRadius: 8,
    backgroundColor: '#EFEFEF',
    marginBottom: spacing(10),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(8),
    gap: spacing(10),
  },
  whereText: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(14),
    color: theme.colors.black,
  },
  selectBox: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(8),
    borderRadius: spacing(8),
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  selectBoxText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.black,
    // textTransform: 'capitalize',
  },
  footerContainer: {
    // paddingBottom: Platform.OS === 'ios' ? spacing(45) : spacing(20),
    paddingBottom: spacing(10),
    paddingInline: spacing(20),
    backgroundColor: '#f9f9f9',
  },
});
