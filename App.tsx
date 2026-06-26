// App.tsx
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { NavigationContainer } from '@react-navigation/native';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  QueryKey,
} from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { useEffect, useState } from 'react';
import {
  AppState,
  StyleSheet as RNStyleSheet,
  StatusBar,
  useColorScheme,
  View,
} from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { MenuProvider } from 'react-native-popup-menu';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UnistylesProvider } from 'react-native-unistyles';
import AuthSwitchingLoader from './src/components/AuthSwithcingLoader';
import {
  flushPendingDeepLink,
  handleColdStart,
  initNotifications,
  subscribeForegroundListeners,
  tearDownNotifications,
} from './src/notifications';
import { hapticOptions } from './src/helpers/utils';
import { FloatingChatProvider } from './src/contexts/FloatingChatContext';
import AuthProvider, { useAuth } from './src/hooks/useAuth';
import { SocketProvider } from './src/hooks/useSocket';
import AppNavigator from './src/navigators/AppNavigator';
import AuthNavigator from './src/navigators/AuthNavigator';
import './src/sheets';
import { theme } from './src/theme';
import './src/unistyles';
import { navigationRef } from './src/navigators/navigationService';

interface ErrorData {
  response: {
    data: {
      message: string;
    };
  };
}

function AppContent() {
  const { token } = useAuth();
  const [showLoader, setShowLoader] = useState(true);

  // Register / refresh the FCM token + permission whenever the user is signed
  // in. The hook is idempotent so re-running on token change is safe.
  useEffect(() => {
    if (!token) {
      tearDownNotifications();
      return;
    }
    initNotifications();
    return () => tearDownNotifications();
  }, [token]);

  // Foreground listeners (FCM onMessage, notifee press events,
  // onNotificationOpenedApp). All routing flows through DeepLinkHandler.
  useEffect(() => {
    return subscribeForegroundListeners();
  }, []);

  // Drain any pending deep-link intent whenever the app comes back to the
  // foreground. Only flush MMKV-parked intents here — never re-call
  // getInitialNotification, since on iOS it can keep returning the same
  // notification across background→foreground transitions, which would
  // double-route on top of onNotificationOpenedApp.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        flushPendingDeepLink();
      }
    });
    return () => subscription.remove();
  }, []);

  // Cold-start: drain any notification that launched the app.
  useEffect(() => {
    handleColdStart();

    GoogleSignin.configure({
      scopes: ['profile', 'email'],
      webClientId:
        '281907580585-0t8555ivr673q6rhj6b20qnfjrnfut1b.apps.googleusercontent.com',
      iosClientId:
        '281907580585-9akd8qfkn3unc37ta3k6q3fk84g129d1.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: false,
    });
  }, []);

  return (
    <View style={styles.container}>
      {token ? (
        <AppNavigator hideFloatingChat={showLoader} />
      ) : (
        <AuthNavigator />
      )}
      {showLoader && (
        <AuthSwitchingLoader
          onFinish={() => {
            setShowLoader(false);
          }}
        />
      )}
      <FlashMessage
        position="top"
        hideStatusBar={false}
        // statusBarHeight={StatusBar.currentHeight}
        icon={{ icon: 'auto', position: 'left', props: {} }}
      />
    </View>
  );
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 0,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: (data, _variables, _context, mutation) => {
      const _data = data as AxiosResponse;
      const message = _data.headers ? _data.headers['x-message'] : null;
      const showToast = mutation.meta?.showToast !== false;
      if (showToast && message) {
        ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
        showMessage({
          message: 'Success',
          description: message,
          type: 'success',
        });
      }
    },
    onError: res => {
      const result = res as unknown as ErrorData;
      ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
      if (result?.response?.data?.message) {
        showMessage({
          message: 'Failed',
          description: result?.response?.data?.message,
          type: 'danger',
        });
      } else {
        showMessage({
          message: 'Failed',
          description: 'An error occurred while processing your request.',
          type: 'danger',
        });
      }
    },
    onSettled: (_data, _error, _variables, _context, mutation) => {
      if (mutation?.meta?.invalidateQueries) {
        queryClient.invalidateQueries({
          queryKey: mutation?.meta?.invalidateQueries as QueryKey,
          refetchType: 'all',
        });
      }
    },
  }),
});

export default function App() {
  useColorScheme();

  // Pending-deep-link flushing + onNotificationOpenedApp wiring is now
  // centralized in `subscribeForegroundListeners` and `handleColdStart`
  // inside `AppContent`. Nothing notification-related to do at this layer.

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <UnistylesProvider>
          <SafeAreaProvider>
            <StatusBar backgroundColor="#fff" barStyle="default" />
            <QueryClientProvider client={queryClient}>
              <SheetProvider>
                <MenuProvider>
                  <AuthProvider>
                    <SocketProvider>
                      <FloatingChatProvider>
                        <NavigationContainer ref={navigationRef}>
                          <AppContent />
                        </NavigationContainer>
                      </FloatingChatProvider>
                    </SocketProvider>
                  </AuthProvider>
                </MenuProvider>
              </SheetProvider>
            </QueryClientProvider>
          </SafeAreaProvider>
        </UnistylesProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = RNStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
});
