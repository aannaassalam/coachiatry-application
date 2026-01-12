// App.tsx
import notifee, { AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
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
  Platform,
  StyleSheet as RNStyleSheet,
  StatusBar,
  useColorScheme,
  View,
} from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { MenuProvider } from 'react-native-popup-menu';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UnistylesProvider } from 'react-native-unistyles';
import { updateFCMToken } from './src/api/functions/auth.api';
import AuthSwitchingLoader from './src/components/AuthSwithcingLoader';
import { hapticOptions, storage } from './src/helpers/utils';
import AuthProvider, { useAuth } from './src/hooks/useAuth';
import { SocketProvider } from './src/hooks/useSocket';
import AppNavigator from './src/navigators/AppNavigator';
import AuthNavigator from './src/navigators/AuthNavigator';
import './src/sheets';
import { theme } from './src/theme';
import './src/unistyles';
import { navigate, navigationRef } from './src/navigators/navigationService';

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

  useEffect(() => {
    // This triggers whenever a new token is generated
    const unsubscribe = messaging().onTokenRefresh(async token => {
      console.log('NEW FCM TOKEN:', token);

      // If user is logged in, send to backend
      if (token) {
        await updateFCMToken(token);
      }
    });

    return unsubscribe;
  }, [token]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // The app has come to the foreground!
        checkPendingNavigation();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkPendingNavigation = () => {
    const saved = storage.getString('pendingChatNavigation');

    if (saved) {
      const data = JSON.parse(saved);
      storage.remove('pendingChatNavigation'); // Clear it immediately so we don't navigate twice

      // Small timeout to ensure navigation container is ready/rendered
      setTimeout(() => {
        navigate('ChatRoom', {
          roomId: data.chatId,
        });
      }, 500);
    }
  };

  useEffect(() => {
    const init = async () => {
      notifee.createChannel({
        id: 'chat-messages',
        name: 'Chat Messages',
        importance: AndroidImportance.HIGH,
      });

      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification) {
        const { pressAction, notification } = initialNotification;
        if (
          pressAction?.id === 'open-chat' &&
          notification?.data &&
          notification.id
        ) {
          // Add a small delay to ensure navigation container is ready
          setTimeout(() => {
            navigate('ChatRoom', {
              roomId: notification?.data?.chatId as string,
            });
          }, 500);
          await notifee.cancelNotification(notification?.id);
        }
      }

      GoogleSignin.configure({
        scopes: ['profile', 'email'], // what info you want
        webClientId:
          '149359341698-tt7bv0k4adpq368vgkv6cug0ruupm9qp.apps.googleusercontent.com', // from Google Cloud Console (Web client)
        iosClientId:
          '149359341698-e52por6ce4cdktcfsjm8026e7fpuuldm.apps.googleusercontent.com',
        offlineAccess: true,
        forceCodeForRefreshToken: false,
      });
    };
    init();
  }, []);

  return (
    <View style={styles.container}>
      {token ? <AppNavigator /> : <AuthNavigator />}
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
        statusBarHeight={
          Platform.OS === 'android' ? StatusBar.currentHeight : 0
        }
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
  const { token } = useAuth();
  useColorScheme();

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (navigationRef.isReady()) {
        const saved = storage.getString('pendingChatNavigation');
        if (saved) {
          const data = JSON.parse(saved);
          storage.remove('pendingChatNavigation');

          navigationRef.navigate('ChatRoom', {
            roomId: data.chatId,
          });
        }
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [token]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UnistylesProvider>
        <SafeAreaProvider>
          <StatusBar backgroundColor="#fff" barStyle="dark-content" />
          <QueryClientProvider client={queryClient}>
            <SheetProvider>
              <MenuProvider>
                <AuthProvider>
                  <SocketProvider>
                    <NavigationContainer ref={navigationRef}>
                      <AppContent />
                    </NavigationContainer>
                  </SocketProvider>
                </AuthProvider>
              </MenuProvider>
            </SheetProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </UnistylesProvider>
    </GestureHandlerRootView>
  );
}

const styles = RNStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
});
