/**
 * @format
 */
import 'react-native-reanimated';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import 'react-native-get-random-values'; // adds crypto.getRandomValues
import 'react-native-quick-base64';
import {
  registerBackgroundMessageHandler,
  registerBackgroundNotifeeEvents,
} from './src/notifications';

// Background handlers MUST be registered at module scope (outside the React
// tree) so they survive Headless JS task spawns on Android and the iOS
// background-fetch lifecycle.
registerBackgroundMessageHandler();
registerBackgroundNotifeeEvents();

AppRegistry.registerComponent(appName, () => App);
