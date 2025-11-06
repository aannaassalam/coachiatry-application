import { User } from "./user.interface";

export interface ChatConversation {
  _id?: string;
  type: "direct" | "group";
  name?: string;
  groupPhoto?: string;
  createdBy: string;
  members: [
    {
      user: User;
      role: "member" | "admin" | "owner";
      joinedAt: string;
      lastReadAt: string;
    }
  ];
  unreadCount: number;
  lastMessage: {
    sender?: User;
    content?: string;
    type?: "text" | "image" | "video" | "file" | "system";
    sentAt?: string;
    status?: "pending" | "sent" | "delivered" | "seen" | "failed";
    createdAt?: string;
  } | null;
  isDeletable: boolean;
  createdAt: string;
  updatedAt?: string;
}
