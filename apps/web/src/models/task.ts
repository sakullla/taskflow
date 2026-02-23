export type TaskId = string;
export type TaskPriority = "low" | "normal" | "high";

export interface Task {
  id: TaskId;
  listId: string;
  title: string;
  note: string;
  isCompleted: boolean;
  isImportant: boolean;
  inMyDay: boolean;
  dueDate: string | null;
  reminderAt: string | null;
  priority: TaskPriority;
  createdAt: string;
}

export interface TaskDefaults {
  listId?: string;
  isImportant?: boolean;
  inMyDay?: boolean;
  dueDate?: string | null;
  note?: string;
  reminderAt?: string | null;
  priority?: TaskPriority;
}
