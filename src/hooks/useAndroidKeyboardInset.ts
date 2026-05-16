import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Returns the extra bottom padding chat-style screens need on Android 15+ to
 * keep their input bar above the keyboard.
 *
 * Background: when an app targets SDK 35 (Android 15) or above, Android
 * forces edge-to-edge rendering for the whole app. Under enforced
 * edge-to-edge, `android:windowSoftInputMode="adjustResize"` stops resizing
 * the activity window when the IME opens — the system expects apps to react
 * to `WindowInsets.Type.ime()` themselves. React Native's
 * `KeyboardAvoidingView` with `behavior={undefined}` (the Android default)
 * does nothing on its own and therefore can't compensate.
 *
 * This hook subscribes to the JS `Keyboard` events (which fire correctly
 * regardless of the resize behavior) and returns the height of the keyboard
 * minus the bottom safe-area inset — because the outer navigator wrapper
 * already pads `insets.bottom`, we don't want to double-count it.
 *
 * Returns 0 on iOS, on Android < 15, and whenever the keyboard is closed —
 * so existing screens that simply read the value are unaffected on
 * unaffected devices.
 */
export const useAndroidKeyboardInset = (): number => {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);

  const isAndroid15Plus =
    Platform.OS === 'android' && Number(Platform.Version) >= 35;

  useEffect(() => {
    if (!isAndroid15Plus) return;
    const show = Keyboard.addListener('keyboardDidShow', e => {
      setHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [isAndroid15Plus]);

  if (!isAndroid15Plus || height === 0) return 0;

  // The outer navigation wrapper applies `paddingBottom: insets.bottom`
  // (gesture-nav bar height). Subtract it so we add only the *additional*
  // space the keyboard claims on top of that.
  return Math.max(0, height - insets.bottom);
};
