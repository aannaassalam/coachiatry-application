import { Asset } from 'react-native-image-picker';
import { User } from '../../typescript/interface/user.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';
import { Platform } from 'react-native';
import { PaginatedResponse } from '../../typescript/interface/common.interface';

export const fetchProfile = async (
  signal?: AbortSignal,
): Promise<User> => {
  const res = await axiosInstance.get(endpoints.user.getProfile, { signal });
  return res.data;
};

export const updateProfile = async (body: {
  fullName: string;
  email: string;
}) => {
  const res = await axiosInstance.patch(endpoints.user.updateProfile, body);
  return res;
};

// `userId` targets another user instead of the signed-in one (staff editing a
// client/coach from the client settings screen). Same for the watcher helpers.
export const updateProfilePicture = async (file: Asset, userId?: string) => {
  const formData = new FormData();
  formData.append('profilePicture', {
    name: file.fileName ?? `photo.${file.type?.split('/')[1] ?? 'jpg'}`,
    type: file.type ?? 'image/jpeg',
    uri:
      Platform.OS === 'android' ? file.uri : file.uri?.replace('file://', ''),
  } as any);
  const res = await axiosInstance.patch(
    userId
      ? endpoints.user.updateProfilePictureFor(userId)
      : endpoints.user.updateProfilePicture,
    formData,
  );
  return res;
};

// Staff setting someone else's password outright — no current password needed.
export const setClientPassword = async (body: {
  userId: string;
  password: string;
}) => {
  const res = await axiosInstance.patch(
    endpoints.user.setPasswordFor(body.userId),
    { password: body.password },
  );
  return res.data;
};

export const shareViewAccessToWatchers = async (shareId: string) => {
  const res = await axiosInstance.get(endpoints.user.shared(shareId));
  return res.data;
};

export const revokeViewAccess = async (viewerId: string, userId?: string) => {
  const res = await axiosInstance.delete(
    userId
      ? endpoints.user.revokeAccessFor(userId, viewerId)
      : endpoints.user.revokeAccess(viewerId),
  );
  return res;
};

export const getAllWatching = async (
  signal?: AbortSignal,
): Promise<Pick<User, '_id' | 'photo' | 'fullName' | 'shareId'>[]> => {
  const res = await axiosInstance.get(endpoints.user.getAllWatching, { signal });
  return res.data;
};

export const getMyProfile = async (
  signal?: AbortSignal,
): Promise<User> => {
  const res = await axiosInstance.get(endpoints.user.getProfile, {
    params: {
      populate: 'sharedViewers',
    },
    signal,
  });
  return res.data;
};

export const getUserSuggestions = async (
  search: string,
  type: 'group' | 'watchers' = 'group',
  signal?: AbortSignal,
  exclude: string[] = [],
): Promise<Pick<User, '_id' | 'fullName' | 'email' | 'photo'>[]> => {
  const res = await axiosInstance.get(endpoints.user.suggestUsers, {
    params: { search, type, ...(exclude.length ? { exclude } : {}) },
    signal,
  });
  return res.data;
};

export const getUserById = async (
  id: string,
  signal?: AbortSignal,
): Promise<
  Pick<
    User,
    | '_id'
    | 'fullName'
    | 'email'
    | 'photo'
    | 'createdAt'
    | 'role'
    | 'shareId'
  > & {
    assignedCoach: User[];
    sharedViewers?: User[];
  }
> => {
  const res = await axiosInstance.get(endpoints.user.userById(id), { signal });
  return res.data;
};

export const getUsersByIds = async (
  ids: string[],
  signal?: AbortSignal,
): Promise<Pick<User, '_id' | 'fullName' | 'email' | 'photo'>[]> => {
  const res = await axiosInstance.get(endpoints.user.userByIds, {
    params: { ids },
    signal,
  });
  return res.data;
};

export const addWatchers = async (userIds: string[], userId?: string) => {
  const res = await axiosInstance.post(
    userId ? endpoints.user.addWatchersFor(userId) : endpoints.user.addWatchers,
    { userIds },
  );
  return res;
};

export interface FindWatcherResult {
  found: boolean;
  alreadyWatcher?: boolean;
  isSelf?: boolean;
  user?: Pick<User, '_id' | 'fullName' | 'email' | 'photo' | 'role'>;
}

// Look up whether an email belongs to a registered user (and whether they're
// already a watcher / the current user). Powers the "invite by email" flow.
export const findWatcherByEmail = async (
  email: string,
  userId?: string,
): Promise<FindWatcherResult> => {
  const res = await axiosInstance.get(endpoints.user.findWatcherByEmail, {
    params: { email, userId },
  });
  return res.data;
};

// Email an invite to people who don't yet have an account, adding them as
// watchers once they join.
export const inviteWatchersByEmail = async (
  emails: string[],
  userId?: string,
) => {
  const res = await axiosInstance.post(
    userId
      ? endpoints.user.inviteWatchersFor(userId)
      : endpoints.user.inviteWatchers,
    { emails },
  );
  return res;
};

export const getUsers = async (
  {
    search = '',
    page,
  }: {
    search?: string;
    page: number;
  },
  signal?: AbortSignal,
): Promise<PaginatedResponse<User[]>> => {
  const res = await axiosInstance.get(endpoints.user.getUsers, {
    params: { search, page, limit: 10 },
    signal,
  });
  return res.data;
};

export const getAllUsers = async (
  signal?: AbortSignal,
): Promise<User[]> => {
  const res = await axiosInstance.get(endpoints.user.getAllUsers, { signal });
  return res.data;
};

export const createUser = async (body: {
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'coach' | 'user';
  assignedCoach?: string[];
}) => {
  const res = await axiosInstance.post(endpoints.user.createUser, body);
  return res;
};

export const updateUser = async (body: {
  userId: string;
  name: string;
  email?: string;
  role?: 'admin' | 'manager' | 'coach' | 'user';
  assignedCoach?: string[];
}) => {
  // The backend reads `fullName`; sending `name` (as this did) meant renames
  // were silently dropped. `role`/`assignedCoach` stay optional and are only
  // applied when present, so a caller that just renames leaves assignment
  // alone — a coach sending assignedCoach reassigns the client to themselves.
  const { userId, name, ...rest } = body;
  const res = await axiosInstance.put(endpoints.user.updateUser(userId), {
    ...rest,
    fullName: name,
  });
  return res;
};

export const deleteUser = async (userId: string) => {
  const res = await axiosInstance.delete(endpoints.user.deleteUser(userId));
  return res;
};

// Self-service: permanently deactivate the current user's own account.
export const deleteMyAccount = async () => {
  const res = await axiosInstance.delete(endpoints.user.deleteAccount);
  return res;
};
