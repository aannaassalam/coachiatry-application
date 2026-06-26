import { PaginatedResponse } from '../../typescript/interface/common.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { Asset } from 'react-native-image-picker';
import { Platform } from 'react-native';

export const getAllConversations = async (
  filters?: Record<string, any>,
  signal?: AbortSignal,
): Promise<PaginatedResponse<ChatConversation[]>> => {
  const res = await axiosInstance.get(endpoints.chat.getConversations, {
    params: filters,
    signal,
  });

  return res.data;
};

export const getConversation = async (
  roomId: string,
  signal?: AbortSignal,
): Promise<ChatConversation> => {
  const res = await axiosInstance.get(endpoints.chat.getConversation(roomId), {
    signal,
  });
  return res.data;
};

export const getAllConversationsByCoach = async (
  {
    filters,
    userId,
  }: {
    filters?: Record<string, any>;
    userId: string;
  },
  signal?: AbortSignal,
): Promise<PaginatedResponse<ChatConversation[]>> => {
  const res = await axiosInstance.get(
    endpoints.chat.getConversationsByCoach(userId),
    {
      params: filters,
      signal,
    },
  );
  return res.data;
};

export const getConversationByCoach = async (
  roomId: string,
  signal?: AbortSignal,
): Promise<ChatConversation> => {
  const res = await axiosInstance.get(
    endpoints.chat.getConversationByCoach(roomId),
    { signal },
  );
  return res.data;
};

export const createGroup = async (body: {
  name: string;
  members: string[];
  groupPhoto: Asset | null;
}) => {
  const formData: { name: string; members: string[]; groupPhoto: any | null } =
    {
      name: body.name,
      members: body.members,
      groupPhoto: null,
    };
  if (body.groupPhoto)
    formData.groupPhoto = {
      name:
        body.groupPhoto.fileName ??
        `photo.${body.groupPhoto.type?.split('/')[1] ?? 'jpg'}`,
      type: body.groupPhoto.type ?? 'image/jpeg',
      uri:
        Platform.OS === 'android'
          ? body.groupPhoto.uri
          : body.groupPhoto.uri?.replace('file://', ''),
    };

  const res = await axiosInstance.post(endpoints.chat.createGroup, formData);
  return res.data;
};

export const editGroup = async (body: {
  name: string;
  members: string[];
  groupPhoto: Asset | string | null;
  chatId: string;
}) => {
  console.log(body.members);
  const formData: {
    chatId: string;
    name: string;
    members: string[];
    groupPhoto: any | null;
  } = {
    chatId: body.chatId,
    name: body.name,
    members: body.members,
    groupPhoto: null,
  };
  if (body.groupPhoto && typeof body.groupPhoto !== 'string')
    formData.groupPhoto = {
      name:
        body.groupPhoto.fileName ??
        `photo.${body.groupPhoto.type?.split('/')[1] ?? 'jpg'}`,
      type: body.groupPhoto.type ?? 'image/jpeg',
      uri:
        Platform.OS === 'android'
          ? body.groupPhoto.uri
          : body.groupPhoto.uri?.replace('file://', ''),
    };

  const res = await axiosInstance.post(endpoints.chat.editGroup, formData);
  return res.data;
};

export const leaveGroup = async (chatId: string) => {
  const res = await axiosInstance.delete(endpoints.chat.leaveGroup(chatId));
  return res;
};

// Invite people to a group by email. The backend skips anyone already a member
// and, for everyone else, emails an invite link (existing users → join link,
// new users → signup-then-join link). Auto-join also happens on signup/login.
export const inviteToGroupByEmail = async (body: {
  chatId: string;
  emails: string[];
}) => {
  const res = await axiosInstance.post(endpoints.chat.inviteToGroup, body);
  return res.data;
};

export interface GroupInvitePreview {
  token: string;
  email: string;
  accepted: boolean;
  chat: { _id: string; name?: string; groupPhoto?: string; type: string } | null;
  invitedBy: { _id: string; fullName: string; photo?: string } | null;
}

export const getGroupInvite = async (
  token: string,
  signal?: AbortSignal,
): Promise<GroupInvitePreview> => {
  const res = await axiosInstance.get(endpoints.chat.getGroupInvite(token), {
    signal,
  });
  return res.data;
};

export const acceptGroupInvite = async (
  token: string,
): Promise<{ chatId: string }> => {
  const res = await axiosInstance.post(endpoints.chat.acceptGroupInvite(token));
  return res.data;
};
