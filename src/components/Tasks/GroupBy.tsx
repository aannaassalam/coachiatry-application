import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import ActionSheet, {
  ScrollView,
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';
import { createStyleSheet } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';

import { GROUPABLE_COLUMNS, NO_GROUP } from '../../helpers/taskGroup';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import AppButton from '../ui/AppButton';

const DIRECTIONS: { value: string; label: string }[] = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

// ----------------- Sheet Body -----------------
const GroupBySheetBody = ({
  group,
  groupDir,
  onSelectGroup,
  onSelectDir,
}: {
  group: string;
  groupDir: string;
  onSelectGroup: (key: string) => void;
  onSelectDir: (value: string) => void;
}) => {
  const isGrouped = group !== NO_GROUP;

  return (
    <View>
      <Text style={styles.heading}>Group by</Text>

      <Pressable
        style={styles.row}
        onPress={() => onSelectGroup(NO_GROUP)}
      >
        <Text style={styles.rowText}>No grouping</Text>
        {!isGrouped && (
          <Feather name="check" size={18} color={theme.colors.primary} />
        )}
      </Pressable>

      <View style={styles.divider} />

      {GROUPABLE_COLUMNS.map(column => (
        <Pressable
          key={column.key}
          style={styles.row}
          onPress={() => onSelectGroup(column.key)}
        >
          <Text style={styles.rowText}>{column.label}</Text>
          {group === column.key && (
            <Feather name="check" size={18} color={theme.colors.primary} />
          )}
        </Pressable>
      ))}

      {isGrouped && (
        <>
          <Text style={[styles.heading, styles.subHeading]}>Order</Text>
          {DIRECTIONS.map(direction => (
            <Pressable
              key={direction.value}
              style={styles.row}
              onPress={() => onSelectDir(direction.value)}
            >
              <Text style={styles.rowText}>{direction.label}</Text>
              {groupDir === direction.value && (
                <Feather name="check" size={18} color={theme.colors.primary} />
              )}
            </Pressable>
          ))}
        </>
      )}
    </View>
  );
};

// ----------------- Registered Sheet -----------------
export const GroupBySheet = (props: SheetProps<'group-sheet'>) => {
  const setGroup = props.payload?.setGroup;
  const setGroupDir = props.payload?.setGroupDir;

  const [localGroup, setLocalGroup] = useState(
    props.payload?.group ?? 'status',
  );
  const [localGroupDir, setLocalGroupDir] = useState(
    props.payload?.groupDir ?? 'asc',
  );

  const applyGroup = () => {
    if (setGroup) setGroup(localGroup);
    if (setGroupDir) setGroupDir(localGroupDir);
    SheetManager.hide('group-sheet');
  };

  return (
    <ActionSheet
      id="group-sheet"
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
        <GroupBySheetBody
          group={localGroup}
          groupDir={localGroupDir}
          onSelectGroup={setLocalGroup}
          onSelectDir={setLocalGroupDir}
        />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <AppButton
          text="Apply"
          style={{ paddingVertical: spacing(16) }}
          onPress={applyGroup}
        />
      </View>
    </ActionSheet>
  );
};

// ----------------- Trigger Button -----------------
export default function GroupByButton({
  group,
  setGroup,
  groupDir,
  setGroupDir,
}: {
  group: string;
  setGroup: React.Dispatch<React.SetStateAction<string>>;
  groupDir: string;
  setGroupDir: React.Dispatch<React.SetStateAction<string>>;
}) {
  const openSheet = () => {
    SheetManager.show('group-sheet', {
      payload: {
        group,
        setGroup,
        groupDir,
        setGroupDir,
      },
    });
  };

  return (
    <View>
      <Pressable style={styles.filterIcon} onPress={openSheet}>
        <Feather name="layers" size={20} color={theme.colors.gray[600]} />
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
  heading: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(18),
    color: theme.colors.black,
    marginBottom: spacing(10),
  },
  subHeading: {
    marginTop: spacing(16),
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray[200],
    marginVertical: spacing(6),
  },
  row: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(16),
    color: theme.colors.black,
    paddingVertical: spacing(3),
  },
  footerContainer: {
    paddingBottom: spacing(10),
    paddingInline: spacing(20),
    backgroundColor: '#f9f9f9',
  },
});
