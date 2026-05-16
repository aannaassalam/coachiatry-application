import { useEffect } from 'react';
import {
  DimensionValue,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../../theme';

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

const PULSE_DURATION = 800;

export function Skeleton({
  width,
  height,
  borderRadius = 6,
  style,
}: SkeletonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: PULSE_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.5, 1]),
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius },
        style,
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.gray[200],
  },
});
