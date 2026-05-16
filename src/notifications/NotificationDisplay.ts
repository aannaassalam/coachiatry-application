import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
  AuthorizationStatus,
} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { resolveAvatarPair } from './AvatarCache';
import {
  ACTION_MARK_READ,
  ACTION_OPEN_APP,
  ACTION_OPEN_CHAT,
  CHAT_CHANNEL_ID,
  CHAT_GROUP_ID,
  CHAT_SUMMARY_ID,
  IS_ANDROID,
  IS_IOS,
} from './constants';
import {
  appendChatHistory,
  getFocusedChat,
  incrementUnread,
  readActiveChats,
  readChatHistory,
  readUnread,
  totalUnread,
  trackActiveChat,
  untrackActiveChat,
  clearChatHistory,
  clearUnread,
} from './NotificationCache';
import type { ChatPushData, DisplayContext } from './types';

/* -------------------------------------------------------------------------- */
/* Setup                                                                      */
/* -------------------------------------------------------------------------- */

export const setupNotificationChannels = async () => {
  if (!IS_ANDROID) return;
  await notifee.createChannel({
    id: CHAT_CHANNEL_ID,
    name: 'Chat Messages',
    description: 'New messages from your conversations',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 250, 300, 250],
    visibility: AndroidVisibility.PRIVATE,
    lights: true,
    badge: true,
  });
};

export const requestPermission = async (): Promise<boolean> => {
  const settings = await notifee.requestPermission({
    alert: true,
    badge: true,
    sound: true,
    inAppNotificationSettings: true,
  });
  const granted =
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

  if (IS_IOS && granted) {
    await messaging().registerDeviceForRemoteMessages();
  }
  return granted;
};

/* -------------------------------------------------------------------------- */
/* Payload parsing                                                            */
/* -------------------------------------------------------------------------- */

export const parseChatPushData = (
  remoteMessage: import('@react-native-firebase/messaging').FirebaseMessagingTypes.RemoteMessage,
): ChatPushData => {
  return (remoteMessage.data || {}) as ChatPushData;
};

const isGroupChat = (data: ChatPushData) =>
  data.isGroup === 'true' || data.isGroup === '1';

const hasDisplayablePayload = (ctx: DisplayContext): boolean => {
  const { remoteMessage, data } = ctx;
  return !!(
    data.chatId ||
    data.body ||
    data.senderName ||
    remoteMessage.notification?.title ||
    remoteMessage.notification?.body
  );
};

/* -------------------------------------------------------------------------- */
/* Summary notification (Android only)                                        */
/* -------------------------------------------------------------------------- */

