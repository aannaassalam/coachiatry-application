import { View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { theme } from '../../theme';
import { scale, spacing } from '../../utils';
import { Skeleton } from '../ui/Skeleton';

export default function GroupFormSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.avatarSection}>
        <Skeleton
          width={scale(96)}
          height={scale(96)}
          borderRadius={scale(48)}
        />
      </View>
      <View style={styles.formField}>
        <Skeleton width={50} height={12} borderRadius={4} />
        <Skeleton width="100%" height={44} borderRadius={8} />
      </View>
      <View style={styles.membersHeader}>
        <Skeleton width={90} height={14} borderRadius={4} />
      </View>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i}>
          <View style={styles.row}>
            <Skeleton
              width={scale(40)}
              height={scale(40)}
              borderRadius={scale(20)}
            />
            <View style={styles.text}>
              <Skeleton width="55%" height={14} borderRadius={4} />
              <Skeleton width="35%" height={11} borderRadius={4} />
            </View>
          </View>
          {i < 4 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    paddingHorizontal: spacing(20),
    paddingTop: spacing(20),
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing(16),
  },
  formField: {
    gap: spacing(8),
    marginBottom: spacing(20),
  },
  membersHeader: {
    paddingVertical: spacing(8),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(12),
    gap: spacing(12),
  },
  text: {
    flex: 1,
    gap: spacing(8),
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray[200],
  },
});
