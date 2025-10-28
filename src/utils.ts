import { Dimensions, PixelRatio, Platform } from 'react-native';

/**
 * Get device screen dimensions
 */
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

/**
 * Base dimensions to scale from (based on a standard device width)
 * Common base width: 375 for iPhone 11 / X
 */
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Scale based on screen width
 * - For horizontal sizes like fontSize, paddingHorizontal, marginHorizontal
 */
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

/**
 * Vertical scale based on screen height
 * - For vertical sizes like paddingVertical, marginVertical
 */
export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

/**
 * Moderate scale (for fine control)
 * - Mix of scale and static sizing, gives a smoother scaling effect
 * - Useful for font sizes and small UI elements
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

/**
 * Normalize font size / pixel value across devices
 * - Uses PixelRatio to adjust based on device density
 */
export const normalize = (size: number): number => {
  const newSize = scale(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Platform helpers
 */
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * Expose commonly used device values
 */
export const Device = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isIOS,
  isAndroid,
  pixelRatio: PixelRatio.get(),
  fontScale: PixelRatio.getFontScale(),
};

/**
 * Example helper: get scaled font size
 */
export const fontSize = (size: number): number => {
  return normalize(size);
};

/**
 * Example helper: get scaled spacing (margin/padding)
 */
export const spacing = (size: number): number => {
  return moderateScale(size, 0.6);
};
