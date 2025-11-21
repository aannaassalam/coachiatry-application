import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { spacing } from '../../utils';
import { theme } from '../../theme';
import { createStyleSheet } from 'react-native-unistyles';

const DOT_SIZE = 4;
const DURATION = 600;

export default function TypingIndicator() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(withTiming(1, { duration: DURATION }), -1, true);
    dot2.value = withDelay(
      130,
      withRepeat(withTiming(1, { duration: DURATION }), -1, true),
    );
    dot3.value = withDelay(
      260,
      withRepeat(withTiming(1, { duration: DURATION }), -1, true),
    );
  }, [dot1, dot2, dot3]);

  const dot1Style = useAnimatedStyle(() => {
    const scale = interpolate(dot1.value, [0, 1], [1, 1.6]);
    const opacity = interpolate(dot1.value, [0, 1], [0.4, 1]);
    return { transform: [{ scale }], opacity };
  });

  const dot2Style = useAnimatedStyle(() => {
    const scale = interpolate(dot2.value, [0, 1], [1, 1.6]);
    const opacity = interpolate(dot2.value, [0, 1], [0.4, 1]);
    return { transform: [{ scale }], opacity };
  });

  const dot3Style = useAnimatedStyle(() => {
    const scale = interpolate(dot3.value, [0, 1], [1, 1.6]);
    const opacity = interpolate(dot3.value, [0, 1], [0.4, 1]);
    return { transform: [{ scale }], opacity };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, dot1Style]} />
      <Animated.View style={[styles.dot, dot2Style]} />
      <Animated.View style={[styles.dot, dot3Style]} />
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(13),
    borderRadius: 12,
    borderBottomLeftRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start', // message bubble alignment
    marginBottom: spacing(8),
    gap: spacing(5),
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    backgroundColor: theme.colors.gray[400],
    borderRadius: DOT_SIZE / 2,
  },
});
