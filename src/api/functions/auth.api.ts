import { User } from '../../typescript/interface/user.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';

export interface SignupBody {
  fullName: string;
  email: string;
  password: string;
}

export type LoginBody = Omit<SignupBody, 'fullName'>;

export const signup = async (
  body: SignupBody,
): Promise<{ data: { token: string; user: User } }> => {
  const res = await axiosInstance.post(endpoints.auth.signup, body);
  return res;
};

export const login = async (
  body: LoginBody,
): Promise<{
  data: { token: string; user: User };
}> => {
  const res = await axiosInstance.post(endpoints.auth.login, body);
  return res;
};

export const googleAuth = async (
  tokenId: string,
): Promise<{ data: { token: string; user: User } }> => {
  const res = await axiosInstance.post(endpoints.auth.googleAuth, {
    id_token: tokenId,
  });
  return res;
};

export const forgotPassword = async (email: string) => {
  const res = await axiosInstance.post(endpoints.auth.forgotPassword, {
    email,
  });
  return res;
};

export const resetPassword = async (body: {
  token: string;
  password: string;
}) => {
  const res = await axiosInstance.post(endpoints.auth.resetPassword, body);
  return res;
};

export const updatePassword = async (body: { password: string }) => {
  const res = await axiosInstance.patch(endpoints.auth.updatePassword, body);
  return res;
};
