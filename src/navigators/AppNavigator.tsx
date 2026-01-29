import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage } from '../helpers/utils';
import ChatScreen from '../screens/Chats/ChatRoom';
import ClientDetails from '../screens/Clients/ClientDetails';
import DocumentEditor from '../screens/Documents/DocumentEditor';
import EditProfile from '../screens/Profile/EditProfile';
import Profile from '../screens/Profile/Profile';
import AddEditTask from '../screens/Tasks/AddEditTask';
import TaskDetailsScreen from '../screens/Tasks/TaskDetails';
import { theme } from '../theme';
import { AppStackParamList } from '../types/navigation';
import BottomNavigator from './BottomNavigator';
import { navigate, navigationRef } from './navigationService';
import notifee, { EventType } from '@notifee/react-native';
import CoachChatScreen from '../screens/Chats/CoachChatRoom';
import GroupScreen from '../screens/Chats/GroupScreen';
import UserDetails from '../screens/Users/UserDetails';
import AddEditUser from '../screens/Users/AddEditUser';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  const insets = useSafeAreaInsets();

  // useEffect(() => {
  //   const unsubscribe = messaging().onMessage(async remoteMessage => {
  //     console.log('FG FCM Message:', remoteMessage);

  //     await notifee.displayNotification({
  //       title: remoteMessage.notification?.title,
  //       body: remoteMessage.notification?.body,
  //       data: remoteMessage.data,
  //       android: {
  //         channelId: 'chat-messages',
  //         pressAction: {
  //           id: 'open-chat', // required to detect the click
  //         },
  //         style: {
  //           type: AndroidStyle.MESSAGING,
  //           person: {
  //             name: remoteMessage?.data?.senderName.toString() || '',
  //             icon: remoteMessage?.data?.senderImage as string,
  //           },
  //           messages: [
  //             {
  //               text: remoteMessage.notification?.body || '',
  //               timestamp: Date.now(), // Now
  //             },
  //           ],
  //         },
  //       },
  //     });
  //   });

  //   return unsubscribe;
  // }, []);
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      const { pressAction, notification } = detail;

      if (type === EventType.PRESS && pressAction?.id === 'open-chat') {
        const data = notification?.data;

        if (data?.chatId) {
          navigate('ChatRoom', { roomId: data.chatId as string });
        }
      }
    });

    return unsubscribe;
  }, []);

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
        <Stack.Screen name="AddEditTask" component={AddEditTask} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="ClientDetails" component={ClientDetails} />
        <Stack.Screen name="UserDetails" component={UserDetails} />
        <Stack.Screen name="ChatRoom" component={ChatScreen} />
        <Stack.Screen name="GroupScreen" component={GroupScreen} />
        <Stack.Screen name="CoachChatRoom" component={CoachChatScreen} />
        <Stack.Screen name="AddEditUser" component={AddEditUser} />
      </Stack.Navigator>
    </View>
  );
};

export default AppNavigator;
