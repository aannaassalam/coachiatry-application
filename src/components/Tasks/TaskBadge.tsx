import React from 'react';
import { Text, View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { fontSize, spacing } from '../../utils';
import { theme } from '../../theme';

export default function TaskBadge({
  title,
  count,
  backgroundColor,
  labelColor,
  marginBottom = 0,
}: {
  title: string;
  count: number;
  backgroundColor: string;
  labelColor: string;
  marginBottom?: number;
}) {
  return (
    <View
      style={[
        styles.labelContainer,
        { backgroundColor: backgroundColor, marginBottom },
      ]}
    >
      <Text style={[styles.labelText, { color: labelColor }]}>{title}</Text>
      <View
        style={[
          styles.countBadge,
          {
            backgroundColor: labelColor,
          },
        ]}
      >
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );
}

const styles = createStyleSheet({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: fontSize(5),
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(6),
    paddingRight: spacing(4),
  },
  labelText: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.archivo.medium,
    textTransform: 'capitalize',
  },
  countBadge: {
    marginLeft: spacing(6),
    borderRadius: fontSize(4),
    paddingHorizontal: spacing(5.7),
    paddingVertical: spacing(3),
  },
  countText: {
    color: theme.colors.white,
    fontSize: fontSize(11),
    fontFamily: theme.fonts.archivo.bold,
  },
});
