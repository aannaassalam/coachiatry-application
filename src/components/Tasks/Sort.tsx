import React, { useState } from 'react';
import { View, Text, Pressable, Image, Platform } from 'react-native';
import ActionSheet, {
  SheetManager,
  SheetProps,
  ScrollView,
} from 'react-native-actions-sheet';
import { Feather } from '@react-native-vector-icons/feather';
import { createStyleSheet } from 'react-native-unistyles';

import { assets } from '../../assets';
import AppButton from '../ui/AppButton';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';

// ----------------- Helpers -----------------
const cycleMongoSort = (current: string, key: string) => {
  if (current === '') return key; // asc
  if (current === key) return '-' + key; // desc
  if (current === '-' + key) return ''; // remove
  return key;
};

const getArrow = (current: string, key: string) => {
  if (current === key)
    return <Feather name="arrow-up" size={18} color={theme.colors.gray[500]} />;
  if (current === '-' + key)
    return (
      <Feather name="arrow-down" size={18} color={theme.colors.gray[500]} />
    );
  return null;
};

// ----------------- Sheet Body -----------------
const SortSheetBody = ({
  appliedSort,
  onSelect,
}: {
  appliedSort: string;
  onSelect: (key: string) => void;
}) => {
  return (
    <View>
      <Text style={styles.heading}>Sort by</Text>

      {/* Sort by Name */}
      <Pressable style={styles.sortRow} onPress={() => onSelect('title')}>
        <Text style={styles.sortText}>Name</Text>
        {getArrow(appliedSort, 'title')}
      </Pressable>

      {/* Sort by Due Date */}
      <Pressable style={styles.sortRow} onPress={() => onSelect('dueDate')}>
        <Text style={styles.sortText}>Due Date</Text>
        {getArrow(appliedSort, 'dueDate')}
      </Pressable>
    </View>
  );
};

// ----------------- Registered Sheet -----------------
export const SortSheet = (props: SheetProps<'sort-sheet'>) => {
  const initialSort = props.payload?.sort ?? '';
  const setSort = props.payload?.setSort;

  const [localSort, setLocalSort] = useState(initialSort);

  const handleCycle = (key: string) => {
    setLocalSort(prev => cycleMongoSort(prev, key));
  };

  const applySort = () => {
    if (setSort) setSort(localSort);
    SheetManager.hide('sort-sheet');
  };

  return (
    <ActionSheet
      id="sort-sheet"
      useBottomSafeAreaPadding
      backgroundInteractionEnabled={false}
      closeOnTouchBackdrop
      indicatorStyle={{ display: 'none' }}
      gestureEnabled
      containerStyle={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        nestedScrollEnabled
      >
        <SortSheetBody appliedSort={localSort} onSelect={handleCycle} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <AppButton
          text="Apply"
          style={{ paddingVertical: spacing(16) }}
          onPress={applySort}
        />
      </View>
    </ActionSheet>
  );
};

// ----------------- Trigger Button -----------------
export default function SortButton({
  sort,
  setSort,
}: {
  sort: string;
  setSort: React.Dispatch<React.SetStateAction<string>>;
}) {
  const openSheet = () => {
    SheetManager.show('sort-sheet', {
      payload: {
        sort,
        setSort,
      },
    });
  };

  return (
    <View>
      <Pressable style={styles.filterIcon} onPress={openSheet}>
        <Image source={assets.icons.sort} style={styles.sortIcon} />
      </Pressable>
    </View>
  );
}

// ----------------- Styles -----------------
const styles = createStyleSheet({
  container: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#f9f9f9',
  },
  contentContainer: {
    padding: spacing(20),
    paddingBottom: spacing(10),
    marginBottom: spacing(10),
  },
  filterIcon: {
    padding: spacing(7),
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.gray[200],
  },
  sortIcon: { width: 20, height: 20 },
  heading: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(18),
    color: theme.colors.black,
    marginBottom: spacing(10),
  },
  sortRow: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(16),
    color: theme.colors.black,
    paddingVertical: spacing(3),
  },
  footerContainer: {
    // paddingBottom: Platform.OS === 'ios' ? spacing(35) : spacing(20),
    paddingBottom: spacing(10),
    paddingInline: spacing(20),
    backgroundColor: '#f9f9f9',
  },
});
