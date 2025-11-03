// App.tsx
import './src/sheets';
import { NavigationContainer } from '@react-navigation/native';
import { useState } from 'react';
import {
  StyleSheet as RNStyleSheet,
  StatusBar,
  useColorScheme,
  View,
} from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
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
  useColorScheme();
  const [isAuthenticated] = useState(true);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UnistylesProvider>
        <SafeAreaProvider>
          <StatusBar backgroundColor="#fff" barStyle="dark-content" />
          <SheetProvider>
            <NavigationContainer>
              <AppContent isAuthenticated={isAuthenticated} />
            </NavigationContainer>
          </SheetProvider>
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
