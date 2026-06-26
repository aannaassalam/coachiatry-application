import { PaginatedResponse } from '../../typescript/interface/common.interface';
import { Status } from '../../typescript/interface/status.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';

export const getAllStatuses = async (
  signal?: AbortSignal,
): Promise<Status[]> => {
  const res = await axiosInstance.get(endpoints.status.getAll, { signal });
  return res.data;
};

export const addStatus = async (body: {
  title: string;
  color: {
    bg: string;
    text: string;
  };
}) => {
  const res = await axiosInstance.post(endpoints.status.add, body);
  return res;
};

export const getAllStatusesByCoach = async (
  userId: string,
  signal?: AbortSignal,
): Promise<Status[]> => {
  const res = await axiosInstance.get(endpoints.status.getAllCoach(userId), {
    signal,
  });
  return res.data;
};

export const addStatusByCoach = async (body: {
  title: string;
  color: {
    bg: string;
    text: string;
  };
  user: string;
}) => {
  const res = await axiosInstance.post(
    endpoints.status.addCoach(body.user),
    body,
  );
  return res;
};

export type DeleteTaxonomyResponse =
  | { status: 'requires_replacement'; taskCount: number; message: string }
  | { message: string; data: null };

export const deleteStatus = async (
  id: string,
  replacementStatusId?: string,
): Promise<DeleteTaxonomyResponse> => {
  const res = await axiosInstance.delete(endpoints.status.delete(id), {
    data: replacementStatusId ? { replacementStatusId } : undefined,
  });
  return res.data;
};