const updateSummaryNotification = async () => {
  if (!IS_ANDROID) return;
  const count = readActiveChats().length;
  if (count < 2) {
    try {
      await notifee.cancelDisplayedNotification(CHAT_SUMMARY_ID);
    } catch {}
    return;
  }
  await notifee.displayNotification({
    id: CHAT_SUMMARY_ID,
    title: 'New messages',
    body: `${count} new conversations`,
    android: {
      channelId: CHAT_CHANNEL_ID,
      groupId: CHAT_GROUP_ID,
      groupSummary: true,
      smallIcon: 'ic_notification',
      color: '#0E1734',
      pressAction: { id: ACTION_OPEN_APP, launchActivity: 'default' },
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Badge management                                                           */
/* -------------------------------------------------------------------------- */

const syncBadge = async () => {
  try {
    await notifee.setBadgeCount(totalUnread());
  } catch {}
};

/* -------------------------------------------------------------------------- */
/* Display                                                                    */
/* -------------------------------------------------------------------------- */

export const displayChatNotification = async (ctx: DisplayContext) => {
  const { remoteMessage, data, isBackgroundHandler } = ctx;
  if (!hasDisplayablePayload(ctx)) return;

  // In-chat suppression: if the user is staring at this chat right now there
  // is no value in pushing a banner — the live socket already updates the
  // message list, and the system bell on top of an open conversation is
  // disruptive. The background handler still proceeds, since the OS-rendered
  // notification (from FCM's `notification` block) is already on the shade
  // before our handler runs in that path.
  if (!isBackgroundHandler) {
    const focused = getFocusedChat();
    if (focused && data.chatId && focused === data.chatId) return;
  }

  // On Android, when the FCM payload includes a top-level `notification`
  // object AND we are in the background handler, the OS will render its own
  // copy. We still want to show our enriched MESSAGING-style notification, so
  // we re-display with the same `chatId` id — that *replaces* the system one
  // rather than duplicating it.
  // On iOS, the system displays only what we tell it to via the NSE.
  void isBackgroundHandler;

  const chatId = data.chatId || `msg-${remoteMessage.messageId || Date.now()}`;
  const isChatScoped = !!data.chatId;
  const senderName =
    data.senderName || remoteMessage.notification?.title || 'New message';
  const senderId = data.senderId || senderName;
  const body = data.body || remoteMessage.notification?.body || '';
  const isGroup = isGroupChat(data);
  const chatName =
    data.chatName ||
    (isGroup ? remoteMessage.notification?.title : senderName) ||
    senderName;
  const title = isGroup ? chatName : senderName;

  const { personIcon, largeIcon } = await resolveAvatarPair({
    senderImage: data.senderImage,
    chatImage: data.chatImage,
  });

  // Update history + unread before composing the MESSAGING messages array so
  // the new message is included.
  let unread = 0;
  let messages: Array<{
    text: string;
    timestamp: number;
    person: { name: string; icon?: string };
  }> = [];

  if (isChatScoped) {
    const history = appendChatHistory(chatId, {
      text: body,
      timestamp: Date.now(),
      sender: { id: senderId, name: senderName, icon: personIcon },
    });

    trackActiveChat(chatId);

    // Honor a server-provided unread count if present; otherwise increment.
    if (data.unread != null) {
      const parsed = Number(data.unread);
      if (Number.isFinite(parsed) && parsed >= 0) {
        // setUnread cleared by clearChatNotifications when user opens chat.
        // We still use this as the source of truth on display.
        unread = parsed;
      } else {
        unread = incrementUnread(chatId);
      }
    } else {
      unread = incrementUnread(chatId);
    }

    messages = history.map(m => ({
      text: m.text,
      timestamp: m.timestamp,
      person: { name: m.sender.name, icon: m.sender.icon },
    }));
  } else {
    messages = [
      {
        text: body,
        timestamp: Date.now(),
        person: { name: senderName, icon: personIcon },
      },
    ];
  }

  // Android updates the same notification id for MESSAGING-style stacking.
  // iOS displays a unique notification per message that share `threadId`,
  // because the iOS communication-style notification has no "messages array"
  // — same id would *replace* prior messages.
  const notificationId = IS_IOS
    ? `${chatId}::${data.messageId || remoteMessage.messageId || Date.now()}`
    : chatId;

  await notifee.displayNotification({
    id: notificationId,
    title,
    body: isGroup ? `${senderName}: ${body}` : body,
    data: {
      type: data.type || 'chat',
      chatId,
      senderId,
      messageId: data.messageId || remoteMessage.messageId || '',
      deepLink: data.deepLink || '',
    },
    android: {
      channelId: CHAT_CHANNEL_ID,
      groupId: isChatScoped ? CHAT_GROUP_ID : undefined,
      tag: isChatScoped ? chatId : undefined,
      smallIcon: 'ic_notification',
      largeIcon,
      color: '#0E1734',
      showTimestamp: true,
      onlyAlertOnce: false,
      autoCancel: true,
      pressAction: {
        id: isChatScoped ? ACTION_OPEN_CHAT : ACTION_OPEN_APP,
        launchActivity: 'default',
      },
      // Mark-as-read action. Requires the foreground service / events
      // handler to be registered (see NotificationHandlers).
      actions: isChatScoped
        ? [
            {
              title: 'Mark as read',
              pressAction: { id: ACTION_MARK_READ },
            },
          ]
        : undefined,
      style: {
        type: AndroidStyle.MESSAGING,
        person: { name: 'You' },
        ...(isGroup && chatName ? { title: chatName } : {}),
        group: isGroup,
        messages,
      },
    },
    ios: {
      threadId: chatId,
      sound: 'default',
      categoryId: 'chat-message',
      // The NSE swaps in the downloaded avatar attachment. We still pass
      // communicationInfo so iOS uses the avatar/sender on the lock screen
      // when the NSE fails to run (avoids a generic-looking notification).
      communicationInfo: {
        conversationId: chatId,
        sender: {
          id: senderId,
          displayName: senderName,
          avatar: personIcon,
        },
      },
      // Encode the per-chat unread in the badge so iOS shows the right value
      // even before the JS runtime gets a chance to recompute totals.
      badgeCount: totalUnread() || unread || undefined,
    },
  });

  if (isChatScoped) {
    await updateSummaryNotification();
    await syncBadge();
  }
};

/* -------------------------------------------------------------------------- */
/* Clearing                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Cancel all notifications for a chat and reset its history + unread counter.
 * Call this when the user opens that chat or marks it read.
 */
export const clearChatNotifications = async (chatId: string) => {
  clearChatHistory(chatId);
  clearUnread(chatId);
  const remaining = untrackActiveChat(chatId);

  try {
    const displayed = await notifee.getDisplayedNotifications();
    await Promise.all(
      displayed
        .filter(n => n.notification?.data?.chatId === chatId)
        .map(n =>
          n.notification?.id
            ? notifee.cancelDisplayedNotification(n.notification.id)
            : Promise.resolve(),
        ),
    );
  } catch {}

  if (remaining.length < 2 && IS_ANDROID) {
    try {
      await notifee.cancelDisplayedNotification(CHAT_SUMMARY_ID);
    } catch {}
  }

  await syncBadge();
};

export { readUnread, totalUnread, syncBadge };
