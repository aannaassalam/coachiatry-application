import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Text, View } from 'react-native';
import { theme } from '../theme';
import { fontSize, spacing } from '../utils';

import TaskList from '../screens/Tasks/TaskList';
import ChatList from '../screens/Chats/ChatList';
import Documents from '../screens/Documents/Documents';
import Dashboard from '../screens/Dashboard/Dashboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChatActive,
  ChatInactive,
  DashboardActive,
  DashboardInactive,
  DocumentActive,
  DocumentInactive,
  TasksActive,
  TasksInactive,
} from '../assets';

export type AppTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Chats: undefined;
  Documents: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

const BottomNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.gray[100],
          elevation: 5,
          height: spacing(60),
          paddingBottom: spacing(6),
          paddingTop: spacing(6),
        },
        tabBarLabel: ({ focused }) => (
          <Text
            style={{
              fontSize: fontSize(12),
              color: focused ? theme.colors.primary : theme.colors.gray[500],
              fontFamily: theme.fonts.lato.regular,
              fontWeight: focused ? '600' : '400',
              marginTop: spacing(2),
            }}
          >
            {getLabel(route.name)}
          </Text>
        ),
        tabBarIcon: ({ focused }) => getIcon(route.name, focused),
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Tasks" component={TaskList} />
      <Tab.Screen name="Chats" component={ChatList} />
      <Tab.Screen name="Documents" component={Documents} />
    </Tab.Navigator>
  );
};

export default BottomNavigator;

const getLabel = (routeName: string) => {
  switch (routeName) {
    case 'Dashboard':
      return 'Dashboard';
    case 'Tasks':
      return 'My Tasks';
    case 'Chats':
      return 'Chat';
    case 'Documents':
      return 'Documents';
    default:
      return routeName;
  }
};

const getIcon = (routeName: string, focused: boolean) => {
  const color = focused ? theme.colors.primary : theme.colors.gray[500];

  const size = fontSize(20);

  switch (routeName) {
    case 'Dashboard':
      return focused ? <DashboardActive /> : <DashboardInactive />;

    case 'Tasks':
      return focused ? <TasksActive /> : <TasksInactive />;

    case 'Chats':
      return focused ? <ChatActive /> : <ChatInactive />;

    case 'Documents':
      return focused ? <DocumentActive /> : <DocumentInactive />;

    default:
      return <Ionicons name="ellipse-outline" size={size} color={color} />;
  }
};
