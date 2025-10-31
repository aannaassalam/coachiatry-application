import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';

interface AppButtonProps {
  text?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  variant?: 'primary' | 'outline' | 'secondary-outline';
}

const AppButton: React.FC<AppButtonProps> = ({
  text,
  style,
  textStyle,
  onPress,
  leftIcon,
  variant = 'primary',
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'outline' && styles.outlineButton,
        variant === 'secondary-outline' && styles.secondaryOutlineButton,
        style,
      ]}
    >
      {leftIcon && leftIcon}
      <Text
        style={[
          styles.buttonText,
          variant === 'outline' && styles.outlineText,
          variant === 'secondary-outline' && styles.secondaryOutlineButtonText,
          textStyle,
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

export default AppButton;

const styles = StyleSheet.create({
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
});
