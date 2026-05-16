import { View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { spacing } from '../../utils';
import { Skeleton } from '../ui/Skeleton';

export default function DocumentEditorSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width="80%" height={24} borderRadius={4} />
      <View style={styles.tagRow}>
        <Skeleton width={80} height={22} borderRadius={11} />
        <Skeleton width={120} height={14} borderRadius={4} />
      </View>
      <View style={styles.body}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            width={i % 4 === 3 ? '40%' : '100%'}
            height={12}
            borderRadius={4}
          />
        ))}
      </View>
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    padding: spacing(20),
    gap: spacing(16),
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
  },
  body: {
    gap: spacing(12),
    marginTop: spacing(12),
  },
});
