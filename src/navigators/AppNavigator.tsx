import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList, AuthStackParamList } from '../types/navigation';
import BottomNavigator from './BottomNavigator';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DocumentEditor from '../screens/Documents/DocumentEditor';
import TaskDetailsScreen from '../screens/Tasks/TaskDetails';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Stack.Navigator
      initialRouteName="BottomTabs"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="BottomTabs" component={BottomNavigator} />
      <Stack.Screen name="DocumentEditor" component={DocumentEditor} />
      <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
