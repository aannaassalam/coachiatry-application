import { Dimensions, View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { theme } from '../../theme';
import { scale, spacing, verticalScale } from '../../utils';
import { Skeleton } from '../ui/Skeleton';

type Props = {
  rows?: number;
  showAvatar?: boolean;
  showSections?: number;
};

export default function DetailScreenSkeleton({
  rows = 6,
  showAvatar = false,
  showSections = 2,
}: Props) {
  return (
    <View style={styles.container}>
      {showAvatar && (
        <View style={styles.avatarSection}>
          <Skeleton
            width={scale(96)}
            height={scale(96)}
            borderRadius={scale(48)}
          />
          <Skeleton width={scale(150)} height={18} borderRadius={4} />
          <Skeleton width={scale(110)} height={13} borderRadius={4} />
        </View>
      )}
      {!showAvatar && (
        <Skeleton
          width="70%"
          height={20}
          borderRadius={4}
          style={{ marginBottom: spacing(16) }}
        />
      )}
      {Array.from({ length: showSections }).map((_, sIdx) => (
        <View key={sIdx}>
          {Array.from({ length: rows }).map((_, i) => (
            <View key={i} style={styles.row}>
              <Skeleton width={scale(100)} height={14} borderRadius={4} />
              <Skeleton width="40%" height={14} borderRadius={4} />
            </View>
          ))}
          {sIdx < showSections - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    padding: spacing(20),
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing(10),
    marginBottom: spacing(20),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    paddingVertical: spacing(8),
    marginVertical: spacing(2),
  },
  divider: {
    height: verticalScale(8),
    backgroundColor: '#F9F9F9',
    width: Dimensions.get('screen').width,
    marginLeft: spacing(-20),
    marginVertical: spacing(14),
  },
});
