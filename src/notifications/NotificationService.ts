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

// Always POST the token to the backend. The backend stores it with $addToSet,
// so this is idempotent and cheap. Crucially it re-asserts the token even when
// the client believes it is unchanged — the backend can drop a token (its
// invalid-token pruning), and if we only ever registered on *change* the device
// would then be permanently missing from the backend's token list and receive
// no notifications at all. This is the main cause of push silently dying on a
// long-lived install.
const registerToken = async (token: string) => {
  try {
    await updateFCMToken(token);
    storage.set(LAST_REGISTERED_TOKEN_KEY, token);
    console.log('[notifications] FCM token registered with backend');
  } catch (err) {
    console.warn('[notifications] updateFCMToken failed', err);
  }
};

// Used by the token-refresh listener, which can fire frequently — only POST
// when the value actually changed.
const registerTokenIfChanged = async (token: string) => {
  const previous = storage.getString(LAST_REGISTERED_TOKEN_KEY);
  if (previous === token) return;
  await registerToken(token);
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
  if (!granted) {
    // The OS will suppress the *display* of notifications until the user
    // enables them in system settings (Android 13+ POST_NOTIFICATIONS). We
    // still fetch and register the token below — delivery to the JS handlers
    // does not require the permission, and this way push resumes the moment
    // the user grants it, with no re-login needed.
    console.warn(
      '[notifications] notification permission not granted — banners will be ' +
        'suppressed by the OS until enabled in Settings.',
    );
  }

  let token: string | null = null;
  try {
    token = await messaging().getToken();
    console.log(
      '[notifications] FCM token:',
      token ? `${token.slice(0, 12)}…(len ${token.length})` : 'null',
    );
    // Re-assert on every init (login / cold start), not only on change, so a
    // backend that pruned this token gets it back.
    if (token) await registerToken(token);
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
