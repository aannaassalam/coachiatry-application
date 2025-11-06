// LoaderAnimation.tsx
import { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { assets, RawLogo } from '../assets';
import { useAuth } from '../hooks/useAuth';

const { width } = Dimensions.get('window');
const DARK_BLUE = '#0E1734';

const AnimatedLogo = Animated.createAnimatedComponent(RawLogo);

interface LoaderAnimationProps {
  onFinish?: () => void;
}

export default function AuthSwitchingLoader({
  onFinish,
}: LoaderAnimationProps) {
  const { isProfileLoading } = useAuth();
  const bgScale = useSharedValue(0);
  const size = useSharedValue(60);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isProfileLoading) return;

    requestAnimationFrame(() => {
      bgScale.value = withTiming(1, {
        duration: 1800,
        easing: Easing.out(Easing.ease),
      });

      size.value = withDelay(
        300,
        withTiming(1200, {
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
        }),
      );

      opacity.value = withDelay(
        650,
        withTiming(
          0,
          {
            duration: 600,
            easing: Easing.out(Easing.ease),
          },
          finished => {
            if (finished && onFinish) {
              runOnJS(onFinish)();
            }
          },
        ),
      );
    });
  }, [isProfileLoading, bgScale, size, opacity, onFinish]);

  // Animated styles
  const bgStyle = useAnimatedStyle(() => {
    const scale = interpolate(bgScale.value, [0, 1], [1, 40]);
    return { transform: [{ scale }] };
  });

  const animatedStyle = useAnimatedStyle(() => ({
    width: size.value,
    height: size.value,
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      <Animated.View style={[styles.bgCircle, bgStyle]} />
      {/* <AnimatedLogo animatedProps={[styles.logoText, animatedStyle]} /> */}
      <Animated.View style={animatedStyle}>
        <RawLogo width="100%" height="100%" />
      </Animated.View>
      {/* <Animated.Image
        source={assets.images.logo}
        style={[styles.logoText, animatedStyle]}
      /> */}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: width * 0.3,
    backgroundColor: DARK_BLUE,
  },
  logoText: {},
});
