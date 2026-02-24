import { db } from "../../config/db-simple.js";
import { NotFoundError } from "../../shared/errors/index.js";
import type { Notification } from "../../config/db-simple.js";

export interface NotificationInput {
  title: string;
  message: string;
  type?: "task_reminder" | "task_due" | "system";
  taskId?: string;
}

export async function getNotifications(userId: string, unreadOnly = false) {
  const notifications: Notification[] = [];

  for (const notification of db.notifications.values()) {
    if (notification.userId !== userId) continue;
    if (unreadOnly && notification.isRead) continue;
    notifications.push(notification);
  }

  // Sort by createdAt desc
  notifications.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return notifications;
}

export async function getUnreadCount(userId: string): Promise<number> {
  let count = 0;
  for (const notification of db.notifications.values()) {
    if (notification.userId === userId && !notification.isRead) {
      count++;
    }
  }
  return count;
}

export async function createNotification(
  userId: string,
  data: NotificationInput
): Promise<Notification> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const notification: Notification = {
    id,
    userId,
    title: data.title,
    message: data.message,
    type: data.type || "system",
    isRead: false,
    taskId: data.taskId || null,
    createdAt: now,
  };

  db.notifications.set(id, notification);
  return notification;
}

export async function markAsRead(id: string, userId: string): Promise<Notification> {
  const notification = db.notifications.get(id);

  if (!notification || notification.userId !== userId) {
    throw new NotFoundError("Notification");
  }

  const updated = { ...notification, isRead: true };
  db.notifications.set(id, updated);

  return updated;
}

export async function markAllAsRead(userId: string): Promise<void> {
  for (const [id, notification] of db.notifications) {
    if (notification.userId === userId && !notification.isRead) {
      db.notifications.set(id, { ...notification, isRead: true });
    }
  }
}

export async function deleteNotification(id: string, userId: string): Promise<void> {
  const notification = db.notifications.get(id);

  if (!notification || notification.userId !== userId) {
    throw new NotFoundError("Notification");
  }

  db.notifications.delete(id);
}

// Check for tasks with reminders due
export async function checkTaskReminders(): Promise<void> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  for (const task of db.tasks.values()) {
    if (task.isCompleted) continue;
    if (!task.reminderAt) continue;

    const reminderTime = new Date(task.reminderAt);

    // Check if reminder is within the window
    if (reminderTime >= fiveMinutesAgo && reminderTime <= fiveMinutesFromNow) {
      // Check if notification already exists
      let exists = false;
      for (const notification of db.notifications.values()) {
        if (
          notification.taskId === task.id &&
          notification.type === "task_reminder" &&
          notification.createdAt > new Date(now.getTime() - 60 * 60 * 1000).toISOString()
        ) {
          exists = true;
          break;
        }
      }

      if (!exists) {
        await createNotification(task.userId, {
          title: "Task Reminder",
          message: `Reminder: ${task.title}`,
          type: "task_reminder",
          taskId: task.id,
        });
      }
    }
  }
}

// Check for tasks due today
export async function checkDueTasks(): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  for (const task of db.tasks.values()) {
    if (task.isCompleted) continue;
    if (!task.dueDate) continue;

    const taskDueDate = task.dueDate.split("T")[0];

    if (taskDueDate === today) {
      // Check if notification already sent today
      let exists = false;
      const todayStart = today + "T00:00:00.000Z";

      for (const notification of db.notifications.values()) {
        if (
          notification.taskId === task.id &&
          notification.type === "task_due" &&
          notification.createdAt >= todayStart
        ) {
          exists = true;
          break;
        }
      }

      if (!exists) {
        await createNotification(task.userId, {
          title: "Task Due Today",
          message: `"${task.title}" is due today`,
          type: "task_due",
          taskId: task.id,
        });
      }
    }
  }
}
