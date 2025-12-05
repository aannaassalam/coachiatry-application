import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number; // 0–100
}

export const CircularProgress = ({ progress }: Props) => {
  const radius = 20;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return {
      strokeDashoffset,
    };
  });

  if (progress >= 100) return null;

  return (
    <Svg height={radius * 2} width={radius * 2}>
      {/* Background ring */}
      <Circle
        stroke="rgba(255,255,255,0.3)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />

      {/* Animated progress ring */}
      <AnimatedCircle
        stroke="#fff"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        strokeDasharray={`${circumference}, ${circumference}`}
        animatedProps={animatedProps}
        transform={`rotate(-90 ${radius} ${radius})`}
      />
    </Svg>
  );
};

export const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return { name: 'file-pdf-o', color: '#E53935' };
  if (mimeType.includes('audio'))
    return { name: 'file-audio-o', color: '#4DB6AC' };
  if (mimeType.includes('text'))
    return { name: 'file-text-o', color: '#7986CB' };
  return { name: 'file-o', color: '#9E9E9E' };
};

export const UploadProgressOverlay = ({ progress }: Props) => {
  const radius = 26;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return {
      strokeDashoffset,
    };
  });

  if (progress >= 100) return null;

  return (
    <View style={styles.overlay}>
      <Svg height={radius * 2} width={radius * 2}>
        {/* Background ring */}
        <Circle
          stroke="rgba(255,255,255,0.3)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />

        {/* Animated progress ring */}
        <AnimatedCircle
          stroke="#fff"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeDasharray={`${circumference}, ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
