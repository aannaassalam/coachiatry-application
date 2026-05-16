# Notifications

Production notification stack: FCM + Notifee + an iOS Notification Service
Extension. Built around the contract documented in
`backend/src/utils/messagingNotifications.ts` and consumed via the
[`ChatPushData`](./types.ts) type.

## Folder map

```
src/notifications/
├── index.ts                # public surface — import only from here
├── types.ts                # ChatPushData, StoredChatMessage, etc.
├── constants.ts            # channel ids, action ids, MMKV keys, paths
├── AvatarCache.ts          # download + deterministic-key disk cache
├── NotificationCache.ts    # dedup, per-chat history, unread, focused chat
├── NotificationDisplay.ts  # composes the Notifee notification
├── DeepLinkHandler.ts      # navigation + pending-link replay
├── NotificationHandlers.ts # FCM + Notifee event subscribers
└── NotificationService.ts  # initNotifications / handleColdStart entry pts
```

```
ios/NotificationService/    # Xcode NSE target (added by hand — see below)
├── NotificationService.swift
├── Info.plist
└── CoachiatryNotificationService.entitlements
```

## Package installation

All packages are already declared in `package.json`. Reinstall pods after
adding the iOS NSE target:

```sh
yarn install
npx pod-install ios
```

## Wiring summary

`index.js` registers the FCM background handler and the Notifee background
event handler at module scope — these MUST be outside the React tree to
survive Headless JS task spawns on Android.

`App.tsx` calls four functions from the service:

```ts
initNotifications();              // permission, token, channels, badge sync
subscribeForegroundListeners();   // FCM onMessage + notifee events + onOpened
handleColdStart();                // drain initial notification + pending link
tearDownNotifications();          // on logout
```

`ChatRoom.tsx` and `CoachChatRoom.tsx` use the active-chat hook to suppress
notifications for the currently-viewed conversation:

```ts
useEffect(() => {
  setFocusedChat(room);
  clearChatNotifications(room);   // already-displayed banners
  return () => setFocusedChat(undefined);
}, [room]);
```

## iOS Notification Service Extension setup (one-time)

The NSE is what makes the avatar appear on the iOS lock-screen
notification. Without it, iOS will ignore the `imageUrl` in the FCM payload
and render a generic chat notification.

1. **Add the target in Xcode**
   - Open `ios/CoachiatryApp.xcworkspace`.
   - `File` → `New` → `Target…` → **Notification Service Extension**.
   - Product name: `CoachiatryNotificationService`.
   - Language: Swift. Activate the scheme when prompted.
   - Xcode generates `ios/CoachiatryNotificationService/`. Delete the
     generated files inside it.

2. **Replace with the provided files**
   - Move (or symlink) the three files in `ios/NotificationService/` into
     the new target's folder and **add them to the target** in Xcode.
     - `NotificationService.swift`
     - `Info.plist` (replace the auto-generated one)
     - `CoachiatryNotificationService.entitlements`

3. **Deployment target**
   - Set the NSE target's iOS Deployment Target to match the main app
     (`>= 15.0` recommended).

4. **App Group capability (recommended)**
   - In `Signing & Capabilities` for **both** the main app target and the
     NSE target, add the `App Groups` capability and enable
     `group.com.coachiatry.app`.
   - This lets the NSE-downloaded avatar live in the same cache directory
     as the main app's AvatarCache, so a tap → app launch sees the file
     immediately.
   - If you do not enable the App Group, the NSE silently falls back to its
     own caches dir — nothing breaks, you just download the avatar twice.

5. **Bundle identifier**
   - The NSE bundle id MUST be a child of the main app's bundle id, e.g.
     `com.coachiatry.app.NotificationService`. Xcode usually fills this in
     correctly.

6. **No CocoaPods changes required.** The NSE Swift code uses only system
   frameworks (`UserNotifications`, `UIKit`, `CryptoKit`). If you ever want
   to share Swift code between the main app and the NSE, create a shared
   framework — do not link the React Native pods into the NSE target.

## Backend payload contract

`backend/src/utils/messagingNotifications.ts` is the single source of truth.
The payload that hits the device:

```json
{
  "notification": {
    "title": "Project Alpha",
    "body": "Alice: ship it",
    "imageUrl": "https://s3.../group-photo.png"
  },
  "data": {
    "type": "chat",
    "chatId": "65f1…",
    "senderId": "65a2…",
    "senderName": "Alice",
    "senderImage": "https://s3.../alice.png",
    "chatName": "Project Alpha",
    "chatImage": "https://s3.../group-photo.png",
    "isGroup": "true",
    "messageId": "65f9…",
    "messageType": "text",
    "sentAt": "2026-05-15T13:42:11.000Z",
    "body": "ship it"
  },
  "android": {
    "priority": "high",
    "collapseKey": "chat-65f1…",
    "notification": {
      "channelId": "chat-messages",
      "tag": "65f1…"
    }
  },
  "apns": {
    "headers": {
      "apns-priority": "10",
      "apns-push-type": "alert"
    },
    "payload": {
      "aps": {
        "alert": { "title": "...", "body": "..." },
        "sound": "default",
        "threadId": "65f1…",
        "mutableContent": true,
        "category": "chat-message",
        "contentAvailable": true
      }
    }
  }
}
```

