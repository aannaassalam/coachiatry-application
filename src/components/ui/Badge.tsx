import React from 'react';
import { Text, View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { fontSize, scale, spacing } from '../../utils';
import { theme } from '../../theme';

export default function Badge({
  title,
  bgColor,
  color,
}: {
  title: string;
  bgColor: string;
  color: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <View style={[styles.circle, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{title}</Text>
    </View>
  );
}

const styles = createStyleSheet({
  badge: {
    paddingVertical: spacing(5),
    paddingHorizontal: spacing(8),
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
  },
  circle: {
    width: scale(6),
    height: scale(6),
    borderRadius: 100,
  },
  text: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(12),
  },
});
