import { View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import { Skeleton } from '../ui/Skeleton';

export default function DocumentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <Skeleton width="80%" height={16} borderRadius={4} />
          <View style={styles.footer}>
            <Skeleton width={80} height={20} borderRadius={10} />
            <View style={styles.dateRow}>
              <Skeleton width={14} height={14} borderRadius={3} />
              <Skeleton width={70} height={11} borderRadius={4} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    paddingTop: spacing(8),
    gap: spacing(16),
  },
  card: {
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(12),
    gap: spacing(16),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(16),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
  },
});
