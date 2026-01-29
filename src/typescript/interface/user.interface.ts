export interface User {
  id: string;
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  photo: string;
  role: 'admin' | 'manager' | 'coach' | 'user';
  shareId: string;
  sharedViewers: User[];
  assignedCoach: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
