import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import ActionSheet, {
  ScrollView,
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import { deleteCategory } from '../api/functions/category.api';
import { deleteStatus } from '../api/functions/status.api';
import { theme } from '../theme';
import { fontSize, spacing } from '../utils';
import Badge from './ui/Badge';
import AppButton from './ui/AppButton';

const SHEET_ID = 'delete-taxonomy-sheet';

export default function DeleteTaxonomySheet(
  props: SheetProps<'delete-taxonomy-sheet'>,
) {
  const { styles } = useStyles(stylesheet);
  const payload = props.payload;
  const type = payload?.type ?? 'category';
  const item = payload?.item;
  const options = payload?.options ?? [];
  const isCategory = type === 'category';
  const noun = isCategory ? 'category' : 'status';

  const [replacementId, setReplacementId] = useState<string | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      isCategory
        ? deleteCategory(item!._id, replacementId)
        : deleteStatus(item!._id, replacementId),
    onSuccess: res => {
      if (res && 'status' in res && res.status === 'requires_replacement') {
        setError(
          `This ${noun} is used by ${res.taskCount} task${
            res.taskCount === 1 ? '' : 's'
          }. Choose a ${noun} to transfer them to before deleting.`,
        );
        return;
      }
      payload?.onDeleted?.();
      SheetManager.hide(SHEET_ID);
    },
    meta: {
      invalidateQueries: isCategory ? ['categories'] : ['status'],
    },
  });

  if (!item) return null;

  return (
    <ActionSheet
      id={SHEET_ID}
      useBottomSafeAreaPadding
      closeOnTouchBackdrop={!isPending}
      indicatorStyle={{ display: 'none' }}
      gestureEnabled={!isPending}
      drawUnderStatusBar={false}
      containerStyle={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Feather name="trash-2" size={fontSize(20)} color="#DC2626" />
          </View>
          <Pressable
            style={styles.closeButton}
            hitSlop={spacing(8)}
            disabled={isPending}
            onPress={() => SheetManager.hide(SHEET_ID)}
          >
            <Feather
              name="x"
              size={fontSize(20)}
              color={theme.colors.gray[500]}
            />
          </Pressable>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.heading}>Delete {noun}?</Text>
          <Text style={styles.subtitle}>
            “{item.title}” will be removed. You can optionally transfer all tasks
            using it to another {noun} first.
          </Text>
        </View>

        <View>
          <Text style={styles.label}>Transfer tasks to (optional)</Text>
          <ScrollView
            style={styles.optionsScroll}
            nestedScrollEnabled
            contentContainerStyle={{ gap: spacing(8) }}
          >
            <Pressable
              style={[
                styles.optionRow,
                !replacementId && styles.optionRowActive,
              ]}
              onPress={() => {
                setReplacementId(undefined);
                setError(null);
              }}
            >
              <Text style={styles.optionPlainText}>Don’t transfer</Text>
              {!replacementId && (
                <Feather
                  name="check"
                  size={fontSize(16)}
                  color={theme.colors.primary}
                />
              )}
            </Pressable>
            {options.map(option => {
              const active = replacementId === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.optionRow, active && styles.optionRowActive]}
                  onPress={() => {
                    setReplacementId(option.value);
                    setError(null);
                  }}
                >
                  <Badge
                    title={option.label}
                    bgColor={option.bg}
                    color={option.text}
                  />
                  {active && (
                    <Feather
                      name="check"
                      size={fontSize(16)}
                      color={theme.colors.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.footer}>
          <AppButton
            variant="primary"
            text="Cancel"
            style={styles.cancelButton}
            textStyle={{ color: theme.colors.primary }}
            disabled={isPending}
            onPress={() => SheetManager.hide(SHEET_ID)}
          />
          <AppButton
            variant="primary"
            text="Delete"
            style={styles.deleteButton}
            isLoading={isPending}
            onPress={() => mutate()}
          />
        </View>
      </View>
    </ActionSheet>
  );
}

const stylesheet = createStyleSheet({
  container: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#f9f9f9',
  },
  content: {
    padding: spacing(20),
    paddingTop: spacing(24),
    gap: spacing(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: spacing(42),
    height: spacing(42),
    borderRadius: spacing(21),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: spacing(2),
  },
  titleBlock: {
    gap: spacing(6),
  },
  heading: {
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(18),
    color: theme.colors.gray[950],
    textTransform: 'capitalize',
  },
  subtitle: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[600],
    lineHeight: fontSize(19),
  },
  label: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[500],
    marginBottom: spacing(10),
  },
  optionsScroll: {
    maxHeight: spacing(200),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(12),
    borderRadius: fontSize(10),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    backgroundColor: theme.colors.white,
  },
  optionRowActive: {
    borderColor: theme.colors.primary,
  },
  optionPlainText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.gray[900],
  },
  errorText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12.5),
    color: '#DC2626',
    marginTop: spacing(-4),
  },
  footer: {
    flexDirection: 'row',
    gap: spacing(12),
    marginTop: spacing(4),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.darkGray,
    paddingVertical: spacing(14),
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: spacing(14),
  },
});
