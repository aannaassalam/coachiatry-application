import { registerSheet, SheetDefinition } from 'react-native-actions-sheet';
import { FilterSheet } from './components/Tasks/Filter';
import BottomSheet from './components/ui/BottomSheet';
import { ReactNode } from 'react';
import { SortSheet } from './components/Tasks/Sort';

registerSheet('filter-sheet', FilterSheet);
registerSheet('general-sheet', BottomSheet);
registerSheet('sort-sheet', SortSheet);

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
  }
}
