import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import FloatingChatHost from '../components/Chat/FloatingChatHost';
import CoachChatScreen from '../screens/Chats/CoachChatRoom';
import GroupScreen from '../screens/Chats/GroupScreen';
import UserDetails from '../screens/Users/UserDetails';
import AddEditUser from '../screens/Users/AddEditUser';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = ({ hideFloatingChat = false }: { hideFloatingChat?: boolean }) => {
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
      {!hideFloatingChat && <FloatingChatHost />}
    </View>
  );
};

export default AppNavigator;
