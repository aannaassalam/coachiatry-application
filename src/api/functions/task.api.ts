import moment from 'moment';
import { Filter } from '../../typescript/interface/common.interface';
import { Task, TaskBody } from '../../typescript/interface/task.interface';
import { User } from '../../typescript/interface/user.interface';
import { VALUELESS_OPERATORS } from '../../helpers/utils';
import axiosInstance from '../axiosInstance';
import { endpoints } from '../endpoints';

export type TaskAssignee = Pick<
  User,
  '_id' | 'fullName' | 'photo' | 'role' | 'email' | 'updatedAt'
>;

// dueDate filter ranges — kept in lock-step with the web (today / yesterday /
// tomorrow / thisWeek / nextWeek). Always clone() before mutating so the shared
// `today` instance is never altered between branches.
function getDueDateQuery(value: string) {
  const today = moment().startOf('day');

  switch (value) {
    case 'today':
      return {
        gte: today.clone().startOf('day').toDate(),
        lte: today.clone().endOf('day').toDate(),
      };

    case 'yesterday': {
      const yesterday = today.clone().subtract(1, 'day');
      return {
        gte: yesterday.clone().startOf('day').toDate(),
        lte: yesterday.clone().endOf('day').toDate(),
      };
    }

    case 'tomorrow': {
      const tomorrow = today.clone().add(1, 'day');
      return {
        gte: tomorrow.clone().startOf('day').toDate(),
        lte: tomorrow.clone().endOf('day').toDate(),
      };
    }

    case 'thisWeek':
      return {
        gte: today.clone().startOf('week').toDate(),
        lte: today.clone().endOf('week').toDate(),
      };

    case 'nextWeek': {
      const nextWeek = today.clone().add(1, 'week');
      return {
        gte: nextWeek.clone().startOf('week').toDate(),
        lte: nextWeek.clone().endOf('week').toDate(),
      };
    }

    default:
      return null;
  }
}

function buildFilterQuery(values: Filter[]): Record<string, any> {
  const query: Record<string, any> = {};

  values.forEach(filter => {
    const valueless = VALUELESS_OPERATORS.includes(filter.selectedOperator);
    if (
      !filter.selectedKey ||
      !filter.selectedOperator ||
      (!filter.selectedValue && !valueless)
    )
      return;

    const key = filter.selectedKey;
    const value = filter.selectedValue;

    if (key === 'dueDate') {
      // Presence checks ignore the value entirely. dueDate defaults to null in
      // the schema, so "set" means non-null and "not set" means null/absent.
      // The backend coerces the string "null" → null.
      if (filter.selectedOperator === 'isSet') {
        query.dueDate = { ne: 'null' };
        return;
      }
      if (filter.selectedOperator === 'isNotSet') {
        query.dueDate = 'null';
        return;
      }

      const dateRange = getDueDateQuery(value);
      if (!dateRange) return;

      if (filter.selectedOperator === 'is') {
        query.dueDate = dateRange;
      } else if (filter.selectedOperator === 'isNot') {
        // exclude that range -> tasks before OR after
        query.dueDate = { not: dateRange };
      }
    } else {
      // Normal fields (status, category, priority)
      if (filter.selectedOperator === 'is') {
        query[key] = value;
      } else if (filter.selectedOperator === 'isNot') {
        query[key] = { ne: value };
      }
    }
  });

  return query;
}

export const getAllTasks = async (
  {
    sort,
    filter = [],
    startDate,
    endDate,
    limit,
  }: {
    sort?: string;
    filter?: Filter[];
    startDate?: string;
    endDate?: string;
    limit?: number;
  },
  signal?: AbortSignal,
): Promise<Task[]> => {
  const filterQuery = buildFilterQuery(filter);
  const res = await axiosInstance.get(endpoints.task.getAll, {
    params: {
      populate: 'category,status,assignedTo,user',
      sort,
      ...filterQuery,
      ...(limit ? { limit } : {}),
      dueDate:
        startDate && endDate
          ? { gte: startDate, lte: endDate }
          : filterQuery.dueDate,
    },
    signal,
  });
  return res.data;
};

export const getAllTasksByCoach = async (
  {
    sort,
    filter = [],
    userId,
  }: {
    sort?: string;
    filter?: Filter[];
    userId: string;
  },
  signal?: AbortSignal,
): Promise<Task[]> => {
  const filterQuery = buildFilterQuery(filter);

  // Use the dedicated coach endpoint (owned OR assigned) instead of /task?user=,
  // which only returned tasks the client OWNS and silently dropped tasks merely
  // assigned to them. Mirrors the web's getAllTasksByCoach.
  const res = await axiosInstance.get(endpoints.task.getAllCoach(userId), {
    params: {
      populate: 'category,status,assignedTo,user',
      sort,
      ...filterQuery,
    },
    signal,
  });
  return res.data;
};

export const getTask = async (
  id: string,
  signal?: AbortSignal,
): Promise<Task> => {
  const res = await axiosInstance.get(endpoints.task.getOne(id), {
    params: {
      populate: 'category,status,assignedTo,user',
    },
    signal,
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

export interface TaskAssigneesPage {
  canAssign: boolean;
  assignees: TaskAssignee[];
  meta: {
    totalCount: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  };
}

export const getTaskAssignees = async (
  {
    taskId,
    page = 1,
    search = '',
  }: {
    taskId: string;
    page?: number;
    search?: string;
  },
  signal?: AbortSignal,
): Promise<TaskAssigneesPage> => {
  // Always send `page` so the backend serves the paginated, role-based list
  // (staff → all staff system-wide, user → the owner's hierarchy). Omitting it
  // hits the legacy non-paginated shape, which is reserved for other consumers.
  const res = await axiosInstance.get(endpoints.task.assignees(taskId), {
    params: { page, search },
    signal,
  });
  return res.data as TaskAssigneesPage;
};

export const assignToggle = async (body: {
  taskId: string;
  coachId: string;
}) => {
  const res = await axiosInstance.patch(endpoints.task.assignToggle, body);
  return res;
};

export const getAllSharedTasks = async (
  {
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
  },
  signal?: AbortSignal,
): Promise<Task[]> => {
  const filterQuery = buildFilterQuery(filter);

  const res = await axiosInstance.get(endpoints.task.shared(shareId), {
    params: {
      populate: 'category,status,user',
      sort,
      ...filterQuery,
      dueDate:
        startDate && endDate ? { gte: startDate, lte: endDate } : undefined,
    },
    signal,
  });
  return res.data;
};

type ImportBulkTasks = Pick<
  TaskBody,
  'title' | 'description' | 'category' | 'priority' | 'frequency'
>;

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
