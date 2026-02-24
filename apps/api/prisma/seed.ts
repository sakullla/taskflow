import { PrismaClient, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Create default user
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      password: hashedPassword,
      name: "Demo User",
      role: "admin",
      isActive: true,
      locale: "zh-CN",
      dueDateReminders: true,
      weeklyDigest: false,
    },
  });
  console.log(`✅ Created user: ${user.email}`);

  // Create default list
  const defaultList = await prisma.list.upsert({
    where: {
      id: "default-list-id"
    },
    update: {},
    create: {
      id: "default-list-id",
      name: "任务",
      color: "#3b82f6",
      isDefault: true,
      userId: user.id,
    },
  });
  console.log(`✅ Created default list: ${defaultList.name}`);

  // Create work list
  const workList = await prisma.list.upsert({
    where: {
      id: "work-list-id"
    },
    update: {},
    create: {
      id: "work-list-id",
      name: "工作",
      color: "#8b5cf6",
      userId: user.id,
    },
  });
  console.log(`✅ Created list: ${workList.name}`);

  // Create sample tasks
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const tasks = await Promise.all([
    prisma.task.upsert({
      where: { id: "task-1" },
      update: {},
      create: {
        id: "task-1",
        title: "完成项目规划文档",
        note: "包含技术架构设计和开发计划",
        isImportant: true,
        priority: Priority.high,
        dueDate: today,
        userId: user.id,
        listId: workList.id,
      },
    }),
    prisma.task.upsert({
      where: { id: "task-2" },
      update: {},
      create: {
        id: "task-2",
        title: "购买生活用品",
        note: "牛奶、面包、鸡蛋",
        priority: Priority.normal,
        userId: user.id,
        listId: defaultList.id,
      },
    }),
    prisma.task.upsert({
      where: { id: "task-3" },
      update: {},
      create: {
        id: "task-3",
        title: "学习新技术",
        note: "阅读 Fastify 文档",
        isCompleted: true,
        priority: Priority.low,
        userId: user.id,
        listId: defaultList.id,
      },
    }),
  ]);
  console.log(`✅ Created ${tasks.length} tasks`);

  // Add task to My Day
  const myDayTask = await prisma.myDayTask.upsert({
    where: {
      taskId_date: {
        taskId: "task-1",
        date: todayStr,
      },
    },
    update: {},
    create: {
      taskId: "task-1",
      userId: user.id,
      date: todayStr,
    },
  });
  console.log(`✅ Added task to My Day: ${myDayTask.date}`);

  // Create steps for task
  const steps = await Promise.all([
    prisma.step.create({
      data: {
        title: "收集需求",
        taskId: "task-1",
        userId: user.id,
        order: 0,
      },
    }),
    prisma.step.create({
      data: {
        title: "设计架构",
        taskId: "task-1",
        userId: user.id,
        order: 1,
        isCompleted: true,
      },
    }),
  ]);
  console.log(`✅ Created ${steps.length} steps`);

  console.log("\n✨ Seed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("  Email: demo@example.com");
  console.log("  Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
