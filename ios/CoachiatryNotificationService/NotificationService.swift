import UserNotifications
import Intents

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttempt: UNMutableNotificationContent?

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        NSLog("[NSE] didReceive fired")
        self.contentHandler = contentHandler
        guard let content = request.content.mutableCopy() as? UNMutableNotificationContent else {
            contentHandler(request.content)
            return
        }
        self.bestAttempt = content

        let info = content.userInfo
        let senderName = (info["senderName"] as? String) ?? ""
        let senderId   = (info["senderId"] as? String) ?? UUID().uuidString
        let chatId     = (info["chatId"] as? String) ?? ""
        // Deliberately NOT defaulting to `senderName` — a group whose payload
        // omits `chatName` must fall back to the sender-titled layout, not
        // masquerade the sender as the group name.
        let chatName   = (info["chatName"] as? String) ?? ""
        let isGroup    = (info["isGroup"] as? String) == "true"
        let senderImg  = info["senderImage"] as? String
        let chatImg    = info["chatImage"] as? String
        let body       = info["body"] as? String
        NSLog("[NSE] senderName=\(senderName) avatarURL=\(isGroup ? (chatImg ?? "nil") : (senderImg ?? "nil"))")

        // Without a sender name we can't form a meaningful communication
        // notification — fall back to the original alert.
        guard !senderName.isEmpty else {
            contentHandler(content)
            return
        }

        let avatarURL = (isGroup ? chatImg : senderImg).flatMap(URL.init(string:))
        downloadImage(from: avatarURL) { [weak self] data in
            guard let self else { return }
            let updated = self.makeCommunicationContent(
                base: content,
                senderId: senderId,
                senderName: senderName,
                chatId: chatId,
                chatName: chatName,
                isGroup: isGroup,
                body: body,
                avatarData: data
            )
            contentHandler(updated)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        if let handler = contentHandler, let content = bestAttempt {
            handler(content)
        }
    }

    // MARK: - Intent assembly

    private func makeCommunicationContent(
        base: UNMutableNotificationContent,
        senderId: String,
        senderName: String,
        chatId: String,
        chatName: String,
        isGroup: Bool,
        body: String?,
        avatarData: Data?
    ) -> UNNotificationContent {
        let avatar = avatarData.flatMap { INImage(imageData: $0) }

        let handle = INPersonHandle(value: senderId, type: .unknown)
        let sender = INPerson(
            personHandle: handle,
            nameComponents: nil,
            displayName: senderName,
            image: avatar,
            contactIdentifier: nil,
            customIdentifier: senderId
        )

        let isNamedGroup = isGroup && !chatName.isEmpty

        let intent = INSendMessageIntent(
            recipients: nil,
            outgoingMessageType: .outgoingMessageText,
            content: nil,
            speakableGroupName: isNamedGroup ? INSpeakableString(spokenPhrase: chatName) : nil,
            conversationIdentifier: chatId,
            serviceName: nil,
            sender: sender,
            attachments: nil
        )

        // For group chats the avatar attaches to the speakableGroupName
        // parameter so the system shows the *group's* image, not the sender's.
        if isNamedGroup, let avatar = avatar {
            intent.setImage(avatar, forParameterNamed: \.speakableGroupName)
        }

        let interaction = INInteraction(intent: intent, response: nil)
        interaction.direction = .incoming
        interaction.donate(completion: nil)

        do {
            let updated = try base.updating(from: intent)
            NSLog("[NSE] base.updating(from:intent) succeeded, avatar=\(avatar != nil)")
            // Retitle AFTER `updating(from:)` — it derives the title from the
            // intent's sender, which is what surfaced the sender's name where
            // the group's name belongs.
            guard let final = updated.mutableCopy() as? UNMutableNotificationContent else {
                return updated
            }
            applyTitleAndBody(
                to: final,
                senderName: senderName,
                chatName: chatName,
                isNamedGroup: isNamedGroup,
                body: body
            )
            return final
        } catch {
            NSLog("[NSE] base.updating(from:intent) FAILED: \(error.localizedDescription)")
            applyTitleAndBody(
                to: base,
                senderName: senderName,
                chatName: chatName,
                isNamedGroup: isNamedGroup,
                body: body
            )
            return base
        }
    }

    /// `updating(from:)` rewrites the notification title to the intent sender's
    /// display name — so the server's correct group title ("Project Alpha") was
    /// being replaced by the sender ("Alice") while the body stayed
    /// "Alice: ship it", showing the sender's name twice and the group's never.
    /// Restore the group name as the title when the payload carries one.
    private func applyTitleAndBody(
        to content: UNMutableNotificationContent,
        senderName: String,
        chatName: String,
        isNamedGroup: Bool,
        body: String?
    ) {
        if isNamedGroup {
            content.title = chatName
            if let body = body, !body.isEmpty {
                // The server may already ship a prefixed body — don't stack a
                // second prefix on top of it.
                content.body = body.hasPrefix("\(senderName): ")
                    ? body
                    : "\(senderName): \(body)"
            }
        } else if !senderName.isEmpty {
            content.title = senderName
            if let body = body, !body.isEmpty {
                content.body = body
            }
        }
    }

    // MARK: - Network

    private func downloadImage(from url: URL?, completion: @escaping (Data?) -> Void) {
        guard let url else {
            NSLog("[NSE] no avatar URL in payload")
            completion(nil); return
        }
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                NSLog("[NSE] avatar download error: \(error.localizedDescription)")
            } else if let http = response as? HTTPURLResponse {
                NSLog("[NSE] avatar download status=\(http.statusCode) bytes=\(data?.count ?? 0)")
            }
            completion(data)
        }
        task.resume()
    }
}
