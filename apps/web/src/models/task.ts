export type TaskId = string;

export interface Task {
  id: TaskId;
  listId: string;
  title: string;
  isCompleted: boolean;
  isImportant: boolean;
  inMyDay: boolean;
  dueDate: string | null;
  createdAt: string;
}

export interface TaskDefaults {
  listId?: string;
  isImportant?: boolean;
  inMyDay?: boolean;
  dueDate?: string | null;
}
