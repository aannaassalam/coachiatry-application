import axiosInstance from "../axiosInstance";
import { endpoints } from "../endpoints";

export const chatWithAi = async (body: {
  query?: string;
  action?: string;
  id?: string;
  page: string;
  session_id: string;
  user?: string;
}) => {
  const { session_id, ...rest } = body;
  const res = await axiosInstance.post(endpoints.ai.chatWithAi, rest, {
    headers: {
      "X-Session-Id": session_id
    }
  });
  return res.data;
};

export const transcriptAi = async (body: {
  query?: string;
  action?: string;
  transcriptionId?: string;
  session_id: string;
  user?: string;
}) => {
  const { session_id, ...rest } = body;
  const res = await axiosInstance.post(endpoints.ai.transcriptAi, rest, {
    headers: {
      "X-Session-Id": session_id
    }
  });
  return res.data;
};
