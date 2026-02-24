import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { getTodayDateKey } from "../../shared/utils/timezone.js";
import { NotFoundError, ConflictError } from "../../shared/errors/index.js";

function mapTask(task: {
  id: string;
  title: string;
  note: string;
  isCompleted: boolean;
  isImportant: boolean;
  dueDate: Date | null;
  reminderAt: Date | null;
  priority: "low" | "normal" | "high";
  order: number;
  listId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  list: { id: string; name: string; color: string } | null;
  steps: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    order: number;
    taskId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}) {
  return {
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    reminderAt: task.reminderAt ? task.reminderAt.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    inMyDay: true,
    steps: task.steps.map((step) => ({
      ...step,
      createdAt: step.createdAt.toISOString(),
      updatedAt: step.updatedAt.toISOString(),
    })),
  };
}

export async function getMyDayTasks(userId: string, date?: string) {
  const targetDate = date ?? getTodayDateKey();

  const entries = await prisma.myDayTask.findMany({
    where: {
      userId,
      date: targetDate,
    },
    include: {
      task: {
        include: {
          list: {
            select: { id: true, name: true, color: true },
          },
          steps: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    date: targetDate,
    tasks: entries.map((entry) => mapTask(entry.task)),
    count: entries.length,
  };
}

export async function addTaskToMyDay(userId: string, taskId: string, date?: string) {
  const targetDate = date ?? getTodayDateKey();

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) {
    throw new NotFoundError("Task");
  }

  try {
    const entry = await prisma.myDayTask.create({
      data: {
        taskId,
        userId,
        date: targetDate,
      },
    });

    return {
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("Task is already in My Day for this date");
    }
    throw error;
  }
}

export async function removeTaskFromMyDay(userId: string, taskId: string, date?: string) {
  const targetDate = date ?? getTodayDateKey();

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) {
    throw new NotFoundError("Task");
  }

  const entry = await prisma.myDayTask.findFirst({
    where: {
      userId,
      taskId,
      date: targetDate,
    },
    select: { id: true },
  });

  if (!entry) {
    throw new NotFoundError("My Day entry");
  }

  await prisma.myDayTask.delete({
    where: { id: entry.id },
  });

  return { deleted: entry.id, taskId, date: targetDate };
}

export async function getMyDayHistory(userId: string, limit = 30) {
  const history = await prisma.myDayTask.groupBy({
    by: ["date"],
    where: { userId },
    _count: { _all: true },
    orderBy: { date: "desc" },
    take: limit,
  });

  return history.map((item) => ({
    date: item.date,
    taskCount: item._count._all,
  }));
}
