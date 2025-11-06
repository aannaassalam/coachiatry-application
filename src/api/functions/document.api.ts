import { Document } from '../../typescript/interface/document.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';
import { PaginatedResponse } from '../../typescript/interface/common.interface';
import { User } from '../../typescript/interface/user.interface';

export const getAllDocuments = async ({
  sort,
  tab,
  limit,
}: {
  sort?: string;
  tab: string;
  limit?: number;
}): Promise<PaginatedResponse<Document[]>> => {
  const res = await axiosInstance.get(endpoints.document.getAll, {
    params: { sort, tab, select: '-shareId', populate: 'tag', limit },
  });
  return res.data;
};

export const getAllDocumentsByCoach = async ({
  sort,
  tab,
  limit,
  userId,
}: {
  sort: string;
  tab: string;
  limit?: number;
  userId: string;
}): Promise<PaginatedResponse<Document[]>> => {
  const res = await axiosInstance.get(endpoints.document.coachAccess, {
    params: { sort, tab, select: '-shareId', populate: 'tag', limit, userId },
  });
  return res.data;
};

type DetailDocument = Omit<Document, 'user'> & {
  user: User;
};

export const getDocument = async (
  documentId: string,
): Promise<DetailDocument> => {
  const res = await axiosInstance.get(endpoints.document.getOne(documentId), {
    params: {
      populate: 'user,tag',
    },
  });
  return res.data;
};

export const createDocument = async (body: {
  title: string;
  content: string;
  tag: string;
}) => {
  const res = await axiosInstance.post(endpoints.document.add, body);
  return res;
};

export const createDocumentByCoach = async (body: {
  title: string;
  content: string;
  tag: string;
  user: string;
}) => {
  const res = await axiosInstance.post(endpoints.document.addCoach, body);
  return res;
};

export const editDocument = async (body: {
  title: string;
  content: string;
  tag: string;
  documentId: string;
}) => {
  const { documentId, ...data } = body;
  const res = await axiosInstance.patch(
    endpoints.document.edit(documentId),
    data,
  );
  return res;
};

export const deleteDocument = async (documentId: string) => {
  const res = await axiosInstance.delete(endpoints.document.delete(documentId));
  return res;
};

export const accessSharedDocument = async (
  shareId: string,
): Promise<Document> => {
  const res = await axiosInstance.get(endpoints.document.shared(shareId));
  return res.data;
};
