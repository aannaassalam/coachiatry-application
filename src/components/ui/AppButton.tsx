import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import TouchableButton from '../TouchableButton';

interface AppButtonProps {
  text?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  variant?: 'primary' | 'outline' | 'secondary-outline';
  disabled?: boolean;
  isLoading?: boolean;
}

const AppButton: React.FC<AppButtonProps> = ({
  text,
  style,
  textStyle,
  onPress,
  leftIcon,
  variant = 'primary',
  disabled,
  isLoading,
}) => {
  return (
    <TouchableButton
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'outline' && styles.outlineButton,
        variant === 'secondary-outline' && styles.secondaryOutlineButton,
        style,
        isLoading || disabled ? { opacity: 0.7 } : null,
      ]}
      disabled={disabled || isLoading}
    >
      {leftIcon && !isLoading && leftIcon}
      {isLoading && (
        <ActivityIndicator
          animating
          color={
            variant === 'primary'
              ? theme.colors.white
              : variant === 'outline'
                ? theme.colors.gray[700]
                : theme.colors.primary
          }
          size={fontSize(12)}
        />
      )}
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
    </TouchableButton>
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
    fontSize: fontSize(12),
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
