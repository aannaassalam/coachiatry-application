import { QueryFunctionContext } from '@tanstack/react-query';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { PaginatedResponse } from '../../typescript/interface/common.interface';
import { Message } from '../../typescript/interface/message.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';

export const getMessages = async (
  ctx: QueryFunctionContext<string[], number>,
): Promise<PaginatedResponse<Message[]>> => {
  const room = ctx.queryKey[1];
  const page = ctx.pageParam ?? 1;
  const res = await axiosInstance.get(endpoints.messages.getMessages(room), {
    params: {
      page,
      limit: 40,
    },
  });
  return res.data;
};

export const scheduleMessage = async (body: {
  message: string;
  date: string;
  time: string;
  frequency: string;
  chatId: string;
}) => {
  const res = await axiosInstance.post(
    endpoints.messages.scheduleMessage,
    body,
  );
  return res;
};

export const editScheduleMessage = async (body: {
  messageId: string;
  message: string;
  date: string;
  time: string;
  frequency: string;
}) => {
  const res = await axiosInstance.patch(
    endpoints.messages.editScheduleMessage(body.messageId),
    body,
  );
  return res;
};

export const getScheduleMessages = async ({
  page = 1,
}: {
  page: number;
}): Promise<
  PaginatedResponse<(Omit<Message, 'chat'> & { chat: ChatConversation })[]>
> => {
  const res = await axiosInstance.get(endpoints.messages.getScheduleMessages, {
    params: { page, limit: 10 },
  });
  return res.data;
};

export const getScheduleMessagesByCoach = async ({
  page = 1,
  userId,
}: {
  page: number;
  userId: string;
}): Promise<
  PaginatedResponse<(Omit<Message, 'chat'> & { chat: ChatConversation })[]>
> => {
  const res = await axiosInstance.get(
    endpoints.messages.getScheduleMessagesByCoach(userId),
    {
      params: { page, limit: 10 },
    },
  );
  return res.data;
};
