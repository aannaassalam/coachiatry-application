import { registerSheet, SheetDefinition } from 'react-native-actions-sheet';
import FilterSheet from './components/Tasks/Filter';
import BottomSheet from './components/ui/BottomSheet';
import { ReactNode } from 'react';

registerSheet('filter-sheet', FilterSheet);
registerSheet('general-sheet', BottomSheet);

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module 'react-native-actions-sheet' {
  interface Sheets {
    'filter-sheet': SheetDefinition<{
      payload: {
        view: string;
        filterMode: string;
        filters: {
          selectedKey: string;
          selectedOperator: string;
          selectedValue: string;
        }[];
        handleFilterProgress: (value: string) => void;
        removeFilter: (id: number) => void;
      };
    }>;
    'general-sheet': SheetDefinition<{
      payload: {
        children: ReactNode;
        paddingBottom?: number;
      };
    }>;
  }
}
