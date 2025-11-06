export interface Status {
  _id: string;
  title: string;
  color: {
    bg: string;
    text: string;
  };
  priority?: number;
  public?: boolean;
  user: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
