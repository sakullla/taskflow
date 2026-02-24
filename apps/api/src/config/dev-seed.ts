import { env } from "./env.js";
import { prisma } from "./db.js";
import { getTodayDateKey } from "../shared/utils/timezone.js";
import { hashPassword } from "../shared/utils/password.js";

const DEMO_EMAIL = "demo@example.com";

export async function seedDevelopmentDataIfNeeded(): Promise<void> {
  if (env.NODE_ENV === "production") {
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });

  if (existingUser) {
    return;
  }

  const now = new Date();
  const today = getTodayDateKey();
  const password = await hashPassword("password123");

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: DEMO_EMAIL,
        password,
        name: "Demo User",
        role: "admin",
        isActive: true,
        locale: "zh-CN",
        theme: "light",
        dueDateReminders: true,
        weeklyDigest: false,
      },
    });

    const defaultList = await tx.list.create({
      data: {
        name: "Tasks",
        color: "#3b82f6",
        isDefault: true,
        isArchived: false,
        order: 0,
        userId: user.id,
      },
    });

    const workList = await tx.list.create({
      data: {
        name: "Work",
        color: "#8b5cf6",
        isDefault: false,
        isArchived: false,
        order: 1,
        userId: user.id,
      },
    });

    const task = await tx.task.create({
      data: {
        title: "Complete project planning document",
        note: "Include technical architecture and delivery plan.",
        isCompleted: false,
        isImportant: true,
        dueDate: now,
        priority: "high",
        order: 0,
        userId: user.id,
        listId: workList.id,
      },
    });

    await tx.task.create({
      data: {
        title: "Buy groceries",
        note: "Milk, bread, eggs",
        isCompleted: false,
        isImportant: false,
        priority: "normal",
        order: 1,
        userId: user.id,
        listId: defaultList.id,
      },
    });

    await tx.myDayTask.create({
      data: {
        taskId: task.id,
        userId: user.id,
        date: today,
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to TaskFlow",
        message: "You will receive reminders and due task notifications here.",
        type: "system",
        isRead: false,
      },
    });
  });

  console.log("Seeded development database with demo data");
}
