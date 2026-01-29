export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  VerifyOTP: { email: string };
  ForgotPassword: undefined;
};

export type AppStackParamList = {
  Tasks: undefined;
  Chats: undefined;
  Documents: undefined;
  DocumentEditor: {
    mode?: 'edit' | 'view' | 'add';
    documentId?: string;
    userId?: string;
    title?: string;
    tag?: string;
    content?: string;
  };
  Profile: undefined;
  BottomTabs: undefined;
  TaskDetails: { taskId: string; userId?: string };
  AddEditTask: {
    taskId?: string;
    predefinedStatus?: string;
    predefinedDueDate?: string;
    userId?: string;
  };
  EditProfile: undefined;
  ClientDetails: { userId: string; fromUsersScreen?: boolean };
  ChatRoom: { roomId: string };
  GroupScreen: { roomId?: string; byCoach?: boolean };
  CoachChatRoom: { roomId: string; userId: string };
  UserDetails: { id: string };
  AddEditUser: { id?: string };
};
