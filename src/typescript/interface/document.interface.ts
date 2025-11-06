import { Category } from "./category.interface";
import { User } from "./user.interface";

export interface Document {
  _id: string;
  title: string;
  user: string;
  tag?: Category;
  content: string;
  shareId: string;
  sharedWith: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
