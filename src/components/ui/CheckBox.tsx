import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { theme } from '../../theme';
import { createStyleSheet } from 'react-native-unistyles';
import { fontSize, scale } from '../../utils';
import TouchableButton from '../TouchableButton';

export default function CheckBox({
  checked,
  onPress,
  disabled,
}: {
  checked?: boolean;
  onPress?: (toggle: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <TouchableButton
      onPress={() => onPress && onPress(!checked)}
      style={[
        styles.checkbox,
        checked && {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
      ]}
      disabled={disabled}
    >
      {checked && (
        <FontAwesome6
          name="check"
          solid
          color={theme.colors.white}
          size={fontSize(10)}
        />
      )}
    </TouchableButton>
  );
}

const styles = createStyleSheet({
  checkbox: {
    width: scale(16),
    height: scale(16),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
