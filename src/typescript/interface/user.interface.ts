export interface User {
  id: string;
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  photo: string;
  role: string;
  shareId: string;
  sharedViewers: User[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
