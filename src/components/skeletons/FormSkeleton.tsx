import { View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { spacing } from '../../utils';
import { Skeleton } from '../ui/Skeleton';

type Props = {
  fields?: number;
};

export default function FormSkeleton({ fields = 6 }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: fields }).map((_, i) => (
        <View key={i} style={styles.field}>
          <Skeleton width={80} height={12} borderRadius={4} />
          <Skeleton width="100%" height={44} borderRadius={8} />
        </View>
      ))}
      <View style={styles.actions}>
        <Skeleton width="100%" height={48} borderRadius={10} />
      </View>
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    padding: spacing(20),
    gap: spacing(20),
  },
  field: {
    gap: spacing(8),
  },
  actions: {
    marginTop: spacing(8),
  },
});
