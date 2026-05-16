import { View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { theme } from '../../theme';
import { spacing } from '../../utils';
import { Skeleton } from '../ui/Skeleton';
import { FLOATING_BAR_FOOTPRINT } from '../Chat/FloatingChatHost';

export default function WeekViewSkeleton() {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map(day => (
        <View key={day} style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <Skeleton width={12} height={12} borderRadius={3} />
            <Skeleton width={120} height={20} borderRadius={10} />
          </View>
          {day < 2 && (
            <View style={styles.taskBox}>
              <Skeleton width="70%" height={14} borderRadius={4} />
              <View style={styles.taskMeta}>
                <Skeleton width={80} height={11} borderRadius={4} />
                <Skeleton width={4} height={4} borderRadius={2} />
                <Skeleton width={80} height={11} borderRadius={4} />
              </View>
              <View style={styles.taskFooter}>
                <Skeleton width={20} height={20} borderRadius={10} />
                <Skeleton width={100} height={11} borderRadius={4} />
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    padding: spacing(20),
    paddingBottom: FLOATING_BAR_FOOTPRINT,
    gap: spacing(12),
  },
  dayCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: spacing(14),
    gap: spacing(12),
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
  },
  taskBox: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: spacing(12),
    gap: spacing(10),
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
  },
});
