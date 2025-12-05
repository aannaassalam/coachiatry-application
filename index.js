/**
 * @format
 */
import 'react-native-reanimated';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import 'react-native-get-random-values'; // adds crypto.getRandomValues
import 'react-native-quick-base64';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
} from '@notifee/react-native';
import { getLocalProfileImage, storage } from './src/helpers/utils';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('BG FCM Message:', remoteMessage);

  await notifee.displayNotification({
    title: remoteMessage.data?.senderName,
    body: remoteMessage.data?.body,
    data: remoteMessage.data,
    android: {
      channelId: 'chat-messages',
      pressAction: {
        id: 'open-chat', // required to detect the click
        launchActivity: 'default', // bring app to foreground
      },
      style: {
        type: AndroidStyle.MESSAGING,
        person: {
          name: remoteMessage.data.senderName,
          icon: remoteMessage.data.senderImage,
        },
        messages: [
          {
            text: remoteMessage.data?.body || '',
            timestamp: Date.now(), // Now
            person: {
              name: remoteMessage.data.senderName,
              icon: remoteMessage.data.senderImage,
            },
          },
        ],
      },
    },
  });
});

// 2️⃣ Notifee Background Handler → Handle Reply Action
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  // Check if user pressed notification
  if (type === EventType.PRESS && pressAction?.id === 'open-chat') {
    // SAVE THE DATA SO APP.TSX CAN READ IT WHEN IT OPENS
    if (notification?.data) {
      storage.set('pendingChatNavigation', JSON.stringify(notification.data));
    }

    // Remove the notification from status bar
    await notifee.cancelNotification(notification.id);
  }
});

AppRegistry.registerComponent(appName, () => App);
