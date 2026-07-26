import { Filter } from '../../typescript/interface/common.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';

export interface SavedFilter {
  _id: string;
  name: string;
  filters: Filter[];
}

// `userId` is set only when a coach is viewing a client's task sheet; it swaps
// in the coach-scoped endpoints so both screens share one set of functions.
export const getSavedFilters = async (
  userId?: string,
  signal?: AbortSignal,
): Promise<SavedFilter[]> => {
  const res = await axiosInstance.get(
    userId
      ? endpoints.savedFilter.getAllCoach(userId)
      : endpoints.savedFilter.getAll,
    { signal },
  );
  return res.data;
};

export const addSavedFilter = async (
  body: { name: string; filters: Filter[] },
  userId?: string,
): Promise<SavedFilter> => {
  const res = await axiosInstance.post(
    userId ? endpoints.savedFilter.addCoach(userId) : endpoints.savedFilter.add,
    body,
  );
  return res.data;
};

export const editSavedFilter = async ({
  id,
  ...body
}: {
  id: string;
  name: string;
  filters: Filter[];
}): Promise<SavedFilter> => {
  const res = await axiosInstance.patch(endpoints.savedFilter.edit(id), body);
  return res.data;
};

export const deleteSavedFilter = async (id: string) => {
  const res = await axiosInstance.delete(endpoints.savedFilter.delete(id));
  return res.data;
};
