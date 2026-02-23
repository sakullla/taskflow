export type ListId = string;

export interface TodoList {
  id: ListId;
  name: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}
