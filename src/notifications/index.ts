export * from './constants';
export * from './types';

export {
  clearAvatarCache,
  resolveAvatar,
  resolveAvatarPair,
  trimAvatarCache,
} from './AvatarCache';

export {
  clearChatHistory,
  clearUnread,
  getFocusedChat,
  incrementUnread,
  readActiveChats,
  readChatHistory,
  readUnread,
  setFocusedChat,
  setUnread,
  totalUnread,
} from './NotificationCache';

export {
  clearChatNotifications,
  displayChatNotification,
  parseChatPushData,
  requestPermission,
  setupNotificationChannels,
  syncBadge,
} from './NotificationDisplay';

export {
  flushPendingDeepLink,
  readPendingDeepLink,
  routeToChat,
} from './DeepLinkHandler';

export {
  consumeInitialNotificationIntent,
  registerBackgroundMessageHandler,
  registerBackgroundNotifeeEvents,
  registerForegroundMessageHandler,
  registerForegroundNotifeeEvents,
  registerNotificationOpenedApp,
  setMarkReadHandler,
} from './NotificationHandlers';

export {
  handleColdStart,
  initNotifications,
  subscribeForegroundListeners,
  tearDownNotifications,
} from './NotificationService';
