// App.tsx
import React, { useState } from 'react';
import {
  StatusBar,
  useColorScheme,
  View,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import './src/unistyles';
import AuthNavigator from './src/navigators/AuthNavigator';
import AppNavigator from './src/navigators/AppNavigator';
import { UnistylesProvider } from 'react-native-unistyles';
import { isAndroid } from './src/utils';
import { theme } from './src/theme';

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
  // const colorScheme = useColorScheme();
  // const isDarkMode = isAndroid
  //   ? colorScheme === 'light'
  //   : colorScheme === 'dark';
  const [isAuthenticated] = useState(true);

  return (
    <UnistylesProvider>
      <SafeAreaProvider>
        <StatusBar barStyle="default" />
        <NavigationContainer>
          <AppContent isAuthenticated={isAuthenticated} />
        </NavigationContainer>
      </SafeAreaProvider>
    </UnistylesProvider>
  );
}

const styles = RNStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
});
