import { InfiniteData } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryClient } from '../../App';
import { getFocusedChat } from '../notifications/NotificationCache';
import { ChatConversation } from '../typescript/interface/chat.interface';
import { PaginatedResponse } from '../typescript/interface/common.interface';
import { Message } from '../typescript/interface/message.interface';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';

/**
 * Single owner of the realtime `['conversations']` cache (last-message preview,
 * reordering and unread count). Mount it ONCE high in the tree (FloatingChatHost)
 * so the rules live in one place.
 *
 * Previously this logic was duplicated across ChatList, FloatingChatList and
 * ChatRoom — which double-counted unread and bumped the badge for the chat the
 * user was actively viewing. Here the increment is skipped for the focused chat
 * (and for the user's own messages).
 */
export function useConversationsRealtime() {
  const socket = useSocket();
  const { profile } = useAuth();

  useEffect(() => {
    if (!socket) return;

    const onConversationUpdated = (update: {
      chatId: string;
      lastMessage: Message;
      updatedAt: string;
    }) => {
      queryClient.setQueryData<
        InfiniteData<PaginatedResponse<ChatConversation[]>, number>
      >(['conversations'], old => {
        if (!old || !old.pages.length) return old;

        const allConvs = old.pages.flatMap(p => p.data);
        const idx = allConvs.findIndex(c => c._id === update.chatId);
        if (idx === -1) return old;

        const current = allConvs[idx];
        const isMyMessage = update.lastMessage?.sender?._id === profile?._id;
        // The chat currently open on screen is effectively already read.
        const isFocused = getFocusedChat() === update.chatId;

        const updatedConv: ChatConversation = {
          ...current,
          lastMessage: update.lastMessage,
          updatedAt: update.updatedAt,
          unreadCount:
            isMyMessage || isFocused
              ? current.unreadCount || 0
              : (current.unreadCount || 0) + 1,
        };

        const withoutUpdated = allConvs.filter((_, i) => i !== idx);
        const newFirstPageData = [updatedConv, ...withoutUpdated].slice(
          0,
          old.pages[0].meta.limit || 20,
        );

        return {
          ...old,
          pages: [
            { ...old.pages[0], data: newFirstPageData },
            ...old.pages.slice(1),
          ],
        };
      });
    };

    socket.on('conversation_updated', onConversationUpdated);
    return () => {
      socket.off('conversation_updated', onConversationUpdated);
    };
  }, [socket, profile?._id]);
}
