import React from 'react';
import { Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';

interface AppButtonProps {
  text?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  variant?: 'primary' | 'outline' | 'secondary-outline';
}

function AppButton({
  text,
  style,
  onPress,
  leftIcon,
  variant,
}: AppButtonProps) {
  const { styles } = useStyles(stylesheet);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'outline' && styles.outlineButton,
        variant === 'secondary-outline' && styles.secondaryOutlineButton,

        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {leftIcon && leftIcon}
      <Text
        style={[
          styles.buttonText,
          variant === 'outline' && styles.outlineText,
          variant === 'secondary-outline' && styles.secondaryOutlineButtonText,
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}

export default AppButton;

const stylesheet = createStyleSheet(() => ({
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: fontSize(10),
    padding: spacing(12),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing(10),
  },
  buttonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(15),
  },
  outlineButton: {
    backgroundColor: theme.colors.white,
    borderWidth: fontSize(1),
    borderColor: theme.colors.gray[200],
  },
  secondaryOutlineButton: {
    backgroundColor: theme.colors.white,
    borderWidth: fontSize(1),
    borderColor: theme.colors.primary,
  },
  secondaryOutlineButtonText: {
    color: theme.colors.primary,
  },
  outlineText: {
    color: theme.colors.gray[700],
  },
}));
