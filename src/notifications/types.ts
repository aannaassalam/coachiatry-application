import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export type ChatNotificationType = 'chat' | 'chat-reaction' | 'chat-edit';

export interface ChatPushData {
  type?: ChatNotificationType | string;

  chatId?: string;
  chatName?: string;
  chatImage?: string;

  messageId?: string;
  // FCM ships every `data` value as a string — keep `messageType` loose so
  // future variants (`audio`, `system`, …) don't break the consumer.
  messageType?: 'text' | 'image' | 'video' | 'file' | string;
  // ISO 8601.
  sentAt?: string;

  senderId?: string;
  senderName?: string;
  senderImage?: string;

  isGroup?: 'true' | 'false' | string;

  body?: string;

  // Optional server-driven unread counter for the recipient on this chat.
  unread?: string;

  // Free-form deep-link route override. If absent we infer from chatId.
  deepLink?: string;
}

export interface StoredChatMessage {
  text: string;
  timestamp: number;
  sender: { id: string; name: string; icon?: string };
}

export interface DisplayContext {
  remoteMessage: FirebaseMessagingTypes.RemoteMessage;
  data: ChatPushData;
  isBackgroundHandler: boolean;
}

export interface ResolvedAvatars {
  // Per-message sender avatar (Android Person, iOS communicationInfo).
  personIcon?: string;
  // Conversation icon (Android largeIcon, iOS thread image).
  largeIcon?: string;
}

export type PendingDeepLink = {
  chatId: string;
  messageId?: string;
  deepLink?: string;
};
