import type { Priority, Task } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { getDateKey, getTodayDateKey } from "../../shared/utils/timezone.js";
import type { CreateTaskInput, UpdateTaskInput, TaskQuery } from "./schemas.js";

function mapTask(task: Task & { steps: Array<{ id: string; title: string; isCompleted: boolean; order: number; createdAt: Date; updatedAt: Date }> }) {
  return {
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    reminderAt: task.reminderAt ? task.reminderAt.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    steps: task.steps.map((step) => ({
      ...step,
      createdAt: step.createdAt.toISOString(),
      updatedAt: step.updatedAt.toISOString(),
    })),
  };
}

async function ensureDueTodayNotification(task: {
  id: string;
  title: string;
  userId: string;
  isCompleted: boolean;
  dueDate: Date | null;
}) {
  if (task.isCompleted || !task.dueDate) return;

  const today = getTodayDateKey();
  if (getDateKey(task.dueDate) !== today) return;

  const existing = await prisma.notification.findFirst({
    where: {
      taskId: task.id,
      type: "task_due",
      createdAt: {
        gte: new Date(`${today}T00:00:00.000Z`),
      },
    },
    select: { id: true },
  });

  if (existing) return;

  await prisma.notification.create({
    data: {
      userId: task.userId,
      title: "Task Due Today",
      message: `"${task.title}" is due today`,
      type: "task_due",
      isRead: false,
      taskId: task.id,
    },
  });
}

export async function getTasks(userId: string, query: TaskQuery) {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      ...(query.listId ? { listId: query.listId } : {}),
      ...(query.isCompleted !== undefined
        ? { isCompleted: query.isCompleted === "true" }
        : {}),
      ...(query.isImportant !== undefined
        ? { isImportant: query.isImportant === "true" }
        : {}),
    },
    include: {
      steps: {
        select: {
          id: true,
          title: true,
          isCompleted: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: [{ isCompleted: "asc" }, { isImportant: "desc" }, { createdAt: "desc" }],
  });

  let filtered = tasks;

  if (query.dueDate) {
    filtered = filtered.filter((task) => task.dueDate && getDateKey(task.dueDate) === query.dueDate);
  }

  if (query.search) {
    const search = query.search.toLowerCase();
    filtered = filtered.filter((task) => (
      task.title.toLowerCase().includes(search) ||
      task.note.toLowerCase().includes(search)
    ));
  }

  return filtered.map(mapTask);
}

export async function getTaskById(id: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id, userId },
    include: {
      steps: {
        select: {
          id: true,
          title: true,
          isCompleted: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!task) {
    throw new NotFoundError("Task");
  }

  return mapTask(task);
}

export async function createTask(userId: string, data: CreateTaskInput) {
  let listId = data.listId;

  if (listId) {
    const list = await prisma.list.findFirst({
      where: { id: listId, userId },
      select: { id: true },
    });
    if (!list) {
      throw new NotFoundError("List");
    }
  } else {
    const defaultList = await prisma.list.findFirst({
      where: {
        userId,
        isDefault: true,
      },
      select: { id: true },
    });
    if (!defaultList) {
      throw new ValidationError("No default list found");
    }
    listId = defaultList.id;
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      note: data.note ?? "",
      listId,
      userId,
      isCompleted: false,
      isImportant: data.isImportant ?? false,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
      priority: (data.priority ?? "normal") as Priority,
      order: 0,
    },
    include: {
      steps: {
        select: {
          id: true,
          title: true,
          isCompleted: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  await ensureDueTodayNotification(task);
  return mapTask(task);
}

export async function updateTask(id: string, userId: string, data: UpdateTaskInput) {
  const task = await prisma.task.findFirst({
    where: { id, userId },
    select: { id: true, userId: true, title: true, isCompleted: true, dueDate: true, listId: true },
  });

  if (!task) {
    throw new NotFoundError("Task");
  }

  if (data.listId && data.listId !== task.listId) {
    const list = await prisma.list.findFirst({
      where: { id: data.listId, userId },
      select: { id: true },
    });
    if (!list) {
      throw new NotFoundError("List");
    }
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.note !== undefined ? { note: data.note } : {}),
      ...(data.listId !== undefined ? { listId: data.listId } : {}),
      ...(data.isCompleted !== undefined ? { isCompleted: data.isCompleted } : {}),
      ...(data.isImportant !== undefined ? { isImportant: data.isImportant } : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
        : {}),
      ...(data.reminderAt !== undefined
        ? { reminderAt: data.reminderAt ? new Date(data.reminderAt) : null }
        : {}),
      ...(data.priority !== undefined ? { priority: data.priority as Priority } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
    },
    include: {
      steps: {
        select: {
          id: true,
          title: true,
          isCompleted: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  await ensureDueTodayNotification(updated);
  return mapTask(updated);
}

export async function deleteTask(id: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!task) {
    throw new NotFoundError("Task");
  }

  await prisma.$transaction([
    prisma.myDayTask.deleteMany({ where: { taskId: id } }),
    prisma.step.deleteMany({ where: { taskId: id } }),
    prisma.notification.deleteMany({ where: { taskId: id } }),
    prisma.task.delete({ where: { id } }),
  ]);

  return { deleted: id };
}

export async function getImportantTasks(userId: string) {
  return getTasks(userId, { isImportant: "true" });
}

export async function getPlannedTasks(userId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      isCompleted: false,
      dueDate: { not: null },
    },
    include: {
      steps: {
        select: {
          id: true,
          title: true,
          isCompleted: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: [{ dueDate: "asc" }],
  });

  return tasks.map(mapTask);
}
