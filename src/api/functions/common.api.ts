import { Document } from '../../typescript/interface/document.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';
import { Task } from '../../typescript/interface/task.interface';
import { Transcription } from '../../typescript/interface/transcription.interface';

export type SearchResult =
  | (Document & { type: 'document' })
  | (Task & { type: 'task' })
  | (Transcription & { type: 'transcript' });

export const getSearch = async (
  query: string,
  category: string,
): Promise<SearchResult[]> => {
  const res = await axiosInstance.get(endpoints.common.search, {
    params: { query, category },
  });
  return res.data;
};
