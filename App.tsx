// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  QueryKey,
} from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { useState } from 'react';
import {
  StyleSheet as RNStyleSheet,
  StatusBar,
  useColorScheme,
  View,
} from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UnistylesProvider } from 'react-native-unistyles';
import AuthSwitchingLoader from './src/components/AuthSwithcingLoader';
import AuthProvider, { useAuth } from './src/hooks/useAuth';
import AppNavigator from './src/navigators/AppNavigator';
import AuthNavigator from './src/navigators/AuthNavigator';
import { MenuProvider } from 'react-native-popup-menu';
import './src/sheets';
import { theme } from './src/theme';
import './src/unistyles';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { hapticOptions } from './src/helpers/utils';

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UnistylesProvider>
        <SafeAreaProvider>
          <StatusBar backgroundColor="#fff" barStyle="dark-content" />
          <QueryClientProvider client={queryClient}>
            <SheetProvider>
              <MenuProvider>
                <AuthProvider>
                  <NavigationContainer>
                    <AppContent />
                  </NavigationContainer>
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
