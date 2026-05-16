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

/* -------------------------------------------------------------------------- */
/* Currently-focused chat (drives in-app suppression)                         */
/* -------------------------------------------------------------------------- */

const FOCUSED_CHAT_KEY = 'notif.focused-chat';

/**
 * Set the chat the user is currently viewing. Notifications for this chat
 * will be suppressed (the in-app socket already updates the message list, and
 * showing a banner on top of the open chat is annoying). Pass `undefined` on
 * unmount to clear.
 */
export const setFocusedChat = (chatId?: string) => {
  if (chatId) {
    storage.set(FOCUSED_CHAT_KEY, chatId);
  } else {
    storage.remove(FOCUSED_CHAT_KEY);
  }
};

export const getFocusedChat = (): string | undefined => {
  return storage.getString(FOCUSED_CHAT_KEY);
};
