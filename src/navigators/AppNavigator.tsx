import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList, AuthStackParamList } from '../types/navigation';
import BottomNavigator from './BottomNavigator';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DocumentEditor from '../screens/Documents/DocumentEditor';
import TaskDetailsScreen from '../screens/Tasks/TaskDetails';
import Profile from '../screens/Profile/Profile';
import EditProfile from '../screens/Profile/EditProfile';
import { theme } from '../theme';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        { flex: 1, backgroundColor: theme.colors.white },
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <Stack.Navigator
        initialRouteName="BottomTabs"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="BottomTabs" component={BottomNavigator} />
        <Stack.Screen name="DocumentEditor" component={DocumentEditor} />
        <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
      </Stack.Navigator>
    </View>
  );
};

export default AppNavigator;
