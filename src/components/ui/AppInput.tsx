import React, { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';

function AppInput({
  label,
  placeholder,
  keyboardType,
}: {
  label: string;
  placeholder: string;
  keyboardType?: string;
}) {
  const { styles } = useStyles(stylesheet);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.gray[500]}
        style={styles.input}
      />
    </View>
  );
}

export default AppInput;
const stylesheet = createStyleSheet({
  label: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[950],
    marginBottom: spacing(8),
  },
  input: {
    borderWidth: fontSize(1),
    borderColor: theme.colors.gray[200],
    borderRadius: fontSize(10),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(14),
    fontSize: fontSize(14),
    color: theme.colors.gray[900],
    backgroundColor: theme.colors.white,
  },
});
