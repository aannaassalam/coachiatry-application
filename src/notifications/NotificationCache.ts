import { storage } from '../helpers/utils';
import {
  ACTIVE_CHATS_KEY,
  DEDUP_KEY,
  DEDUP_WINDOW_MS,
  HISTORY_KEY_PREFIX,
  HISTORY_LIMIT,
  UNREAD_KEY_PREFIX,
} from './constants';
import type { ChatPushData, StoredChatMessage } from './types';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

interface DedupEntry {
  id: string;
  ts: number;
}

/* -------------------------------------------------------------------------- */
/* Dedup                                                                       */
/* -------------------------------------------------------------------------- */

const readDedup = (): DedupEntry[] => {
  const raw = storage.getString(DEDUP_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DedupEntry[];
  } catch {
    return [];
  }
};

const writeDedup = (entries: DedupEntry[]) => {
  storage.set(DEDUP_KEY, JSON.stringify(entries.slice(-128)));
};

const dedupIdFor = (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  data: ChatPushData,
) => {
  if (data.messageId) return data.messageId;
  if (remoteMessage.messageId) return remoteMessage.messageId;
  return [
    data.chatId || 'no-chat',
    data.senderId || data.senderName || 'unknown',
    data.body || remoteMessage.notification?.body || '',
    String(remoteMessage.sentTime || Date.now()),
  ].join('::');
};

/**
 * Returns true the first time we see a given remote message and false on
 * subsequent observations within `DEDUP_WINDOW_MS`. Works across foreground
 * and background handlers (MMKV is process-shared).
 */
export const markSeenOnce = (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  data: ChatPushData,
): boolean => {
  const id = dedupIdFor(remoteMessage, data);
  const now = Date.now();
  const recent = readDedup().filter(e => now - e.ts < DEDUP_WINDOW_MS);
  if (recent.some(e => e.id === id)) {
    writeDedup(recent);
    return false;
  }
  recent.push({ id, ts: now });
  writeDedup(recent);
  return true;
};

/* -------------------------------------------------------------------------- */
/* Per-chat message history (powers Android MESSAGING style)                  */
/* -------------------------------------------------------------------------- */

const historyKey = (chatId: string) => `${HISTORY_KEY_PREFIX}${chatId}`;

export const readChatHistory = (chatId: string): StoredChatMessage[] => {
  const raw = storage.getString(historyKey(chatId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredChatMessage[];
  } catch {
    return [];
  }
};

export const appendChatHistory = (
  chatId: string,
  message: StoredChatMessage,
): StoredChatMessage[] => {
  const next = readChatHistory(chatId);
  next.push(message);
  const trimmed = next.slice(-HISTORY_LIMIT);
  storage.set(historyKey(chatId), JSON.stringify(trimmed));
  return trimmed;
};

export const clearChatHistory = (chatId: string) => {
  storage.remove(historyKey(chatId));
};

/* -------------------------------------------------------------------------- */
/* Active-chat tracking (drives the summary notification)                     */
/* -------------------------------------------------------------------------- */

export const readActiveChats = (): string[] => {
  const raw = storage.getString(ACTIVE_CHATS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
};

const writeActiveChats = (chats: string[]) => {
  storage.set(ACTIVE_CHATS_KEY, JSON.stringify(chats));
};

export const trackActiveChat = (chatId: string) => {
  const chats = readActiveChats();
  if (!chats.includes(chatId)) {
    chats.push(chatId);
    writeActiveChats(chats);
  }
};

export const untrackActiveChat = (chatId: string): string[] => {
  const remaining = readActiveChats().filter(id => id !== chatId);
  writeActiveChats(remaining);
  return remaining;
};

/* -------------------------------------------------------------------------- */
/* Per-chat unread counter                                                    */
/* -------------------------------------------------------------------------- */

const unreadKey = (chatId: string) => `${UNREAD_KEY_PREFIX}${chatId}`;

export const incrementUnread = (chatId: string): number => {
  const next = (storage.getNumber(unreadKey(chatId)) || 0) + 1;
  storage.set(unreadKey(chatId), next);
  return next;
};

export const setUnread = (chatId: string, value: number) => {
  storage.set(unreadKey(chatId), Math.max(0, value));
};

export const readUnread = (chatId: string): number =>
  storage.getNumber(unreadKey(chatId)) || 0;

export const clearUnread = (chatId: string) => {
  storage.remove(unreadKey(chatId));
};

export const totalUnread = (): number => {
  let total = 0;
  for (const key of storage.getAllKeys()) {
    if (key.startsWith(UNREAD_KEY_PREFIX)) {
      total += storage.getNumber(key) || 0;
    }
  }
  return total;
};

/**
 * Reconcile the per-chat MMKV unread counters with the server-authoritative
 * conversation list. The OS badge (see totalUnread) is push-driven and drifts
 * from the in-app React Query `unreadCount`; calling this whenever the
 * conversations list is fetched corrects the loaded chats to the server's
 * truth. Chats not in the list are left untouched (they may live beyond the
 * loaded page and still carry a valid push-driven count).
 */
export const reconcileUnread = (
  entries: { chatId?: string; unreadCount?: number }[],
) => {
  for (const { chatId, unreadCount } of entries) {
    if (!chatId) continue;
    if ((unreadCount || 0) > 0) setUnread(chatId, unreadCount || 0);
    else clearUnread(chatId);
  }
};

/* -------------------------------------------------------------------------- */
/* Currently-focused chat (drives in-app suppression)                         */
/* -------------------------------------------------------------------------- */

// In-memory ONLY — deliberately not persisted to MMKV. The focused chat is a
// runtime concept (what's on screen right now), and it is only ever read from
// the main JS context (the foreground display path + useConversationsRealtime),
// never from the headless background handler. Persisting it caused stale
// suppression: if the app was killed while a chat was open, the value survived
// the restart and silently suppressed ALL foreground notifications for that
// chat until it was opened and closed again. A module variable resets to
// "nothing focused" on every launch, so it can never go stale.
let focusedChatId: string | undefined;

/**
 * Set the chat the user is currently viewing. Notifications for this chat
 * will be suppressed (the in-app socket already updates the message list, and
 * showing a banner on top of the open chat is annoying). Pass `undefined` on
 * unmount to clear.
 */
export const setFocusedChat = (chatId?: string) => {
  focusedChatId = chatId || undefined;
};

export const getFocusedChat = (): string | undefined => focusedChatId;
