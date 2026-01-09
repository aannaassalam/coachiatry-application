import React, { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';

function AppInput({
  label,
  name,
  placeholder,
  keyboardType,
  disabled,
}: {
  label: string;
  name: string;
  placeholder: string;
  keyboardType?: TextInputProps['keyboardType'];
  disabled?: boolean;
}) {
  const { styles } = useStyles(stylesheet);
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      disabled={disabled}
      render={({ field }) => (
        <View>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            placeholder={placeholder}
            placeholderTextColor={theme.colors.gray[500]}
            style={styles.input}
            keyboardType={keyboardType}
            {...field}
            onChangeText={field.onChange}
            readOnly={field.disabled}
          />
        </View>
      )}
    />
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
