import React, { useEffect, useState } from 'react';
import { Keyboard, LayoutAnimation, Platform, View } from 'react-native';

export const ToolbarWithKeyboardPadding: React.FC<
  React.PropsWithChildren<{ insetsBottom?: number }>
> = ({ children, insetsBottom = 0 }) => {
  const [kb, setKb] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKb(e.endCoordinates?.height ?? 0);
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKb(0);
      },
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Base height of your toolbar (match styles.toolbarContainer height/padding)
  const basePadding = insetsBottom;
  const bottom = kb > 0 ? kb - insetsBottom : basePadding;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        // Your existing toolbar styles:
        // backgroundColor, borders, etc.
        // Then add paddingBottom dynamically:
        paddingBottom: bottom,
      }}
    >
      {children}
    </View>
  );
};
