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
  ClientDetails: { userId: string };
  ChatRoom: { roomId: string };
};
