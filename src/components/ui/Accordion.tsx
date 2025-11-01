import React, { ReactNode, useEffect } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { createStyleSheet } from 'react-native-unistyles';

export default function AccordionItem({
  isExpanded,
  children,
  viewKey,
  style,
  duration = 500,
}: {
  isExpanded: boolean;
  children: ReactNode;
  viewKey?: string | number;
  style?: StyleProp<ViewStyle>;
  duration?: number;
}) {
  const contentHeight = useSharedValue(0);
  const expanded = useSharedValue(0);

  // sync state -> shared value
  useEffect(() => {
    expanded.value = withTiming(isExpanded ? 1 : 0, { duration });
  }, [isExpanded, duration, expanded]);

  // derive height based on expansion progress
  const animatedHeight = useDerivedValue(
    () => contentHeight.value * expanded.value,
  );

  const bodyStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
  }));

  return (
    <Animated.View
      key={`accordionItem_${viewKey}`}
      style={[styles.animatedView, bodyStyle, style]}
    >
      <View
        onLayout={e => {
          contentHeight.value = e.nativeEvent.layout.height;
        }}
        style={styles.wrapper}
      >
        {children}
      </View>
    </Animated.View>
  );
}

const styles = createStyleSheet({
  animatedView: {
    width: '100%',
    overflow: 'hidden',
  },
  wrapper: {
    width: '100%',
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
  },
});
