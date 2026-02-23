import { Task, TaskDefaults, TodoList } from "../models";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface ApiErrorShape {
  message?: string;
  error?: {
    message?: string;
  };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = (await response.json()) as ApiErrorShape;
      if (errorBody?.message) {
        message = errorBody.message;
      } else if (errorBody?.error?.message) {
        message = errorBody.error.message;
      }
    } catch {
      // Keep fallback message if error response has no JSON body.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function fetchBootstrapData(): Promise<{
  lists: TodoList[];
  tasks: Task[];
}> {
  const [lists, tasks] = await Promise.all([
    requestJson<TodoList[]>("/lists"),
    requestJson<Task[]>("/tasks")
  ]);
  return { lists, tasks };
}

export async function createListApi(input: {
  name: string;
  color?: string;
}): Promise<TodoList> {
  return requestJson<TodoList>("/lists", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateListApi(listId: string, input: {
  name: string;
}): Promise<TodoList> {
  return requestJson<TodoList>(`/lists/${listId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function deleteListApi(listId: string): Promise<{
  deleted: string;
  reassignedTo: string;
}> {
  return requestJson<{ deleted: string; reassignedTo: string }>(`/lists/${listId}`, {
    method: "DELETE"
  });
}

export async function createTaskApi(input: {
  title: string;
  defaults: TaskDefaults;
}): Promise<Task> {
  return requestJson<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      listId: input.defaults.listId,
      isImportant: input.defaults.isImportant,
      inMyDay: input.defaults.inMyDay,
      dueDate: input.defaults.dueDate ?? null,
      note: input.defaults.note ?? "",
      reminderAt: input.defaults.reminderAt ?? null,
      priority: input.defaults.priority ?? "normal"
    })
  });
}

export async function updateTaskApi(
  taskId: string,
  patch: Partial<
    Pick<
      Task,
      "title" | "note" | "dueDate" | "reminderAt" | "priority" | "isImportant" | "inMyDay" | "isCompleted"
    >
  >
): Promise<Task> {
  return requestJson<Task>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}
