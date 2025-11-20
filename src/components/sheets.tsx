import { Feather } from '@react-native-vector-icons/feather';
import moment from 'moment';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import DatePicker from 'react-native-date-picker';
import { createStyleSheet } from 'react-native-unistyles';
import { theme } from '../theme';
import { fontSize, spacing, verticalScale } from '../utils';

type Option = {
  label: string;
  value: string;
};

export const GeneralPickerSheet = ({
  options,
  value,
  onChange,
  heading,
  isLoading,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  heading: string;
  isLoading?: boolean;
}) => {
  return (
    <View>
      <Text style={styles.heading}>{heading}</Text>
      {isLoading ? (
        <View
          style={{
            height: verticalScale(150),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="small" />
        </View>
      ) : (
        options.map(option => (
          <Pressable
            style={styles.box}
            onPress={() => {
              onChange(option.value);
              SheetManager.hide('general-sheet');
            }}
            key={option.value}
          >
            <Text style={styles.boxText}>{option.label}</Text>
            {option.value === value && <Feather name="check" />}
          </Pressable>
        ))
      )}
    </View>
  );
};

export const DateTimePicker = ({
  value,
  onChange,
  heading,
}: {
  value: string;
  onChange: (value: string) => void;
  heading: string;
}) => {
  return (
    <View>
      <Text style={styles.heading}>{heading}</Text>
      <DatePicker
        mode="datetime"
        date={new Date(value)}
        onDateChange={date => onChange(moment(date).toISOString())}
      />
    </View>
  );
};

const styles = createStyleSheet({
  heading: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(18),
    color: theme.colors.black,
    marginBottom: spacing(20),
  },
  box: {
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    marginBottom: spacing(8),
    borderRadius: 8,
  },
  boxText: {
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.black,
    fontSize: fontSize(14),
  },
});
