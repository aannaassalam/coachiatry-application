import { View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import { Skeleton } from '../ui/Skeleton';

export default function TaskListSkeleton() {
  return (
    <View style={styles.container}>
      {[0, 1, 2].map(group => (
        <View key={group} style={styles.group}>
          <View style={styles.header}>
            <Skeleton width={14} height={14} borderRadius={4} />
            <Skeleton width={110} height={26} borderRadius={13} />
          </View>
          <View style={styles.list}>
            {[0, 1].map(row => (
              <View key={row} style={styles.taskRow}>
                <View style={styles.taskRowText}>
                  <Skeleton width="65%" height={14} borderRadius={4} />
                  <Skeleton width="35%" height={11} borderRadius={4} />
                </View>
                <Skeleton width={36} height={22} borderRadius={6} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    paddingVertical: spacing(6),
  },
  group: {
    paddingVertical: spacing(5),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(16),
    gap: spacing(12),
  },
  list: {
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(10),
    gap: spacing(10),
    marginHorizontal: spacing(10),
  },
  taskRow: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(12),
    borderRadius: spacing(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
  },
  taskRowText: {
    flex: 1,
    gap: spacing(8),
  },
});
