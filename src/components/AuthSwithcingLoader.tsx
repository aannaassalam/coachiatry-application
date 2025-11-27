import { useEffect, useRef, useState } from 'react';
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
import { fontSize, spacing, verticalScale } from '../utils';

function AuthSwitchingLoader({ onFinish }: { onFinish: () => void }) {
  const { isProfileLoading } = useAuth();
  const [state, setState] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const allOpacity = useRef(new Animated.Value(1)).current;
  const logo_position = useRef(new Animated.Value(spacing(100))).current;
  const logo_text_position = useRef(new Animated.Value(spacing(-150))).current;
  const overlay = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      Animated.parallel([
        Animated.timing(logo_position, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logo_text_position, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(overlay, {
          toValue: spacing(-350),
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim2, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setState('ANIMATION_COMPLETE');
      });
    });
  }, [fadeAnim, fadeAnim2, logo_position, logo_text_position, overlay]);

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
          <Text style={styles.logo_text}>Coachiatry</Text>
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
  logo_container: {
    aspectRatio: 1,
    flex: 0.22,
    position: 'relative',
    zIndex: 1,
  },

  logo_container_text: {
    flex: 0.58,
    aspectRatio: 16 / 5,
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
