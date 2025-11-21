export const baseUrl = process.env.NEXT_APP_BASE_URL;
export const baseUrlApi = `https://backend.coachiatry.com/api/v1`;
export const baseUrlMedia = process.env.NEXT_APP_BASE_URL;

// api doc => https://militarymoves-admin.dedicateddevelopers.us/apidoc

export const mediaUrl = (url: string) => {
  return `${baseUrlMedia}/${url}`;
};

export const endpoints = {
  common: {
    search: '/search',
  },
  auth: {
    signup: '/auth/signup',
    login: '/auth/login',
    googleAuth: '/auth/google-auth',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    updatePassword: '/auth/update-password',
  },
  document: {
    getAll: '/documents',
    add: '/documents',
    coachAccess: '/documents/coach',
    addCoach: '/documents/coach',
    getOne: (documentId: string) => `/documents/${documentId}`,
    edit: (documentId: string) => `/documents/${documentId}`,
    delete: (documentId: string) => `/documents/${documentId}`,
    shared: (shareId: string) => `/documents/share/${shareId}`,
  },
  category: {
    getAll: '/categories',
    add: '/categories',
    getAllCoach: (userId: string) => `/categories/coach/${userId}`,
    addCoach: (userId: string) => `/categories/coach/${userId}`,
  },
  status: {
    getAll: '/statuses',
    add: '/statuses',
    getAllCoach: (userId: string) => `/statuses/coach/${userId}`,
    addCoach: (userId: string) => `/statuses/coach/${userId}`,
  },
  transcriptions: {
    getAllTranscriptions: '/transcriptions',
    getAllTranscriptionsByCoach: '/transcriptions/coach',
    getTranscription: (id: string) => `/transcriptions/${id}`,
    deleteTranscription: (id: string) => `/transcriptions/${id}`,
    deleteTranscriptionByCoach: (id: string) => `/transcriptions/coach/${id}`,
  },
  task: {
    getAll: '/task',
    getAllCoach: '/task/coach',
    post: '/task',
    postCoach: '/task/coach',
    importBulkTasks: '/task/import-bulk-tasks',
    getOne: (taskId: string) => `/task/${taskId}`,
    edit: (taskId: string) => `/task/${taskId}`,
    delete: (taskId: string) => `/task/${taskId}`,
    moveToStatus: (taskId: string) => `/task/move-to-status/${taskId}`,
    markSubtaskAsComplete: (taskId: string, subtaskId: string) =>
      `/task/completed/${taskId}/${subtaskId}`,
    shared: (shareId: string) => `/task/shared/${shareId}`,
  },
  user: {
    getProfile: '/user/me',
    updateProfile: '/user/me',
    updateProfilePicture: '/user/me/update-profile-picture',
    getAllWatching: '/user/get-all-watching',
    suggestUsers: '/user/suggestions',
    addWatchers: '/user/add-watchers',
    userByIds: '/user/user-by-ids',
    userById: (userId: string) => `/user/user-by-id/${userId}`,
    shared: (shareId: string) => `/user/share/${shareId}`,
    revokeAccess: (viewerId: string) => `/user/share/${viewerId}`,
  },
  chat: {
    getConversations: '/chat',
    getConversation: (roomId: string) => `/chat/${roomId}`,
    getConversationsByCoach: (userId: string) => `/chat/coach/${userId}`,
    getConversationByCoach: (roomId: string) => `/chat/coach/room/${roomId}`,
    createGroup: '/chat/group',
    editGroup: '/chat/group/edit',
  },
  messages: {
    getScheduleMessages: '/message/schedule',
    getScheduleMessagesByCoach: (userId: string) =>
      `/message/schedule/coach/${userId}`,
    scheduleMessage: '/message/schedule',
    editScheduleMessage: (messageId: string) =>
      `/message/schedule/${messageId}`,
    getMessages: (room: string) => `/message/${room}`,
  },
  ai: {
    chatWithAi: '/ai',
    transcriptAi: '/ai/transcript',
  },
  coach: {
    getClients: '/coach/clients',
  },
};
