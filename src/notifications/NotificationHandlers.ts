import notifee, { EventType, Event } from '@notifee/react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import {
  ACTION_MARK_READ,
  ACTION_OPEN_APP,
  ACTION_OPEN_CHAT,
  IS_IOS,
} from './constants';
import { routeToChat } from './DeepLinkHandler';
import {
  clearChatNotifications,
  displayChatNotification,
  parseChatPushData,
} from './NotificationDisplay';
import { markSeenOnce } from './NotificationCache';
import type { ChatPushData } from './types';

type MarkReadHandler = (args: { chatId: string }) => Promise<void> | void;

let markReadHandler: MarkReadHandler | undefined;

export const setMarkReadHandler = (fn: MarkReadHandler) => {
  markReadHandler = fn;
};

/* -------------------------------------------------------------------------- */
/* FCM message handling                                                       */
/* -------------------------------------------------------------------------- */

const handleRemoteMessage = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  isBackgroundHandler: boolean,
) => {
  const data = parseChatPushData(remoteMessage);

  // Dedup across foreground + background + cold-start delivery paths.
  if (!markSeenOnce(remoteMessage, data)) return;

  // On iOS in the background, the APNS alert + the NSE have already shown
  // the notification (with avatar attached). Re-rendering here would
  // duplicate it. We still consume the message above for dedup-cache
  // priming and history tracking would belong here in the future.
  if (IS_IOS && isBackgroundHandler) return;

  // Only render when we have enough to draw a chat notification.
  if (!data.chatId && !remoteMessage.notification) return;

  await displayChatNotification({
    remoteMessage,
    data,
    isBackgroundHandler,
  });
};

/**
 * Register the foreground FCM listener. Returns an unsubscribe function.
 * Call once when the app mounts (e.g. in App.tsx).
 */
export const registerForegroundMessageHandler = () => {
  return messaging().onMessage(async remoteMessage => {
    await handleRemoteMessage(remoteMessage, false);
  });
};

/**
 * Wire up the FCM background handler. Must be called at module scope from
 * `index.js` (i.e. before AppRegistry.registerComponent) so it survives the
 * Headless JS task on Android and the iOS background fetch.
 */
export const registerBackgroundMessageHandler = () => {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    await handleRemoteMessage(remoteMessage, true);
  });
};

/* -------------------------------------------------------------------------- */
/* Notifee press / action events                                              */
/* -------------------------------------------------------------------------- */

const extractChatData = (event: Event): ChatPushData | undefined => {
  const data = event.detail.notification?.data as
    | Record<string, string>
    | undefined;
  if (!data?.chatId) return undefined;
  return data as unknown as ChatPushData;
};

const handleNotifeeEvent = async (event: Event) => {
  const { type, detail } = event;
  const data = extractChatData(event);

  if (!data) {
    // Non-chat notification (e.g. summary). Open the chats tab.
    if (
      type === EventType.PRESS &&
      detail.pressAction?.id === ACTION_OPEN_APP
    ) {
      routeToChat({ chatId: '' });
    }
    return;
  }

  const chatId = data.chatId!;

  switch (type) {
    case EventType.PRESS: {
      if (
        detail.pressAction?.id === ACTION_OPEN_CHAT ||
        detail.pressAction?.id === ACTION_OPEN_APP ||
        !detail.pressAction?.id
      ) {
        routeToChat({
          chatId,
          messageId: data.messageId,
          deepLink: data.deepLink,
        });
        await clearChatNotifications(chatId);
      }
      break;
    }

    case EventType.ACTION_PRESS: {
      const actionId = detail.pressAction?.id;
      if (actionId === ACTION_MARK_READ) {
        try {
          await markReadHandler?.({ chatId });
        } catch (err) {
          console.warn('[notifications] mark-read failed', err);
        }
        await clearChatNotifications(chatId);
      }
      break;
    }

    case EventType.DISMISSED: {
      // Keep chat-history so subsequent messages can stack. We only clear
      // when the user actively opens the chat or marks it read.
      break;
    }

    default:
      break;
  }
};

/**
 * Foreground notifee event listener. Returns the unsubscribe function.
 */
export const registerForegroundNotifeeEvents = () => {
  return notifee.onForegroundEvent(handleNotifeeEvent);
};

/**
 * Background notifee event registration. Must be called at module scope from
 * `index.js`. Captures inline-reply input and mark-as-read presses even when
 * the JS context starts cold from the action tap.
 */
export const registerBackgroundNotifeeEvents = () => {
  notifee.onBackgroundEvent(handleNotifeeEvent);
};

/* -------------------------------------------------------------------------- */
/* Cold-start handling                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Returns the initial deep-link intent if the app was launched from a
 * notification press while it was killed. Drains both the FCM and Notifee
 * sources so we never miss a launch.
 */
export const consumeInitialNotificationIntent = async (): Promise<
  { chatId: string } | undefined
> => {
  // Notifee fires when the user pressed a *displayed* notification (locally
  // composed by us). This is the common case on Android.
  const notifeeInitial = await notifee.getInitialNotification().catch(() => null);
  const notifeeChatId = notifeeInitial?.notification?.data?.chatId as
    | string
    | undefined;

  if (notifeeChatId) {
    if (notifeeInitial?.notification?.id) {
      try {
        await notifee.cancelNotification(notifeeInitial.notification.id);
      } catch {}
    }
    return { chatId: notifeeChatId };
  }

  // FCM fires when the OS rendered the notification directly (e.g. iOS
  // delivered the message via apns while the app was killed and the user
  // tapped it before our local notification was composed).
  const fcmInitial = await messaging().getInitialNotification().catch(() => null);
  const fcmChatId = fcmInitial?.data?.chatId as string | undefined;
  if (fcmChatId) {
    return { chatId: fcmChatId };
  }

  return undefined;
};

/**
 * Registers the `onNotificationOpenedApp` listener — fires when the user taps
 * an FCM-rendered notification while the app is in the background.
 */
export const registerNotificationOpenedApp = () => {
  return messaging().onNotificationOpenedApp(remoteMessage => {
    const chatId = remoteMessage?.data?.chatId as string | undefined;
    if (!chatId) return;
    routeToChat({
      chatId,
      messageId: remoteMessage?.data?.messageId as string | undefined,
      deepLink: remoteMessage?.data?.deepLink as string | undefined,
    });
  });
};
