import { View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import { Skeleton } from '../ui/Skeleton';
import { FLOATING_BAR_FOOTPRINT } from '../Chat/FloatingChatHost';

export default function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {[0, 1, 2].map(section => (
        <View key={section} style={styles.card}>
          <View style={styles.headerRow}>
            <Skeleton width={120} height={16} borderRadius={4} />
            <Skeleton width={50} height={12} borderRadius={4} />
          </View>
          <View style={styles.body}>
            {[0, 1, 2].map(i => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemText}>
                  <Skeleton width="70%" height={14} borderRadius={4} />
                  <Skeleton width="40%" height={11} borderRadius={4} />
                </View>
                <Skeleton width={36} height={20} borderRadius={6} />
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
    padding: spacing(16),
    paddingBottom: FLOATING_BAR_FOOTPRINT,
    gap: spacing(16),
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.darkGray,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing(16),
    borderBottomColor: theme.colors.darkGray,
    borderBottomWidth: 1,
  },
  body: {
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
    margin: spacing(12),
    padding: spacing(10),
    gap: spacing(10),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(10),
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(14),
  },
  itemText: {
    flex: 1,
    gap: spacing(8),
  },
});
