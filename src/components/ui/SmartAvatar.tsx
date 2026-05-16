import React, { useState } from 'react';
import {
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { createStyleSheet } from 'react-native-unistyles';
import { spacing } from '../../utils';

function getInitials(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'U';
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

interface SmartAvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  backgroundColor?: string;
  textColor?: string;
}

export const SmartAvatar: React.FC<SmartAvatarProps> = ({
  src,
  name,
  size = spacing(48),
  fontSize,
  style,
  imageStyle,
  backgroundColor = '#FFE8D6',
  textColor = '#DD6B20',
}) => {
  const resolvedFontSize = fontSize ?? Math.round(size * 0.4);
  const [error, setError] = useState(false);
  const opacity = useSharedValue(0);

  const borderRadius = size / 2;

  const animatedImageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius },
        style,
      ]}
    >
      {/* Initials always render — act as the placeholder until the image fades in. */}
      <View
        style={[
          styles.fallback,
          { backgroundColor, borderRadius },
          StyleSheet.absoluteFillObject,
        ]}
      >
        <Text
          style={[
            styles.initials,
            { color: textColor, fontSize: resolvedFontSize },
          ]}
          numberOfLines={1}
        >
          {getInitials(name)}
        </Text>
      </View>

      {/* Image fades in on top of the initials when it loads. */}
      {src && !error && (
        <Animated.Image
          source={{ uri: src }}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius },
            styles.image,
            animatedImageStyle,
            imageStyle,
          ]}
          onLoad={() => {
            opacity.value = withTiming(1, { duration: 220 });
          }}
          onError={() => setError(true)}
        />
      )}
    </View>
  );
};

const styles = createStyleSheet({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: '600',
  },
});
