import { User } from '../../typescript/interface/user.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';

export const getClients = async (
  signal?: AbortSignal,
): Promise<User[]> => {
  const res = await axiosInstance.get(endpoints.coach.getClients, { signal });
  return res.data;
};
