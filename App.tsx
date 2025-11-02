// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { useState } from 'react';
import {
  StyleSheet as RNStyleSheet,
  StatusBar,
  useColorScheme,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { UnistylesProvider } from 'react-native-unistyles';
import AppNavigator from './src/navigators/AppNavigator';
import AuthNavigator from './src/navigators/AuthNavigator';
import { theme } from './src/theme';
import './src/unistyles';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Host } from 'react-native-portalize';
import { isAndroid } from './src/utils';

function AppContent({ isAuthenticated }: { isAuthenticated: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </View>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const isDarkMode = isAndroid
    ? colorScheme === 'light'
    : colorScheme === 'dark';
  const [isAuthenticated] = useState(true);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UnistylesProvider>
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <Host>
            <NavigationContainer>
              <AppContent isAuthenticated={isAuthenticated} />
            </NavigationContainer>
          </Host>
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
