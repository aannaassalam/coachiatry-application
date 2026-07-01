import { Task } from '../typescript/interface/task.interface';
import { User } from '../typescript/interface/user.interface';

/**
 * Client-side task sorting, ported 1:1 from the web's tableColumns.ts so the
 * app and web order an identical task list identically.
 *
 * The whole task list is fetched in one shot (no pagination), so sorting never
 * needs the network — we re-order the already-cached array in memory. The
 * comparators mirror the server's semantics (priority by severity, reference
 * fields by display name, dates by value, missing values always last) which
 * avoids the meaningless ObjectId ordering a raw backend `?sort=category` gives.
 *
 * Sort state is a single string: '' (default), a column key for ascending, or
 * a '-'-prefixed key for descending — matching the existing Sort sheet's
 * cycle (asc → desc → off).
 */

export type SortColumnKey =
  | 'name'
  | 'dueDate'
  | 'priority'
  | 'category'
  | 'owner'
  | 'assignedTo'
  | 'status';

export interface SortColumnMeta {
  key: SortColumnKey;
  label: string;
}

// Columns offered in the app's Sort sheet, in display order. `status` is
// intentionally omitted because the list is already grouped by status — sorting
// by it within those groups would be a no-op — but the comparator below still
// handles it for completeness.
export const SORT_COLUMNS: SortColumnMeta[] = [
  { key: 'name', label: 'Name' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'priority', label: 'Priority' },
  { key: 'category', label: 'Category' },
  { key: 'owner', label: 'Owner' },
  { key: 'assignedTo', label: 'Assignee' },
];

export const PRIORITY_RANK: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const baseKey = (entry: string) => entry.replace(/^-/, '') as SortColumnKey;

const strSortValue = (
  s?: string,
): { v?: number | string; missing?: boolean } =>
  s ? { v: s.toLowerCase() } : { missing: true };

function taskSortValue(
  key: SortColumnKey,
  t: Task,
): { v?: number | string; missing?: boolean } {
  switch (key) {
    case 'priority': {
      const rank = PRIORITY_RANK[(t.priority || '').toLowerCase()];
      return rank ? { v: rank } : { missing: true };
    }
    case 'dueDate': {
      if (!t.dueDate) return { missing: true };
      const ms = new Date(t.dueDate).getTime();
      return Number.isNaN(ms) ? { missing: true } : { v: ms };
    }
    case 'category':
      return strSortValue(t.category?.title);
    case 'owner':
      return strSortValue(t.user?.fullName);
    case 'assignedTo': {
      const list = Array.isArray(t.assignedTo)
        ? t.assignedTo
        : t.assignedTo
          ? [t.assignedTo as unknown as User]
          : [];
      return strSortValue(list[0]?.fullName);
    }
    case 'status':
      return strSortValue(t.status?.title);
    case 'name':
      return strSortValue(t.title);
    default:
      return { missing: true };
  }
}

/**
 * Sort a COPY of `tasks` by a single sort entry ('' | 'name' | '-dueDate' …).
 * Empty sort falls back to the default list ordering (newest first), matching
 * the backend's `-createdAt` default.
 */
export function sortTasks(tasks: Task[], sort: string): Task[] {
  if (!sort) {
    return [...tasks].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );
  }

  const key = baseKey(sort);
  const dir = sort.startsWith('-') ? -1 : 1;

  return [...tasks].sort((a, b) => {
    const va = taskSortValue(key, a);
    const vb = taskSortValue(key, b);
    if (va.missing && vb.missing) {
      // Stable tie-break: newest first.
      return (
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime()
      );
    }
    if (va.missing) return 1; // missing always sinks, regardless of direction
    if (vb.missing) return -1;
    const cmp =
      typeof va.v === 'number' && typeof vb.v === 'number'
        ? va.v - vb.v
        : String(va.v).localeCompare(String(vb.v));
    if (cmp !== 0) return cmp * dir;
    return (
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
    );
  });
}
