import messaging from '@react-native-firebase/messaging';
import { updateFCMToken } from '../api/functions/auth.api';
import { storage } from '../helpers/utils';
import { trimAvatarCache } from './AvatarCache';
import { flushPendingDeepLink, routeToChat } from './DeepLinkHandler';
import {
  consumeInitialNotificationIntent,
  registerForegroundMessageHandler,
  registerForegroundNotifeeEvents,
  registerNotificationOpenedApp,
} from './NotificationHandlers';
import {
  requestPermission,
  setupNotificationChannels,
  syncBadge,
} from './NotificationDisplay';

let tokenRefreshUnsub: (() => void) | undefined;

// MMKV key — stores the FCM token we most recently registered with the
// backend so subsequent cold starts can short-circuit redundant POSTs.
const LAST_REGISTERED_TOKEN_KEY = 'notif.last-registered-fcm-token';

const registerTokenIfChanged = async (token: string) => {
  const previous = storage.getString(LAST_REGISTERED_TOKEN_KEY);
  if (previous === token) return;
  try {
    await updateFCMToken(token);
    storage.set(LAST_REGISTERED_TOKEN_KEY, token);
  } catch (err) {
    console.warn('[notifications] updateFCMToken failed', err);
  }
};

/**
 * Top-level entry point. Idempotent — safe to call multiple times.
 *
 * Returns the FCM device token (or null if permission was denied).
 *
 * Typical lifecycle:
 *   1. App mounts (token present)  -> initNotifications()
 *   2. User opens a chat            -> clearChatNotifications(chatId)
 *   3. User logs out                -> tearDownNotifications()
 */
export const initNotifications = async (): Promise<string | null> => {
  await setupNotificationChannels();
  const granted = await requestPermission();
  if (!granted) return null;

  let token: string | null = null;
  try {
    token = await messaging().getToken();
    if (token) await registerTokenIfChanged(token);
  } catch (err) {
    console.warn('[notifications] getToken failed', err);
  }

  tokenRefreshUnsub?.();
  tokenRefreshUnsub = messaging().onTokenRefresh(async newToken => {
    if (newToken) await registerTokenIfChanged(newToken);
  });

  await syncBadge();
  await trimAvatarCache().catch(() => undefined);

  return token;
};

/**
 * Drain a notification that launched the app from a killed state. Call once
 * after the navigation container mounts.
 */
export const handleColdStart = async () => {
  const intent = await consumeInitialNotificationIntent();
  if (intent?.chatId) {
    routeToChat({ chatId: intent.chatId });
  }
  flushPendingDeepLink();
};

/**
 * Subscribe to the foreground listeners. Returns a teardown function that
 * removes both. Wire from a `useEffect` in App.tsx.
 */
export const subscribeForegroundListeners = () => {
  const unsubMessage = registerForegroundMessageHandler();
  const unsubEvents = registerForegroundNotifeeEvents();
  const unsubOpened = registerNotificationOpenedApp();
  return () => {
    unsubMessage();
    unsubEvents();
    unsubOpened();
  };
};

/**
 * Tear down everything the service holds — token refresh subscription, etc.
 * Call on logout. Notifications already on the shade are NOT cancelled here
 * (use `clearAllChatNotifications` for that).
 */
export const tearDownNotifications = () => {
  tokenRefreshUnsub?.();
  tokenRefreshUnsub = undefined;
  storage.remove(LAST_REGISTERED_TOKEN_KEY);
};
