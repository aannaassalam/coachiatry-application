import { User } from './user.interface';

export interface MessageFile {
  url: string;
  _id?: string;
  type: string;
  size: number;
  thumbnailUrl: string | null;
  duration: number | null;
  uploading?: boolean;
  progress?: number;
}

export interface MessageReaction {
  _id?: string;
  user?: string;
  emoji: String;
  reactedAt: string;
}

export type MessageStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'seen'
  | 'failed';

export interface Message {
  _id?: string;
  chat: string;
  sender?: User | undefined;
  type: 'text' | 'image' | 'video' | 'file';
  content: string;
  files?: MessageFile[];
  reactions?: MessageReaction[];
  replyTo?: Message | null;
  scheduledAt?: Date;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt?: string;
  updatedAt?: string;
  status: MessageStatus;
  deletedAt?: string;
  tempId?: string;
  overallProgress?: number;
}
