import { Category } from './category.interface';
import { Status } from './status.interface';
import { User } from './user.interface';

export interface Subtask {
  _id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  subtasks?: Subtask[];
  user: User;
  category: Category;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: Status;
  taskDuration?: number;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  remindBefore?: number;
  assignedTo: User;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskBody {
  title: string;
  description: string;
  subtasks?: Omit<Subtask, '_id'>[];
  category: string;
  priority: string;
  dueDate: Date;
  status: string;
  taskDuration?: number;
  frequency?: string | undefined;
  remindBefore?: number;
}
