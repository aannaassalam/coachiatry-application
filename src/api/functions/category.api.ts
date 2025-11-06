import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';
import { Category } from '../../typescript/interface/category.interface';

export const getAllCategories = async (): Promise<Category[]> => {
  const res = await axiosInstance.get(endpoints.category.getAll);
  return res.data;
};

export const addCategory = async (body: {
  title: string;
  color: {
    bg: string;
    text: string;
  };
}) => {
  const res = await axiosInstance.post(endpoints.category.add, body);
  return res;
};

export const getAllCategoriesByCoach = async (
  userId: string,
): Promise<Category[]> => {
  const res = await axiosInstance.get(endpoints.category.getAllCoach(userId));
  return res.data;
};

export const addCategoryByCoach = async (body: {
  title: string;
  color: {
    bg: string;
    text: string;
  };
  user: string;
}) => {
  const res = await axiosInstance.post(
    endpoints.category.addCoach(body.user),
    body,
  );
  return res;
};
