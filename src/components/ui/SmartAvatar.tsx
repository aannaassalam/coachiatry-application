import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { spacing, fontSize as fSize } from '../../utils';
import Animated from 'react-native-reanimated';

/**
 * Extract initials from a name.
 * e.g. "Anas Alam" -> "AA"
 */
function getInitials(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'U';
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

interface SmartAvatarProps {
  /** Image source URL */
  src?: string;
  /** Fallback name for initials */
  name?: string;
  /** Size of the avatar in px */
  size?: number;
  /** Font size for initials */
  fontSize?: number;
  /** Custom style for outer container */
  style?: StyleProp<ViewStyle>;
  /** Custom image style */
  imageStyle?: StyleProp<ImageStyle>;
  /** Background + text colors for fallback */
  backgroundColor?: string;
  textColor?: string;
}

/**
 * A React Native SmartAvatar that:
 * - shows an image when available,
 * - shows shimmer / spinner while loading,
 * - falls back to initials if image fails or missing.
 */
export const SmartAvatar: React.FC<SmartAvatarProps> = ({
  src,
  name,
  size = spacing(48),
  fontSize = fSize(18),
  style,
  imageStyle,
  backgroundColor = '#FFE8D6', // light orange
  textColor = '#DD6B20', // orange-600
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const borderRadius = size / 2;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius },
        style,
      ]}
    >
      {/* Loader shimmer */}
      {src && !loaded && !error && (
        <View style={[styles.loaderOverlay, { borderRadius }]}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}

      {/* Actual Image */}
      {src && !error && (
        <Animated.Image
          source={{ uri: src }}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius },
            styles.image,
            imageStyle,
          ]}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}

      {/* Fallback initials */}
      {(!src || error) && (
        <View
          style={[
            styles.fallback,
            { backgroundColor, borderRadius },
            StyleSheet.absoluteFillObject,
          ]}
        >
          <Text
            style={[styles.initials, { color: textColor, fontSize }]}
            numberOfLines={1}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = createStyleSheet({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
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
