import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontSize, spacing } from '../../utils';
import { theme } from '../../theme';

function AppBadge({
  bgColor,
  dotColor,
  text,
}: {
  bgColor: string;
  dotColor: string;
  text: string;
}) {
  return (
    <View style={[styles.tagContainer, { backgroundColor: bgColor }]}>
      <View style={[styles.tagDot, { backgroundColor: dotColor }]} />
      <Text style={[styles.tagText, { color: dotColor }]}>{text}</Text>
    </View>
  );
}

export default AppBadge;
const styles = StyleSheet.create({
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(8),
    paddingVertical: spacing(5),
    borderRadius: fontSize(20),
  },
  tagDot: {
    width: fontSize(6),
    height: fontSize(6),
    borderRadius: fontSize(3),
    marginRight: spacing(6),
  },
  tagText: {
    fontSize: fontSize(12),
    fontFamily: theme.fonts.archivo.medium,
    letterSpacing: -0.32,
  },
});
