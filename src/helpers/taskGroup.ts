import moment from 'moment';
import { Status } from '../typescript/interface/status.interface';
import { Task } from '../typescript/interface/task.interface';
import { User } from '../typescript/interface/user.interface';
import { PRIORITY_RANK } from './taskSort';

/**
 * Client-side task grouping, ported 1:1 from the web's tableColumns.ts so the
 * app and web bucket an identical task list identically.
 *
 * The full list is fetched in one shot, so grouping never needs the network —
 * we bucket the already-sorted, already-cached array in memory. `status` (the
 * default) keeps the existing behaviour of showing every status column — even
 * empty ones — ordered by `status.priority`; every other field derives its
 * buckets from the tasks present. `groupDir` orders the groups themselves.
 */

/** Sentinel `group` value meaning "don't group — show a single flat list". */
export const NO_GROUP = 'none';

export type GroupColumnKey =
  | 'status'
  | 'assignedTo'
  | 'owner'
  | 'dueDate'
  | 'category'
  | 'priority';

export interface GroupColumnMeta {
  key: GroupColumnKey;
  label: string;
}

/** Columns offered in the app's Group By sheet, in display order. */
export const GROUPABLE_COLUMNS: GroupColumnMeta[] = [
  { key: 'status', label: 'Status' },
  { key: 'assignedTo', label: 'Assignee' },
  { key: 'owner', label: 'Owner' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'category', label: 'Category' },
  { key: 'priority', label: 'Priority' },
];

export interface TaskGroup {
  key: string;
  label: string;
  /** present for coloured pills (status / category). */
  bg?: string;
  text?: string;
  /** only set for status groups — drives the per-group "Add Task" button. */
  statusId?: string;
  tasks: Task[];
}

const NO_VALUE = '__none__';

const firstAssignee = (task: Task): User | undefined => {
  const list = Array.isArray(task.assignedTo)
    ? task.assignedTo
    : task.assignedTo
      ? [task.assignedTo as unknown as User]
      : [];
  return list[0];
};

interface Bucket {
  key: string;
  label: string;
  bg?: string;
  text?: string;
  /** lower sorts first; used for predefined orders (priority, due date). */
  rank?: number;
}

function dueDateBucket(dueDate?: string): Bucket {
  if (!dueDate) return { key: 'no-date', label: 'No Due Date', rank: 5 };
  const d = moment(dueDate);
  const today = moment().startOf('day');
  if (d.isBefore(today, 'day'))
    return { key: 'overdue', label: 'Overdue', rank: 0 };
  if (d.isSame(today, 'day')) return { key: 'today', label: 'Today', rank: 1 };
  if (d.isSame(today.clone().add(1, 'day'), 'day'))
    return { key: 'tomorrow', label: 'Tomorrow', rank: 2 };
  if (d.isSame(today, 'week'))
    return { key: 'this-week', label: 'This Week', rank: 3 };
  return { key: 'later', label: 'Later', rank: 4 };
}

function bucketFor(task: Task, groupKey: GroupColumnKey): Bucket {
  switch (groupKey) {
    case 'priority': {
      const p = task.priority?.toLowerCase?.() ?? '';
      if (!p) return { key: NO_VALUE, label: 'No Priority', rank: 99 };
      return {
        key: p,
        label: p.charAt(0).toUpperCase() + p.slice(1),
        rank: PRIORITY_RANK[p] ?? 50,
      };
    }
    case 'category': {
      const c = task.category;
      if (!c) return { key: NO_VALUE, label: 'No Category' };
      return {
        key: c._id,
        label: c.title,
        bg: c.color?.bg,
        text: c.color?.text,
      };
    }
    case 'owner': {
      const u = task.user;
      if (!u) return { key: NO_VALUE, label: 'No Owner' };
      return { key: u._id, label: u.fullName || 'Unknown' };
    }
    case 'assignedTo': {
      const u = firstAssignee(task);
      if (!u) return { key: NO_VALUE, label: 'Unassigned' };
      return { key: u._id, label: u.fullName || 'Unknown' };
    }
    case 'dueDate':
      return dueDateBucket(task.dueDate);
    default:
      return { key: NO_VALUE, label: '—' };
  }
}

/**
 * Bucket the (already sorted) task list into collapsible groups. `status` (the
 * default) shows every status column ordered by `status.priority`; every other
 * field derives its buckets from the tasks present. `groupDir` controls the
 * order of the groups themselves.
 */
export function getGroups(
  tasks: Task[],
  groupKey: GroupColumnKey,
  groupDir: string,
  statuses: Status[],
): TaskGroup[] {
  const dir = groupDir === 'desc' ? -1 : 1;

  if (groupKey === 'status') {
    const columnIds = new Set(statuses.map(s => s?._id));
    return [...statuses]
      .sort((a, b) => ((a?.priority || 0) - (b?.priority || 0)) * dir)
      .map(s => ({
        key: s?._id,
        label: s?.title,
        bg: s?.color?.bg,
        text: s?.color?.text,
        statusId: s?._id,
        tasks: tasks.filter(
          task =>
            task.status._id === s?._id ||
            (!columnIds.has(task.status._id) &&
              task.status.title === s?.title),
        ),
      }));
  }

  const buckets = new Map<string, TaskGroup & { rank?: number }>();
  const order: string[] = [];
  for (const task of tasks) {
    const b = bucketFor(task, groupKey);
    let group = buckets.get(b.key);
    if (!group) {
      group = {
        key: b.key,
        label: b.label,
        bg: b.bg,
        text: b.text,
        rank: b.rank,
        tasks: [],
      };
      buckets.set(b.key, group);
      order.push(b.key);
    }
    group.tasks.push(task);
  }

  const groups = order.map(k => buckets.get(k)!);
  const hasRanks = groups.some(g => g.rank !== undefined);
  groups.sort((a, b) => {
    // The "no value" bucket always sinks to the bottom regardless of direction.
    if (a.key === NO_VALUE) return 1;
    if (b.key === NO_VALUE) return -1;
    if (hasRanks) return ((a.rank ?? 0) - (b.rank ?? 0)) * dir;
    return a.label.localeCompare(b.label) * dir;
  });
  return groups;
}
