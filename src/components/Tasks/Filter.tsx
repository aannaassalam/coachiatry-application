import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import ActionSheet, {
  ActionSheetRef,
  ScrollView,
  SheetManager,
  SheetProps,
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

type Filter = {
  selectedKey: string;
  selectedOperator: string;
  selectedValue: string;
};

type FilterOption = {
  compareOperator: { label: string; value: string }[];
  compareWith: { label: string; value: string }[];
};

export default function Filter({
  filters,
  setFilters,
}: {
  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
}) {
  const sheetRef = useRef<ActionSheetRef>(null);
  const [view, setView] = useState<'view' | 'add'>('view');
  const [filterMode, setFilterMode] = useState<'key' | 'operator' | 'value'>(
    'key',
  );
  const [activeFilter, setActiveFilter] = useState<Omit<
    Filter,
    'selectedValue'
  > | null>(null);

  const present = async () => {
    sheetRef.current?.show();
  };

  const handleFilterProgress = (value: string) => {
    if (filterMode === 'key') {
      setActiveFilter({
        selectedKey: value,
        selectedOperator: '',
      });
      setFilterMode('operator');
      return;
    }
    if (filterMode === 'operator') {
      setActiveFilter(
        prev =>
          prev && {
            ...prev,
            selectedOperator: value,
          },
      );
      setFilterMode('value');
      return;
    }
    if (filterMode === 'value' && !!activeFilter) {
      setFilters(prev => [...prev, { ...activeFilter, selectedValue: value }]);
      setActiveFilter(null);
      setView('view');
      setFilterMode('key');
      return;
    }
  };

  const removeFilter = (id: number) => {
    setFilters(prev => prev.filter((_, idx) => idx !== id));
  };

  const [
    { data: categories = [], isLoading: isCategoryLoading },
    { data: statuses = [], isLoading: isStatusLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ['categories'],
        queryFn: getAllCategories,
      },
      {
        queryKey: ['status'],
        queryFn: getAllStatuses,
      },
    ],
  });

  const filterOptions: Record<string, FilterOption> = {
    status: {
      compareOperator: [
        { label: 'is', value: 'is' },
        { label: 'is not', value: 'is not' },
      ],
      compareWith: statuses.map(_status => ({
        label: _status.title,
        value: _status._id,
      })),
    },
    dueDate: {
      compareOperator: [
        { label: 'is', value: 'is' },
        { label: 'is not', value: 'is not' },
      ],
      compareWith: [
        { label: 'Today', value: 'today' },
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'Tomorrow', value: 'tomorrow' },
        { label: 'This Week', value: 'thisWeek' },
        { label: 'Next Week', value: 'nextWeek' },
      ],
    },
    category: {
      compareOperator: [
        { label: 'is', value: 'is' },
        { label: 'is not', value: 'is not' },
      ],
      compareWith: categories.map(_cat => ({
        label: _cat.title,
        value: _cat._id,
      })),
    },
    priority: {
      compareOperator: [
        { label: 'is', value: 'is' },
        { label: 'is not', value: 'is not' },
      ],
      compareWith: [
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ],
    },
  };

  return (
    <View>
      <Pressable style={styles.filterIcon} onPress={present}>
        <Image source={assets.icons.filter} style={styles.sortIcon} />
      </Pressable>
      <ActionSheet
        useBottomSafeAreaPadding
        backgroundInteractionEnabled={false}
        closeOnTouchBackdrop
        indicatorStyle={{ display: 'none' }}
        gestureEnabled
        ref={sheetRef}
        containerStyle={{
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          backgroundColor: '#f9f9f9',
        }}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.heading}>
            {view === 'view'
              ? filters.length > 0
                ? 'Active Filters'
                : 'Filters'
              : 'Add Filters'}
          </Text>
          {view === 'view' ? (
            filters.length === 0 ? (
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
                {filters.map((filter, idx) => {
                  return (
                    <View style={styles.whereContainer} key={idx}>
                      <View style={styles.row}>
                        <Text style={styles.whereText}>Where</Text>
                        <Pressable onPress={() => removeFilter(idx)}>
                          <Feather name="x" size={18} color="#212121" />
                        </Pressable>
                      </View>
                      <View>
                        <View style={styles.row}>
                          <View style={styles.selectBox}>
                            <Text
                              style={styles.selectBoxText}
                              numberOfLines={1}
                            >
                              {filter.selectedKey}
                            </Text>
                            <Feather
                              name="chevron-down"
                              size={16}
                              color="#4F4D55"
                            />
                          </View>
                          <View style={styles.selectBox}>
                            <Text
                              style={styles.selectBoxText}
                              numberOfLines={1}
                            >
                              {filter.selectedOperator}
                            </Text>
                            <Feather
                              name="chevron-down"
                              size={16}
                              color="#4F4D55"
                            />
                          </View>
                        </View>
                        <View style={styles.row}>
                          <View style={styles.selectBox}>
                            <Text
                              style={styles.selectBoxText}
                              numberOfLines={1}
                            >
                              {filter.selectedValue}
                            </Text>
                            <Feather
                              name="chevron-down"
                              size={16}
                              color="#4F4D55"
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )
          ) : filterMode === 'key' ? (
            <View>
              <Pressable
                style={styles.box}
                onPress={() => handleFilterProgress('status')}
              >
                <Text style={styles.boxText}>Status</Text>
                {/* <Feather name="check" /> */}
              </Pressable>
              <Pressable
                style={styles.box}
                onPress={() => handleFilterProgress('dueDate')}
              >
                <Text style={styles.boxText}>Due Date</Text>
                {/* <Feather name="check" /> */}
              </Pressable>
              <Pressable
                style={styles.box}
                onPress={() => handleFilterProgress('category')}
              >
                <Text style={styles.boxText}>Category</Text>
                {/* <Feather name="check" /> */}
              </Pressable>
              <Pressable
                style={styles.box}
                onPress={() => handleFilterProgress('priority')}
              >
                <Text style={styles.boxText}>Priority</Text>
                {/* <Feather name="check" /> */}
              </Pressable>
            </View>
          ) : filterMode === 'operator' ? (
            <View>
              <Pressable
                style={styles.box}
                onPress={() => handleFilterProgress('is')}
              >
                <Text style={styles.boxText}>is</Text>
                {/* <Feather name="check" /> */}
              </Pressable>
              <Pressable
                style={styles.box}
                onPress={() => handleFilterProgress('isNot')}
              >
                <Text style={styles.boxText}>is not</Text>
                {/* <Feather name="check" /> */}
              </Pressable>
            </View>
          ) : filterMode === 'value' ? (
            isCategoryLoading || isStatusLoading ? (
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
              <View>
                {filterOptions[
                  activeFilter?.selectedKey ?? 'status'
                ].compareWith.map(_item => {
                  return (
                    <Pressable
                      style={styles.box}
                      onPress={() => handleFilterProgress(_item.value)}
                      key={_item.value}
                    >
                      <Text style={styles.boxText}>{_item.label}</Text>
                      {/* <Feather name="check" /> */}
                    </Pressable>
                  );
                })}
              </View>
            )
          ) : null}
        </ScrollView>
        <View style={styles.footerContainer}>
          <AppButton
            text="Add filter"
            style={{ paddingVertical: spacing(16) }}
            onPress={() => setView('add')}
          />
        </View>
      </ActionSheet>
    </View>
  );
}

const styles = createStyleSheet({
  filterIcon: {
    padding: spacing(7),
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.gray[200],
  },
  sortIcon: {
    width: 20,
    height: 20,
  },
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
  image: {
    height: scale(104),
    marginBottom: spacing(24),
  },
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
    textTransform: 'capitalize',
  },
  footerContainer: {
    paddingBottom: Platform.OS === 'ios' ? spacing(45) : spacing(20),
    paddingInline: spacing(20),
    backgroundColor: '#f9f9f9',
  },
});
