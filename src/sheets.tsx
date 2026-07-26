import { registerSheet, SheetDefinition } from 'react-native-actions-sheet';
import { FilterSheet } from './components/Tasks/Filter';
import BottomSheet from './components/ui/BottomSheet';
import { ReactNode } from 'react';
import { SortSheet } from './components/Tasks/Sort';
import { GroupBySheet } from './components/Tasks/GroupBy';
import { TaskControlsSheet } from './components/Tasks/TaskControls';
import CreateTaxonomySheet from './components/CreateTaxonomySheet';
import DeleteTaxonomySheet from './components/DeleteTaxonomySheet';
import AssigneePickerSheet from './components/AssigneePickerSheet';
import CreateClientSheet from './components/CreateClientSheet';
import ScheduleMessageSheet from './components/Chat/ScheduleMessageSheet';

registerSheet('filter-sheet', FilterSheet);
registerSheet('general-sheet', BottomSheet);
registerSheet('sort-sheet', SortSheet);
registerSheet('group-sheet', GroupBySheet);
registerSheet('task-controls-sheet', TaskControlsSheet);
registerSheet('create-taxonomy-sheet', CreateTaxonomySheet);
registerSheet('delete-taxonomy-sheet', DeleteTaxonomySheet);
registerSheet('assignee-sheet', AssigneePickerSheet);
registerSheet('create-client-sheet', CreateClientSheet);
registerSheet('schedule-message-sheet', ScheduleMessageSheet);

type Filter = {
  selectedKey: string;
  selectedOperator: string;
  selectedValue: string;
};

// Extend RNAS types
declare module 'react-native-actions-sheet' {
  interface Sheets {
    /**
     * Multi-level filter builder sheet
     */
    'filter-sheet': SheetDefinition<{
      /**
       * Only data passed from SheetManager.show()
       * No setters, no reactive values here.
       */
      payload: {
        filters: Filter[];
        setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
        // Set when a coach is filtering a client's sheet — scopes the
        // status/category options and the saved filters to that client.
        userId?: string;
        // tempFilter: TempFilter; // initial only
      };

      /**
       * Route params — we leave them EMPTY because
       * routes access state using the internal React Context,
       * NOT via route params.
       */
      routes: {
        'initial-screen': any;
        'select-type': any;
        'select-operator': any;
        'select-values': any;
        'save-filter': any;
      };
    }>;

    /**
     * Generic bottom sheet
     */
    'general-sheet': SheetDefinition<{
      payload: {
        children: ReactNode;
        paddingBottom?: number;
      };
    }>;

    'sort-sheet': SheetDefinition<{
      payload: {
        sort: string;
        setSort: React.Dispatch<React.SetStateAction<string>>;
      };
    }>;

    /**
     * Group the task list by a field (status | assignee | owner | due date |
     * category | priority) with an asc/desc order, or turn grouping off.
     */
    'group-sheet': SheetDefinition<{
      payload: {
        group: string;
        setGroup: React.Dispatch<React.SetStateAction<string>>;
        groupDir: string;
        setGroupDir: React.Dispatch<React.SetStateAction<string>>;
      };
    }>;

    /**
     * Single entry-point menu for the task toolbar — lists Filter / Group by /
     * Sort by and opens the relevant sheet on selection. Group/Sort rows are
     * shown only when their setters are supplied.
     */
    'task-controls-sheet': SheetDefinition<{
      payload: {
        filters: Filter[];
        setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
        group?: string;
        setGroup?: React.Dispatch<React.SetStateAction<string>>;
        groupDir?: string;
        setGroupDir?: React.Dispatch<React.SetStateAction<string>>;
        sort?: string;
        setSort?: React.Dispatch<React.SetStateAction<string>>;
        userId?: string;
      };
    }>;

    /**
     * Create a new Category or Status (title + colour picker)
     */
    'create-taxonomy-sheet': SheetDefinition<{
      payload: {
        type: 'category' | 'status';
        /** When a coach is acting on a client, the client's user id */
        userId?: string;
        /** Called with the newly created item's id */
        onCreated?: (id: string) => void;
      };
    }>;

    /**
     * Delete a user-owned Category or Status with optional task transfer
     */
    'delete-taxonomy-sheet': SheetDefinition<{
      payload: {
        type: 'category' | 'status';
        item: { _id: string; title: string };
        /** Other items the user can transfer tasks to before deleting */
        options: { value: string; label: string; bg: string; text: string }[];
        onDeleted?: () => void;
      };
    }>;

    /**
     * Inline task assignee picker (toggle assignees without editing the task)
     */
    'assignee-sheet': SheetDefinition<{
      payload: {
        taskId: string;
      };
    }>;

    /**
     * Coach adds a new client (name + email). Role is fixed to "user"; the
     * backend auto-assigns them to the coach and emails a generated password.
     */
    'create-client-sheet': SheetDefinition<{
      payload?: object;
    }>;

    /**
     * Compose / schedule a message to be sent to a chat later, optionally
     * repeating. Pass `selectedMessage` to edit an existing scheduled message.
     */
    'schedule-message-sheet': SheetDefinition<{
      payload: {
        chatId: string;
        message?: string;
        receiverName?: string;
        selectedMessage?: {
          _id: string;
          content: string;
          scheduledAt: string;
          repeat: string;
        };
      };
    }>;
  }
}
