import { Asset } from 'react-native-image-picker';
import { User } from '../../typescript/interface/user.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';
import { Platform } from 'react-native';

export const fetchProfile = async (): Promise<User> => {
  const res = await axiosInstance.get(endpoints.user.getProfile);
  return res.data;
};

export const updateProfile = async (body: {
  fullName: string;
  email: string;
}) => {
  const res = await axiosInstance.patch(endpoints.user.updateProfile, body);
  return res;
};

export const updateProfilePicture = async (file: Asset) => {
  const formData = new FormData();
  formData.append('profilePicture', {
    name: file.fileName ?? `photo.${file.type?.split('/')[1] ?? 'jpg'}`,
    type: file.type ?? 'image/jpeg',
    uri:
      Platform.OS === 'android' ? file.uri : file.uri?.replace('file://', ''),
  } as any);
  const res = await axiosInstance.patch(
    endpoints.user.updateProfilePicture,
    formData,
  );
  return res;
};

export const shareViewAccessToWatchers = async (shareId: string) => {
  const res = await axiosInstance.get(endpoints.user.shared(shareId));
  return res.data;
};

export const revokeViewAccess = async (viewerId: string) => {
  const res = await axiosInstance.delete(endpoints.user.revokeAccess(viewerId));
  return res;
};

export const getAllWatching = async (): Promise<
  Pick<User, '_id' | 'photo' | 'fullName' | 'shareId'>[]
> => {
  const res = await axiosInstance.get(endpoints.user.getAllWatching);
  return res.data;
};

export const getMyProfile = async (): Promise<User> => {
  const res = await axiosInstance.get(endpoints.user.getProfile, {
    params: {
      populate: 'sharedViewers',
    },
  });
  return res.data;
};

export const getUserSuggestions = async (
  search: string,
  type: 'group' | 'watchers' = 'group',
): Promise<Pick<User, '_id' | 'fullName' | 'email' | 'photo'>[]> => {
  const res = await axiosInstance.get(endpoints.user.suggestUsers, {
    params: { search, type },
  });
  return res.data;
};

export const getUserById = async (
  id: string,
): Promise<
  Pick<User, '_id' | 'fullName' | 'email' | 'photo' | 'createdAt'>
> => {
  const res = await axiosInstance.get(endpoints.user.userById(id));
  return res.data;
};

export const getUsersByIds = async (
  ids: string[],
): Promise<Pick<User, '_id' | 'fullName' | 'email' | 'photo'>[]> => {
  const res = await axiosInstance.get(endpoints.user.userByIds, {
    params: { ids },
  });
  return res.data;
};

export const addWatchers = async (userIds: string[]) => {
  const res = await axiosInstance.post(endpoints.user.addWatchers, { userIds });
  return res;
};
