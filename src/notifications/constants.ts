import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

export const CHAT_CHANNEL_ID = 'chat-messages';
export const CHAT_GROUP_ID = 'chat-conversations';
export const CHAT_SUMMARY_ID = 'chat-summary';

export const ACTION_OPEN_CHAT = 'open-chat';
export const ACTION_OPEN_APP = 'open-app';
export const ACTION_MARK_READ = 'mark-as-read';

export const PENDING_NAV_KEY = 'pendingChatNavigation';

// MMKV keys.
export const DEDUP_KEY = 'notif.dedup';
export const HISTORY_KEY_PREFIX = 'notif.history:';
export const ACTIVE_CHATS_KEY = 'notif.active-chats';
export const UNREAD_KEY_PREFIX = 'notif.unread:';
export const AVATAR_META_KEY = 'notif.avatar-meta';

// Avatar cache lives under the cache directory so the OS can reclaim it.
export const AVATAR_CACHE_DIR = `${RNFS.CachesDirectoryPath}/notif-avatars`;
export const AVATAR_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
export const AVATAR_MAX_DIMENSION = 256;

export const DEDUP_WINDOW_MS = 60 * 1000;
export const HISTORY_LIMIT = 8;

export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';
