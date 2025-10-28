import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Entypo from 'react-native-vector-icons/Entypo';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';

function AppCheckBox({
  text,
  isChecked,
  toggleCheck,
}: {
  text: string;
  isChecked: boolean;
  toggleCheck: () => void;
}) {
  const { styles } = useStyles(stylesheet);

  return (
    <TouchableOpacity
      onPress={() => toggleCheck()}
      activeOpacity={0.8}
      style={styles.checkboxRow}
    >
      <View
        style={{
          ...styles.checkbox,
          backgroundColor: isChecked ? theme.colors.primary : '',
        }}
      >
        {isChecked && (
          <Entypo name={'check'} size={14} color={theme.colors.white} />
        )}
      </View>
      <Text style={styles.checkboxText}>Remember device for 30 days</Text>
    </TouchableOpacity>
  );
}

export default AppCheckBox;
const stylesheet = createStyleSheet({
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(20),
  },
  checkbox: {
    width: fontSize(16),
    height: fontSize(16),
    borderRadius: fontSize(4),
    borderWidth: fontSize(1),
    borderColor: theme.colors.gray[300],
    marginRight: spacing(10),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: fontSize(13),
    color: theme.colors.gray[700],
    fontFamily: theme.fonts.lato.regular,
  },
});