Key flags:

- `apns.payload.aps.mutableContent: true` — required for the NSE to run.
- `apns.payload.aps.threadId` — drives iOS notification grouping.
- `android.notification.tag` + `android.notification.channelId` — keep the
  system-rendered fallback collapsing into the same conversation entry the
  Notifee MESSAGING-style notification updates.
- `android.collapseKey` — bounds the message replay storm if a device comes
  back online after an outage.

## Best practices we follow

- **Data-rich, notification-rich.** Sending both blocks means cold-start
  delivery shows *something* immediately (system rendering of the
  `notification` block), and the JS layer can then enrich it (Notifee
  MESSAGING with full message history on Android, NSE-attached avatar on
  iOS). Data-only would crash this — iOS won't render data-only messages
  while the app is suspended.
- **Deterministic avatar cache keys.** S3 presigned URLs change every
  request; `AvatarCache.cacheKeyFor` ignores the query string so the same
  underlying object resolves to the same on-disk file.
- **Coalesced downloads.** A burst of notifications from the same sender
  shares one in-flight download (`AvatarCache.inFlight` map).
- **One notifications shade entry per chat on Android, threaded on iOS.**
  Android reuses `id: chatId`; iOS uses unique ids that share `threadId`.
- **Dedup keyed on `messageId`.** Same message arriving via socket + FCM
  (or via foreground + background handlers) only displays once.
- **In-chat suppression.** Notifications never fire for the chat the user is
  actively viewing (`setFocusedChat` from the chat-room mount).
- **MMKV everywhere.** Process-shared, mmap-backed — Headless JS background
  tasks and the foreground app share dedup/history/unread state.

## Common pitfalls

1. **Forgetting `mutableContent: true`** → NSE never runs, no avatar on
   iOS lock screen. Verify in Console.app: filter on the NSE process name
   and look for "didReceive" logs.
2. **NSE bundle id not a child of the main app's bundle id** → archive
   uploads to App Store Connect fail with `ITMS-90035`. Xcode usually
   prevents this but watch for it after a target rename.
3. **App Group capability missing on one of the targets** → avatar
   downloads work but live in a different sandbox, doubling disk usage and
   sometimes hitting iOS extension memory limits on slow networks.
4. **Sending `notification.android.tag` *and* using different `id`s in
   Notifee** → system collapses to one entry but Notifee thinks it has
   many. Always pair them.
5. **MESSAGING-style on iOS** → Android-only; iOS needs the NSE +
   `communicationInfo`. The dispatcher in `NotificationDisplay.ts` already
   splits per-platform.
6. **OEM background restrictions** (Xiaomi, Oppo, Vivo): users must
   manually allow background activity. There's no programmatic fix — link
   to the OEM-specific permission screen in your onboarding if the user
   base demands it. https://dontkillmyapp.com/ is the canonical reference.
7. **iOS Provisional permission** is accepted in `requestPermission`. If
   you want the loud, banner-style alerts, gate behind an explicit user
   action and request `alert: true` only at that moment.
8. **APNS sandbox vs production environment mismatch** is the #1 cause of
   "works in dev, silent in TestFlight". Make sure the Firebase console
   has the production APNS key uploaded.

## Debugging

- **No notification at all (Android):** check `adb logcat | grep FCM` — if
  FCM is delivering, the issue is permissions or channel importance. Verify
  with `adb shell dumpsys notification --noredact` that the `chat-messages`
  channel exists and has `importance=4` (HIGH).
- **No notification at all (iOS):** in Xcode Console.app, watch for
  `[com.apple.pushLaunch]` lines while sending. If absent, APNS isn't
  routing — re-check the FCM ↔ APNS key.
- **Avatar missing on iOS:** Console.app, filter on the NSE process. Look
  for the `didReceive` entry, then any error from `URLSession`. If the
  process never starts, `mutableContent` is missing in the payload.
- **Duplicate banners:** verify `messageId` is unique per send on the
  server and that the FCM `notification` block + the local Notifee call
  share the same notification id on Android (`chatId`).
- **Inline reply does nothing:** the background notifee event handler must
  be registered at module scope in `index.js`. Confirm by adding a
  `console.warn('background event', type)` to `handleNotifeeEvent`.

## Production recommendations

- Wire `setMarkReadHandler` from your API layer at app start. Without it
  the action button renders but no-ops.
- Call `trimAvatarCache(200)` periodically (e.g. on a daily app-resume
  check) to keep on-disk usage bounded.
- Server-side, **delete** the FCM token when the user logs out
  (`POST /users/fcm-token/delete`) so old tokens don't keep receiving pushes
  for a logged-out user. The backend's existing failed-token prune handles
  invalidations passively, but explicit deletion is cleaner.
- For per-recipient unread counts, replace the current single multicast
  with a per-token send loop and add an `unread` string field to each
  recipient's `data` block — the client already honors it via
  `data.unread`.
