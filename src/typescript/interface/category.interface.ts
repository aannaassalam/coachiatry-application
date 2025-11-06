export interface Category {
  _id: string;
  title: string;
  color: {
    bg: string;
    text: string;
  };
  public?: boolean;
  user: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
