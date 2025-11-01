import { Text, View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { Flag } from '../../assets';
import { theme } from '../../theme';
import { fontSize, scale, spacing } from '../../utils';

export default function Priority({
  priority,
}: {
  priority: 'high' | 'medium' | 'low';
}) {
  return (
    <View style={[styles.priority]}>
      <Flag
        color={
          priority === 'high'
            ? '#E73F3F'
            : priority === 'medium'
              ? '#F4A118'
              : '#52A86E'
        }
        width={scale(18)}
        height={scale(18)}
      />
      <Text style={[styles.text]}>{priority}</Text>
    </View>
  );
}

const styles = createStyleSheet({
  priority: {
    paddingHorizontal: spacing(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(5),
  },
  text: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
    color: '#333',
    textTransform: 'capitalize',
  },
});
