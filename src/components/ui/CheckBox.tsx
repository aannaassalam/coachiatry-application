import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { theme } from '../../theme';
import { createStyleSheet } from 'react-native-unistyles';
import { fontSize, scale } from '../../utils';

export default function CheckBox({
  checked,
  onPress,
}: {
  checked?: boolean;
  onPress?: (toggle: boolean) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onPress && onPress(!checked)}
      style={[
        styles.checkbox,
        checked && {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
      ]}
    >
      {checked && (
        <FontAwesome6
          name="check"
          color={theme.colors.white}
          size={fontSize(10)}
        />
      )}
    </TouchableOpacity>
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
