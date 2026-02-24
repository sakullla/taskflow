export type Priority = "low" | "normal" | "high";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  locale: string;
  theme: string;
}

export interface List {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  isArchived: boolean;
  order: number;
  userId: string;
  taskCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Step {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  note: string;
  isCompleted: boolean;
  isImportant: boolean;
  inMyDay?: boolean;
  dueDate: string | null;
  reminderAt: string | null;
  priority: Priority;
  order: number;
  listId: string;
  list?: {
    id: string;
    name: string;
    color: string;
  };
  steps: Step[];
  createdAt: string;
  updatedAt: string;
}

export interface MyDayEntry {
  date: string;
  tasks: Task[];
  count: number;
}

export type ViewType = "myDay" | "important" | "planned" | "all" | "list" | "search";
