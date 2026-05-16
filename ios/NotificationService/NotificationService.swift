//
//  NotificationService.swift
//  CoachiatryNotificationService
//
//  Modifies incoming APNS chat notifications to attach an avatar image so
//  iOS renders the sender's photo on the lock screen and notification center
//  (the "communication notification" treatment).
//
//  The extension receives the notification BEFORE the user sees it. We have
//  ~30 seconds of wall-clock time and a hard memory cap (~24 MB on most
//  iPhones). The pattern below:
//    1) Reads the avatar URL from the FCM data payload.
//    2) Downloads it to the app group's shared cache directory (deterministic
//       filename so subsequent notifications reuse the file).
//    3) Attaches the file as a UNNotificationAttachment.
//    4) If anything fails or we run out of time, falls back to the original
//       payload unchanged so the user still gets the notification.
//

import UserNotifications
import UIKit
import CryptoKit

final class NotificationService: UNNotificationServiceExtension {

    private var contentHandler: ((UNNotificationContent) -> Void)?
    private var bestAttemptContent: UNMutableNotificationContent?

    // App Group used to share the avatar cache with the main app. Keep this
    // identifier in sync with the Capabilities tab on BOTH the main target
    // and the NSE target. Falls back to the extension's own caches dir if the
    // group container isn't available (e.g. capability missing).
    private let appGroupIdentifier = "group.com.coachiatry.app"
    private let cacheSubdir = "notif-avatars"

    // Hard timeout safety margin — we abort the download a beat before iOS
    // yanks us so we still get a chance to call the content handler with the
    // unmodified payload.
    private let downloadTimeout: TimeInterval = 8

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        self.bestAttemptContent = request.content.mutableCopy() as? UNMutableNotificationContent

        guard let bestAttemptContent = bestAttemptContent else {
            contentHandler(request.content)
            return
        }

        // FCM puts the data payload directly into userInfo when sent as a
        // notification + data message. Both keys are checked so we tolerate
        // either flavor.
        let userInfo = bestAttemptContent.userInfo
        let avatarURLString = (userInfo["chatImage"] as? String)
            ?? (userInfo["senderImage"] as? String)
            ?? (userInfo["profileImage"] as? String)

        // Rewrite title/body so the OS-rendered notification matches what the
        // app would render in foreground (group name as title, "Sender: msg"
        // body) even before the JS layer has a chance to run.
        applyTitleAndBody(to: bestAttemptContent, userInfo: userInfo)

        guard let urlString = avatarURLString,
              let url = URL(string: urlString) else {
            contentHandler(bestAttemptContent)
            return
        }

        downloadAvatar(from: url) { [weak self] localURL in
            guard let self = self else { return }
            if let localURL = localURL,
               let attachment = self.makeAttachment(at: localURL) {
                bestAttemptContent.attachments = [attachment]
            }
            contentHandler(bestAttemptContent)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        // Last-ditch fallback — deliver what we have so the user still sees
        // the notification, even without an avatar.
        if let contentHandler = contentHandler,
           let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }

    // MARK: - Title / body normalization

    private func applyTitleAndBody(
        to content: UNMutableNotificationContent,
        userInfo: [AnyHashable: Any]
    ) {
        let isGroup = (userInfo["isGroup"] as? String) == "true"
        let senderName = userInfo["senderName"] as? String
        let chatName = userInfo["chatName"] as? String
        let body = userInfo["body"] as? String

        if isGroup, let chatName = chatName, !chatName.isEmpty {
            content.title = chatName
            if let senderName = senderName, let body = body {
                content.body = "\(senderName): \(body)"
            }
        } else if let senderName = senderName, !senderName.isEmpty {
            content.title = senderName
            if let body = body, !body.isEmpty {
                content.body = body
            }
        }

        // Encode threadIdentifier so iOS groups the chat correctly on the
        // lock screen. We use the chatId from the payload.
        if let chatId = userInfo["chatId"] as? String, !chatId.isEmpty {
            content.threadIdentifier = chatId
        }
    }

    // MARK: - Avatar download / cache

    private func cacheDirectory() -> URL? {
        if let shared = FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) {
            let dir = shared.appendingPathComponent(cacheSubdir, isDirectory: true)
            try? FileManager.default.createDirectory(
                at: dir,
                withIntermediateDirectories: true
            )
            return dir
        }
        let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first
        return caches?.appendingPathComponent(cacheSubdir, isDirectory: true)
    }

    private func cacheFileURL(for remote: URL) -> URL? {
        guard let dir = cacheDirectory() else { return nil }
        let key = deterministicKey(for: remote)
        return dir.appendingPathComponent("\(key).img")
    }

    /// Cache key derived from the URL's host + path (ignoring query string),
    /// so S3 presigned URLs that change every request still hit the same file.
    private func deterministicKey(for url: URL) -> String {
        let ident = "\(url.host ?? "")\(url.path)"
        let digest = SHA256.hash(data: Data(ident.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    private func makeAttachment(at fileURL: URL) -> UNNotificationAttachment? {
        let options: [String: Any] = [
            UNNotificationAttachmentOptionsThumbnailHiddenKey: false,
            UNNotificationAttachmentOptionsThumbnailClippingRectKey:
                CGRect(x: 0, y: 0, width: 1, height: 1).dictionaryRepresentation
        ]
        return try? UNNotificationAttachment(
            identifier: "avatar",
            url: fileURL,
            options: options
        )
    }

    private func downloadAvatar(
        from url: URL,
        completion: @escaping (URL?) -> Void
    ) {
        // Hit the cache first.
        if let cached = cacheFileURL(for: url),
           FileManager.default.fileExists(atPath: cached.path) {
            completion(cached)
            return
        }

        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = downloadTimeout
        config.timeoutIntervalForResource = downloadTimeout
        let session = URLSession(configuration: config)

        let task = session.downloadTask(with: url) { [weak self] tmpURL, response, _ in
            guard let self = self,
                  let tmpURL = tmpURL,
                  let http = response as? HTTPURLResponse,
                  (200..<300).contains(http.statusCode),
                  let dest = self.cacheFileURL(for: url) else {
                completion(nil)
                return
            }

            do {
                if FileManager.default.fileExists(atPath: dest.path) {
                    try FileManager.default.removeItem(at: dest)
                }
                try FileManager.default.moveItem(at: tmpURL, to: dest)
                completion(dest)
            } catch {
                completion(nil)
            }
        }
        task.resume()
    }
}
