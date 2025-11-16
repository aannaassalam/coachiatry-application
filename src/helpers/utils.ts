import { showMessage } from 'react-native-flash-message';
import { Filter } from '../typescript/interface/common.interface';

export function sanitizeFilters(values: Filter[]): Filter[] {
  return values.filter(
    f => f.selectedKey && f.selectedOperator && f.selectedValue,
  );
}

export const onError = (errors: Record<string, any>) => {
  const firstError = Object.values(errors)[0];
  const secondError = Object.values(errors)[0][0]?.title;

  if (firstError?.message) {
    showMessage({
      type: 'danger',
      message: 'Validation Error',
      description: firstError.message,
    });
  } else if (secondError?.message) {
    showMessage({
      type: 'danger',
      message: 'Validation Error',
      description: secondError.message,
    });
  } else {
    showMessage({
      type: 'danger',
      message: 'Validation Error',
      description: 'Please complete all required fields',
    });
  }
};

export const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};
