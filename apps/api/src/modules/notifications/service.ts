import { prisma } from "../../config/db.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { getDateKey, getTodayDateKey } from "../../shared/utils/timezone.js";

export interface NotificationInput {
  title: string;
  message: string;
  type?: "task_reminder" | "task_due" | "system";
  taskId?: string;
}

function mapNotification(notification: {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "task_reminder" | "task_due" | "system";
  isRead: boolean;
  taskId: string | null;
  createdAt: Date;
}) {
  return {
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function getNotifications(userId: string, unreadOnly = false) {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return notifications.map(mapNotification);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function createNotification(
  userId: string,
  data: NotificationInput
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title: data.title,
      message: data.message,
      type: data.type ?? "system",
      isRead: false,
      taskId: data.taskId ?? null,
    },
  });

  return mapNotification(notification);
}

export async function markAsRead(id: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw new NotFoundError("Notification");
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return mapNotification(updated);
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  });
}

export async function deleteNotification(id: string, userId: string): Promise<void> {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!notification) {
    throw new NotFoundError("Notification");
  }

  await prisma.notification.delete({
    where: { id },
  });
}

export async function checkTaskReminders(): Promise<void> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      isCompleted: false,
      reminderAt: {
        gte: fiveMinutesAgo,
        lte: fiveMinutesFromNow,
      },
    },
    select: {
      id: true,
      userId: true,
      title: true,
    },
  });

  for (const task of tasks) {
    const existing = await prisma.notification.findFirst({
      where: {
        taskId: task.id,
        type: "task_reminder",
        createdAt: { gt: oneHourAgo },
      },
      select: { id: true },
    });

    if (existing) continue;

    await createNotification(task.userId, {
      title: "Task Reminder",
      message: `Reminder: ${task.title}`,
      type: "task_reminder",
      taskId: task.id,
    });
  }
}

export async function checkDueTasks(): Promise<void> {
  const today = getTodayDateKey();
  const tasks = await prisma.task.findMany({
    where: {
      isCompleted: false,
      dueDate: { not: null },
    },
    select: {
      id: true,
      userId: true,
      title: true,
      dueDate: true,
    },
  });

  for (const task of tasks) {
    if (!task.dueDate || getDateKey(task.dueDate) !== today) continue;

    const existing = await prisma.notification.findFirst({
      where: {
        taskId: task.id,
        type: "task_due",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (existing && getDateKey(existing.createdAt) === today) {
      continue;
    }

    await createNotification(task.userId, {
      title: "Task Due Today",
      message: `"${task.title}" is due today`,
      type: "task_due",
      taskId: task.id,
    });
  }
}
