import {
  Filter,
  PaginatedResponse,
} from '../../typescript/interface/common.interface';
import { Task, TaskBody } from '../../typescript/interface/task.interface';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';
import moment from 'moment';

function getDueDateQuery(value: string) {
  const today = moment().startOf('day');

  switch (value) {
    case 'today':
      return {
        $gte: today.toDate(),
        $lte: today.endOf('day').toDate(),
      };

    case 'yesterday':
      return {
        $gte: today.clone().subtract(1, 'day').startOf('day').toDate(),
        $lte: today.clone().subtract(1, 'day').endOf('day').toDate(),
      };

    case 'tomorrow':
      return {
        $gte: today.clone().add(1, 'day').startOf('day').toDate(),
        $lte: today.clone().add(1, 'day').endOf('day').toDate(),
      };

    case 'thisWeek':
      return {
        $gte: today.clone().startOf('week').toDate(),
        $lte: today.clone().endOf('week').toDate(),
      };

    case 'nextWeek':
      return {
        $gte: today.clone().add(1, 'week').startOf('week').toDate(),
        $lte: today.clone().add(1, 'week').endOf('week').toDate(),
      };

    default:
      return null;
  }
}

function buildFilterQuery(values: Filter[]): Record<string, any> {
  const query: Record<string, any> = {};

  values.forEach(filter => {
    if (
      !filter.selectedKey ||
      !filter.selectedOperator ||
      !filter.selectedValue
    )
      return;

    const key = filter.selectedKey;
    const value = filter.selectedValue;

    if (key === 'dueDate') {
      const dateRange = getDueDateQuery(value);
      if (!dateRange) return;

      if (filter.selectedOperator === 'is') {
        query.dueDate = dateRange;
      } else if (filter.selectedOperator === 'is not') {
        // exclude that range -> tasks before OR after
        query.$or = [
          { dueDate: { $lt: dateRange.$gte } },
          { dueDate: { $gt: dateRange.$lte } },
        ];
      }
    } else {
      // Normal fields (status, category, priority)
      if (filter.selectedOperator === 'is') {
        query[key] = value;
      } else if (filter.selectedOperator === 'is not') {
        query[key] = { $ne: value };
      }
    }
  });

  return query;
}

export const getAllTasks = async ({
  sort,
  filter = [],
  startDate,
  endDate,
}: {
  sort?: string;
  filter?: Filter[];
  startDate?: string;
  endDate?: string;
}): Promise<Task[]> => {
  const filterQuery = buildFilterQuery(filter);

  const res = await axiosInstance.get(endpoints.task.getAll, {
    params: {
      populate: 'category,status,user',
      sort,
      ...filterQuery,
      dueDate:
        startDate && endDate ? { gte: startDate, lte: endDate } : undefined,
    },
  });
  return res.data;
};

export const getAllTasksByCoach = async ({
  sort,
  filter = [],
  userId,
}: {
  sort?: string;
  filter?: Filter[];
  userId: string;
}): Promise<Task[]> => {
  const filterQuery = buildFilterQuery(filter);

  const res = await axiosInstance.get(endpoints.task.getAll, {
    params: {
      populate: 'category,status,user',
      sort,
      ...filterQuery,
      user: userId,
    },
  });
  return res.data;
};

export const getTask = async (id: string): Promise<Task> => {
  const res = await axiosInstance.get(endpoints.task.getOne(id), {
    params: {
      populate: 'category,status,user',
    },
  });
  return res.data;
};

export const addTask = async (taskData: TaskBody) => {
  const res = await axiosInstance.post(endpoints.task.post, taskData);
  return res;
};

export const addTaskByCoach = async (taskData: TaskBody & { user: string }) => {
  const res = await axiosInstance.post(endpoints.task.postCoach, taskData);
  return res;
};

export const editTask = async (body: {
  task_id: string;
  data: Partial<TaskBody>;
}) => {
  const res = await axiosInstance.patch(
    endpoints.task.edit(body.task_id),
    body.data,
  );
  return res;
};

export const moveToStatus = async (body: {
  task_id: string;
  status: string;
}) => {
  const res = await axiosInstance.patch(
    endpoints.task.moveToStatus(body.task_id),
    { status: body.status },
  );
  return res;
};

export const markSubtaskAsCompleted = async (body: {
  task_id: string;
  subtask_id: string;
}) => {
  const res = await axiosInstance.patch(
    endpoints.task.markSubtaskAsComplete(body.task_id, body.subtask_id),
  );
  return res;
};

export const deleteTask = async (task_id: string) => {
  const res = await axiosInstance.delete(endpoints.task.delete(task_id));
  return res;
};

export const getAllSharedTasks = async ({
  shareId,
  sort,
  filter = [],
  startDate,
  endDate,
}: {
  shareId: string;
  sort?: string;
  filter?: Filter[];
  startDate?: string;
  endDate?: string;
}): Promise<Task[]> => {
  const filterQuery = buildFilterQuery(filter);

  const res = await axiosInstance.get(endpoints.task.shared(shareId), {
    params: {
      populate: 'category,status,user',
      sort,
      ...filterQuery,
      dueDate:
        startDate && endDate ? { gte: startDate, lte: endDate } : undefined,
    },
  });
  return res.data;
};

type ImportBulkTasks = Pick<
  Omit<TaskBody, 'dueDate'>,
  'title' | 'description' | 'category' | 'priority' | 'frequency'
> & { dueDate: string };

export const importBulkTasks = async ({
  tasks,
  userId,
}: {
  tasks: ImportBulkTasks[];
  userId?: string;
}) => {
  const res = await axiosInstance.post(endpoints.task.importBulkTasks, {
    tasks,
    userId,
  });
  return res.data;
};
