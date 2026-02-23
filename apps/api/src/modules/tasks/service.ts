import { db, generateId, now } from "../../config/db.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import type { CreateTaskInput, UpdateTaskInput, TaskQuery } from "./schemas.js";
import type { Task, Step } from "../../config/db-simple.js";

// Extended task type with steps
interface TaskWithSteps extends Task {
  steps: Array<Pick<Step, "id" | "title" | "isCompleted" | "order">>;
}

export async function getTasks(userId: string, query: TaskQuery) {
  const tasks: Array<typeof db.tasks extends Map<string, infer U> ? U : never> = [];

  for (const task of db.tasks.values()) {
    if (task.userId !== userId) continue;

    if (query.listId && task.listId !== query.listId) continue;
    if (query.isCompleted !== undefined && task.isCompleted !== (query.isCompleted === "true")) continue;
    if (query.isImportant !== undefined && task.isImportant !== (query.isImportant === "true")) continue;
    if (query.dueDate) {
      const taskDate = task.dueDate?.split("T")[0];
      if (taskDate !== query.dueDate) continue;
    }
    if (query.search) {
      const search = query.search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(search);
      const matchNote = task.note.toLowerCase().includes(search);
      if (!matchTitle && !matchNote) continue;
    }

    tasks.push(task);
  }

  // Sort by isCompleted asc, isImportant desc, createdAt desc
  tasks.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    if (a.isImportant !== b.isImportant) return b.isImportant ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return tasks.map(enrichTaskWithSteps);
}

function enrichTaskWithSteps(task: Task): TaskWithSteps {
  const steps: Array<Pick<Step, "id" | "title" | "isCompleted" | "order">> = [];
  for (const step of db.steps.values()) {
    if (step.taskId === task.id) {
      steps.push({
        id: step.id,
        title: step.title,
        isCompleted: step.isCompleted,
        order: step.order,
      });
    }
  }
  steps.sort((a, b) => a.order - b.order);

  return { ...task, steps };
}

export async function getTaskById(id: string, userId: string) {
  const task = db.tasks.get(id);

  if (!task || task.userId !== userId) {
    throw new NotFoundError("Task");
  }

  return enrichTaskWithSteps(task);
}

export async function createTask(userId: string, data: CreateTaskInput) {
  // Validate list exists
  let listId = data.listId;

  if (listId) {
    const list = db.lists.get(listId);
    if (!list || list.userId !== userId) {
      throw new NotFoundError("List");
    }
  } else {
    // Use default list
    let defaultList: (typeof db.lists extends Map<string, infer U> ? U : never) | undefined = undefined;
    for (const list of db.lists.values()) {
      if (list.userId === userId && list.isDefault) {
        defaultList = list;
        break;
      }
    }
    if (!defaultList) {
      throw new ValidationError("No default list found");
    }
    listId = defaultList.id;
  }

  const taskId = generateId();
  const task = {
    id: taskId,
    title: data.title,
    note: data.note ?? "",
    listId: listId!,
    userId,
    isCompleted: false,
    isImportant: data.isImportant ?? false,
    dueDate: data.dueDate ?? null,
    reminderAt: data.reminderAt ?? null,
    priority: data.priority ?? "normal",
    order: 0,
    createdAt: now(),
    updatedAt: now(),
  };

  db.tasks.set(taskId, task);
  return enrichTaskWithSteps(task);
}

export async function updateTask(id: string, userId: string, data: UpdateTaskInput) {
  const task = db.tasks.get(id);

  if (!task || task.userId !== userId) {
    throw new NotFoundError("Task");
  }

  // Validate list if changing
  if (data.listId && data.listId !== task.listId) {
    const list = db.lists.get(data.listId);
    if (!list || list.userId !== userId) {
      throw new NotFoundError("List");
    }
  }

  const updated = {
    ...task,
    ...(data.title !== undefined && { title: data.title }),
    ...(data.note !== undefined && { note: data.note }),
    ...(data.listId !== undefined && { listId: data.listId }),
    ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
    ...(data.isImportant !== undefined && { isImportant: data.isImportant }),
    ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
    ...(data.reminderAt !== undefined && { reminderAt: data.reminderAt }),
    ...(data.priority !== undefined && { priority: data.priority }),
    ...(data.order !== undefined && { order: data.order }),
    updatedAt: now(),
  };

  db.tasks.set(id, updated);
  return enrichTaskWithSteps(updated);
}

export async function deleteTask(id: string, userId: string) {
  const task = db.tasks.get(id);

  if (!task || task.userId !== userId) {
    throw new NotFoundError("Task");
  }

  // Delete related myDayTasks
  for (const [key, myDayTask] of db.myDayTasks) {
    if (myDayTask.taskId === id) {
      db.myDayTasks.delete(key);
    }
  }

  // Delete related steps
  for (const [key, step] of db.steps) {
    if (step.taskId === id) {
      db.steps.delete(key);
    }
  }

  db.tasks.delete(id);
  return { deleted: id };
}

export async function getImportantTasks(userId: string) {
  return getTasks(userId, { isImportant: "true" });
}

export async function getPlannedTasks(userId: string) {
  const tasks: TaskWithSteps[] = [];

  for (const task of db.tasks.values()) {
    if (task.userId === userId && !task.isCompleted && task.dueDate) {
      tasks.push(enrichTaskWithSteps(task));
    }
  }

  tasks.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return tasks;
}
