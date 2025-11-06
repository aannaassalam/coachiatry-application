import { showMessage } from 'react-native-flash-message';

export const onError = (errors: Record<string, any>) => {
  const firstError = Object.values(errors)[0];

  if (firstError?.message) {
    showMessage({
      type: 'danger',
      message: 'Validation Error',
      description: firstError.message,
    });
  } else {
    showMessage({
      type: 'danger',
      message: 'Validation Error',
      description: 'Please complete all required fields',
    });
  }
};
