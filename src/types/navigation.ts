export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type AppStackParamList = {
  Tasks: undefined;
  Chats: undefined;
  Documents: undefined;
  DocumentEditor: {
    mode?: 'edit' | 'view' | 'add';
    documentId?: string;
  };
  Profile: undefined;
  BottomTabs: undefined;
  TaskDetails: { taskId: string };
  AddEditTask: {
    taskId?: string;
    predefinedStatus?: string;
    predefinedDueDate?: string;
  };
  EditProfile: undefined;
  ClientDetails: { userId: string };
  ChatRoom: { roomId: string };
};
