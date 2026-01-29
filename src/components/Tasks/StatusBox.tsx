import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import { createStyleSheet } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import { Status } from '../../typescript/interface/status.interface';
import { useQuery } from '@tanstack/react-query';
import { getAllStatuses } from '../../api/functions/status.api';

const StatusBoxSheetBody = ({ status }: { status: Status }) => {
  const { data = [] } = useQuery({
    queryKey: ['status'],
    queryFn: getAllStatuses,
  });

  return (
    <View>
      <Text style={styles.heading}>Status</Text>
      <FlatList
        data={data}
        contentContainerStyle={styles.statuses}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyExtractor={item => item._id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Pressable style={styles.status}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing(8),
              }}
            >
              <View style={styles.statusOutsideBox(item.color.text, 12)}>
                <View style={styles.statusInsideBox(10)} />
              </View>
              <Text style={styles.statusText}>{item.title}</Text>
            </View>
            {status._id === item._id && (
              <Feather name="check" size={fontSize(16)} />
            )}
          </Pressable>
        )}
      />
    </View>
  );
};

export default function StatusBox({ status }: { status: Status }) {
  return (
    <View style={{ paddingHorizontal: spacing(10) }}>
      <Pressable
        style={styles.statusOutsideBox(status.color.text, 14)}
        onPress={() =>
          SheetManager.show('general-sheet', {
            payload: {
              paddingBottom: spacing(10),
              children: <StatusBoxSheetBody status={status} />,
            },
          })
        }
      >
        <View style={styles.statusInsideBox(12)} />
      </Pressable>
    </View>
  );
}

const styles = createStyleSheet({
  statusOutsideBox: (backgroundColor, size) => ({
    width: size ?? 14,
    height: size ?? 14,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
  }),
  statusInsideBox: size => ({
    width: size ?? 12,
    height: size ?? 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: theme.colors.white,
  }),
  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(18),
    color: theme.colors.black,
    marginBottom: spacing(20),
  },
  statuses: {
    // paddingBottom: spacing(170),
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
