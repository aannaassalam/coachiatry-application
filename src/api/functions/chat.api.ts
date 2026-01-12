import { PaginatedResponse } from '../../typescript/interface/common.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { Asset } from 'react-native-image-picker';
import { Platform } from 'react-native';

export const getAllConversations = async (
  filters?: Record<string, any>,
): Promise<PaginatedResponse<ChatConversation[]>> => {
  const res = await axiosInstance.get(endpoints.chat.getConversations, {
    params: filters,
  });

  return res.data;
};

export const getConversation = async (
  roomId: string,
): Promise<ChatConversation> => {
  const res = await axiosInstance.get(endpoints.chat.getConversation(roomId));
  return res.data;
};

export const getAllConversationsByCoach = async ({
  filters,
  userId,
}: {
  filters?: Record<string, any>;
  userId: string;
}): Promise<PaginatedResponse<ChatConversation[]>> => {
  const res = await axiosInstance.get(
    endpoints.chat.getConversationsByCoach(userId),
    {
      params: filters,
    },
  );
  return res.data;
};

export const getConversationByCoach = async (
  roomId: string,
): Promise<ChatConversation> => {
  const res = await axiosInstance.get(
    endpoints.chat.getConversationByCoach(roomId),
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
