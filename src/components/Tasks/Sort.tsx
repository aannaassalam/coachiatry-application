import { Image, Pressable, Text, View } from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import { createStyleSheet } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import { assets } from '../../assets';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';

const SortSheetBody = () => {
  return (
    <View>
      <Text style={styles.heading}>Sort by</Text>
      <View>
        <Pressable style={styles.status}>
          <Text style={styles.statusText}>Due Date</Text>
          <Feather name="check" />
        </Pressable>
        <Pressable style={styles.status}>
          <Text style={styles.statusText}>Category</Text>
          <Feather name="check" />
        </Pressable>
        <Pressable style={styles.status}>
          <Text style={styles.statusText}>Status</Text>
          <Feather name="check" />
        </Pressable>
        <Pressable style={styles.status}>
          <Text style={styles.statusText}>Priority</Text>
          <Feather name="check" />
        </Pressable>
      </View>
    </View>
  );
};

export default function Sort() {
  return (
    <View>
      <Pressable
        style={styles.filterIcon}
        onPress={() =>
          SheetManager.show('general-sheet', {
            payload: {
              children: <SortSheetBody />,
            },
          })
        }
      >
        <Image source={assets.icons.sort} style={styles.sortIcon} />
      </Pressable>
    </View>
  );
}

const styles = createStyleSheet({
  filterIcon: {
    padding: spacing(7),
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.gray[200],
  },
  sortIcon: {
    width: 20,
    height: 20,
  },
  heading: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(18),
    color: theme.colors.black,
    marginBottom: spacing(10),
  },
  status: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(16),
    color: theme.colors.black,
  },
});
