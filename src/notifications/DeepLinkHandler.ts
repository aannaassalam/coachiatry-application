import { storage } from '../helpers/utils';
import { navigationRef } from '../navigators/navigationService';
import { PENDING_NAV_KEY } from './constants';
import type { PendingDeepLink } from './types';

/**
 * Deep-link handler — single source of truth for "user tapped a notification,
 * where should they land in the app?".
 *
 * The challenge: notifications can be tapped in three app states (foreground,
 * background, terminated) and from three event sources (notifee press events,
 * FCM onNotificationOpenedApp, FCM getInitialNotification). All paths funnel
 * through `routeToChat` here.
 *
 * When the navigator isn't ready yet (cold start, splash screen), the intent
 * is parked in MMKV under `PENDING_NAV_KEY` and replayed by
 * `flushPendingDeepLink` once navigation mounts.
 */

const NAV_DELAY_MS = 180;

// Multiple notification frameworks can fire for the same tap (FCM
// onNotificationOpenedApp + getInitialNotification + Notifee press), so we
// drop a duplicate route to the same target within this window.
const ROUTE_DEDUP_MS = 1500;
let lastRoutedKey: string | undefined;
let lastRoutedAt = 0;

const persistPending = (pending: PendingDeepLink) => {
  storage.set(PENDING_NAV_KEY, JSON.stringify(pending));
};

export const readPendingDeepLink = (): PendingDeepLink | undefined => {
  const raw = storage.getString(PENDING_NAV_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as PendingDeepLink;
  } catch {
    return undefined;
  }
};

const clearPending = () => {
  storage.remove(PENDING_NAV_KEY);
};

/**
 * Navigate into the chat room for `chatId`. Safe to call before navigation is
 * ready — the intent is parked and replayed via `flushPendingDeepLink`.
 */
export const routeToChat = (pending: PendingDeepLink) => {
  if (!pending.chatId) return;

  const key = `${pending.chatId}|${pending.messageId ?? ''}`;
  const now = Date.now();
  if (lastRoutedKey === key && now - lastRoutedAt < ROUTE_DEDUP_MS) return;
  lastRoutedKey = key;
  lastRoutedAt = now;

  if (!navigationRef.isReady()) {
    persistPending(pending);
    return;
  }

  try {
    navigationRef.navigate('BottomTabs', { screen: 'Chats' });
    setTimeout(() => {
      navigationRef.navigate('ChatRoom', {
        roomId: pending.chatId,
      });
    }, NAV_DELAY_MS);
  } catch {
    persistPending(pending);
  }
};

/**
 * Drain any deep link parked while navigation was still mounting. Call:
 *   - once on app start, after navigation mounts
 *   - on every AppState `active` transition
 */
export const flushPendingDeepLink = () => {
  const pending = readPendingDeepLink();
  if (!pending) return;
  clearPending();
  routeToChat(pending);
};
