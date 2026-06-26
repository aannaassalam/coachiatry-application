import { registerSheet, SheetDefinition } from 'react-native-actions-sheet';
import { FilterSheet } from './components/Tasks/Filter';
import BottomSheet from './components/ui/BottomSheet';
import { ReactNode } from 'react';
import { SortSheet } from './components/Tasks/Sort';
import CreateTaxonomySheet from './components/CreateTaxonomySheet';
import DeleteTaxonomySheet from './components/DeleteTaxonomySheet';
import AssigneePickerSheet from './components/AssigneePickerSheet';

registerSheet('filter-sheet', FilterSheet);
registerSheet('general-sheet', BottomSheet);
registerSheet('sort-sheet', SortSheet);
registerSheet('create-taxonomy-sheet', CreateTaxonomySheet);
registerSheet('delete-taxonomy-sheet', DeleteTaxonomySheet);
registerSheet('assignee-sheet', AssigneePickerSheet);

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
  }
}
