// src/navigators/navigationService.ts
import { createNavigationContainerRef } from '@react-navigation/native';
import { AppStackParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

/**
 * Helper to navigate without importing the ref everywhere
 * and ensures the navigator is ready before calling navigate.
 */
export function navigate(name: keyof AppStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    // You can decide to log this or simply ignore it
    console.warn('Attempted to navigate before navigation container was ready');
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}
