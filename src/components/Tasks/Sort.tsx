import { Image, Pressable, Text, View } from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import { createStyleSheet } from 'react-native-unistyles';
import { Feather } from '@react-native-vector-icons/feather';
import { assets } from '../../assets';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';

const SortSheetBody = ({
  sort,
  setSort,
}: {
  sort: string;
  setSort: React.Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <View>
      <Text style={styles.heading}>Sort by</Text>
      <View>
        <Pressable
          style={styles.status}
          onPress={() => setSort(prev => (prev === 'name' ? '' : 'name'))}
        >
          <Text style={styles.statusText}>Name</Text>
          {sort === 'name' && <Feather name="check" />}
        </Pressable>
        <Pressable
          style={styles.status}
          onPress={() => setSort(prev => (prev === 'dueDate' ? '' : 'dueDate'))}
        >
          <Text style={styles.statusText}>Due Date</Text>
          {sort === 'dueDate' && <Feather name="check" />}
        </Pressable>
      </View>
    </View>
  );
};

export default function Sort(props: {
  sort: string;
  setSort: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <View>
      <Pressable
        style={styles.filterIcon}
        onPress={() =>
          SheetManager.show('general-sheet', {
            payload: {
              children: (
                <SortSheetBody sort={props.sort} setSort={props.setSort} />
              ),
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
