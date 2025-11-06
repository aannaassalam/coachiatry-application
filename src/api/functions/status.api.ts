import { PaginatedResponse } from '../../typescript/interface/common.interface';
import { Status } from '../../typescript/interface/status.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';

export const getAllStatuses = async (): Promise<Status[]> => {
  const res = await axiosInstance.get(endpoints.status.getAll);
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
): Promise<Status[]> => {
  const res = await axiosInstance.get(endpoints.status.getAllCoach(userId));
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
