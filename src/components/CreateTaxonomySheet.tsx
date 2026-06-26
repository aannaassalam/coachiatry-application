import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import ActionSheet, {
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import {
  addCategory,
  addCategoryByCoach,
} from '../api/functions/category.api';
import { addStatus, addStatusByCoach } from '../api/functions/status.api';
import { predefinedColors, TaxonomyColor } from '../constants/taxonomyColors';
import { theme } from '../theme';
import { fontSize, spacing } from '../utils';
import Badge from './ui/Badge';
import AppButton from './ui/AppButton';

const SHEET_ID = 'create-taxonomy-sheet';

export default function CreateTaxonomySheet(
  props: SheetProps<'create-taxonomy-sheet'>,
) {
  const { styles } = useStyles(stylesheet);
  const { type, userId, onCreated } = props.payload ?? {
    type: 'category' as const,
  };
  const isCategory = type === 'category';

  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState<TaxonomyColor>(
    predefinedColors[0],
  );

  const { mutate, isPending } = useMutation({
    mutationFn: (body: { title: string; color: TaxonomyColor }) => {
      if (isCategory) {
        return userId
          ? addCategoryByCoach({ ...body, user: userId })
          : addCategory(body);
      }
      return userId
        ? addStatusByCoach({ ...body, user: userId })
        : addStatus(body);
    },
    onSuccess: res => {
      const id = res?.data?._id;
      if (id) onCreated?.(id);
      SheetManager.hide(SHEET_ID);
    },
    meta: {
      invalidateQueries: isCategory ? ['categories'] : ['status'],
    },
  });

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed || isPending) return;
    mutate({ title: trimmed, color: selectedColor });
  };

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
          <Text style={styles.heading}>
            New {isCategory ? 'Category' : 'Status'}
          </Text>
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

        <TextInput
          style={styles.input}
          placeholder={`Enter ${isCategory ? 'category' : 'status'} name`}
          placeholderTextColor={theme.colors.gray[400]}
          value={title}
          onChangeText={setTitle}
          editable={!isPending}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />

        <View style={styles.previewRow}>
          <Text style={[styles.label, { marginBottom: 0 }]}>Preview</Text>
          <Badge
            title={title.trim() || `New ${isCategory ? 'Category' : 'Status'}`}
            bgColor={selectedColor.bg}
            color={selectedColor.text}
          />
        </View>

        <View>
          <Text style={styles.label}>Choose Color</Text>
          <View style={styles.swatchGrid}>
            {predefinedColors.map(color => {
              const active = selectedColor.bg === color.bg;
              return (
                <Pressable
                  key={color.bg + color.text}
                  style={[
                    styles.swatch,
                    { backgroundColor: color.bg },
                    active && {
                      borderColor: color.text,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {active && (
                    <Feather
                      name="check"
                      size={fontSize(14)}
                      color={color.text}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <AppButton
          text={`Create ${isCategory ? 'Category' : 'Status'}`}
          onPress={handleCreate}
          isLoading={isPending}
          disabled={!title.trim()}
          style={styles.submitButton}
        />
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
    gap: spacing(18),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(18),
    color: theme.colors.gray[950],
  },
  closeButton: {
    padding: spacing(2),
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: fontSize(10),
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(14),
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[900],
    backgroundColor: theme.colors.white,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(10),
  },
  label: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[500],
    marginBottom: spacing(10),
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(10),
  },
  swatch: {
    width: spacing(36),
    height: spacing(36),
    borderRadius: spacing(18),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    paddingVertical: spacing(14),
    marginTop: spacing(4),
  },
});
