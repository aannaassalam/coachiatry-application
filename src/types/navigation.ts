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
  };
  Profile: undefined;
  BottomTabs: undefined;
  TaskDetails: undefined;
};
