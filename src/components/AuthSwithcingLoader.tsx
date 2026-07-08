import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
} from 'react-native';
import { assets } from '../assets';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';
import { fontSize, scale, spacing, verticalScale } from '../utils';

const SCREEN_WIDTH = Dimensions.get('window').width;

function AuthSwitchingLoader({ onFinish }: { onFinish: () => void }) {
  const { isProfileLoading } = useAuth();
  const [state, setState] = useState('');
  const [textWidth, setTextWidth] = useState(0);
  const phase2Ref = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const allOpacity = useRef(new Animated.Value(1)).current;
  // Set to the intro offset once the text is measured (see runIntro).
  const logo_position = useRef(new Animated.Value(0)).current;
  const logo_text_position = useRef(new Animated.Value(spacing(-150))).current;
  const overlay = useRef(new Animated.Value(1)).current;

  // Phase 2: logo slides into the lockup while the text reveals.
  const startPhase2 = useCallback(() => {
    if (phase2Ref.current) return;
    phase2Ref.current = true;
    Animated.parallel([
      Animated.timing(logo_position, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(logo_text_position, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(overlay, {
        // Slide the reveal mask fully past the screen edge so the text is
        // always fully uncovered regardless of device width.
        toValue: -SCREEN_WIDTH,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim2, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start(() => setState('ANIMATION_COMPLETE'));
  }, [fadeAnim2, logo_position, logo_text_position, overlay]);

  // Phase 1 — runs IMMEDIATELY on mount (not gated on measurement) so the logo
  // appears the instant the JS splash paints. Waiting first left a gap after the
  // OS system splash where the screen showed the primary background with no
  // logo, which read as the logo "blinking". A quick fade (not the old 1s one)
  // also shrinks any residual gap. The logo starts at an estimated centred
  // offset; the exact value is applied from the measured text width below,
  // during this short fade, so the correction is imperceptible.
  useEffect(() => {
    logo_position.setValue(spacing(100));
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start(() => startPhase2());
  }, [fadeAnim, logo_position, startPhase2]);

  // Refine the logo's centred position from the measured text width (only while
  // still in the fade phase, before it starts sliding into the lockup).
  useEffect(() => {
    if (textWidth > 0 && !phase2Ref.current) {
      logo_position.setValue((spacing(8) + textWidth) / 2);
    }
  }, [textWidth, logo_position]);

  useEffect(() => {
    const isReadyToFade = state === 'ANIMATION_COMPLETE' && !isProfileLoading;

    if (isReadyToFade) {
      Animated.parallel([
        Animated.timing(allOpacity, {
          toValue: 0,
          duration: 700, // Fade out duration
          delay: 200, // Minimum time the logo will stay visible
          useNativeDriver: true,
        }),
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 1000, // Fade out duration
          delay: 500, // Minimum time the logo will stay visible
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onFinish();
      });
    }
  }, [allOpacity, containerOpacity, isProfileLoading, onFinish, state]);
  // if (state === 'hidden') return null;

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar barStyle="light-content" />

      <Animated.View
        collapsable={false}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          justifyContent: 'center',
          paddingHorizontal: spacing(20),
          opacity: allOpacity,
        }}
      >
        <Animated.View
          style={{
            ...styles.overlay,
            transform: [{ translateX: overlay }],
            opacity: allOpacity,
          }}
        ></Animated.View>
        <Animated.View
          style={{
            ...styles.logo_container,
            opacity: fadeAnim,
            transform: [{ translateX: logo_position }],
          }}
        >
          <Animated.View style={{ opacity: allOpacity }}>
            <Image source={assets.images.splashLogo} style={styles.logo} />
          </Animated.View>
        </Animated.View>
        <Animated.View
          style={{
            ...styles.logo_container_text,
            opacity: fadeAnim2,
            transform: [{ translateX: logo_text_position }],
          }}
        >
          <Text
            style={styles.logo_text}
            onLayout={e => setTextWidth(e.nativeEvent.layout.width)}
          >
            Coachiatry
          </Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    height: verticalScale(250),
    backgroundColor: theme.colors.primary,
    zIndex: 0,
    width: Dimensions.get('window').width,
  },
  // Fixed, scaled sizes (not flex proportions) so the logo + text form a
  // compact unit the row can truly center — the old flex-grow sizing stretched
  // them edge-to-edge, which is why the mark drifted off-centre on different
  // screen sizes.
  logo_container: {
    width: scale(72),
    height: scale(72),
    position: 'relative',
    zIndex: 1,
  },

  logo_container_text: {
    marginLeft: spacing(8),
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: -1,
  },
  logo: {
    height: '100%',
    width: '100%',
    resizeMode: 'contain',
  },
  logo_text: {
    fontFamily: theme.fonts.archivo.bold,
    fontSize: Platform.OS === 'ios' ? fontSize(40) : fontSize(30),
    color: theme.colors.white,
  },
});
export default AuthSwitchingLoader;
