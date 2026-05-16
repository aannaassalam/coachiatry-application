import { View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { theme } from '../../theme';
import { scale, spacing } from '../../utils';
import { Skeleton } from '../ui/Skeleton';

type Props = {
  count?: number;
  paddingHorizontal?: number;
  trailing?: boolean;
};

export default function AvatarListSkeleton({
  count = 8,
  paddingHorizontal = 16,
  trailing = false,
}: Props) {
  return (
    <View style={[styles.container, { paddingHorizontal: spacing(paddingHorizontal) }]}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>
          <View style={styles.row}>
            <Skeleton
              width={scale(48)}
              height={scale(48)}
              borderRadius={scale(24)}
            />
            <View style={styles.text}>
              <Skeleton width="55%" height={14} borderRadius={4} />
              <Skeleton width="35%" height={12} borderRadius={4} />
            </View>
            {trailing && (
              <View style={styles.trailing}>
                <Skeleton width={40} height={11} borderRadius={4} />
                <Skeleton width={20} height={20} borderRadius={10} />
              </View>
            )}
          </View>
          {i < count - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    paddingTop: spacing(6),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(14),
    gap: spacing(12),
  },
  text: {
    flex: 1,
    gap: spacing(8),
  },
  trailing: {
    alignItems: 'flex-end',
    gap: spacing(8),
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray[200],
  },
});
