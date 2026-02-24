// 简化版数据库 - 使用内存存储
import { randomUUID } from "node:crypto";
import { getTodayDateKey } from "../shared/utils/timezone.js";

export interface User {
  id: string;
  email: string;
  password: string;
  isActive: boolean;
  name: string | null;
  avatar: string | null;
  role: "admin" | "user";
  locale: string;
  theme: string;
  dueDateReminders: boolean;
  weeklyDigest: boolean;
  createdAt: string;
}

export interface List {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  isArchived: boolean;
  order: number;
  userId: string;
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
  priority: "low" | "normal" | "high";
  order: number;
  userId: string;
  listId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Step {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  taskId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MyDayTask {
  id: string;
  taskId: string;
  userId: string;
  date: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "task_reminder" | "task_due" | "system";
  isRead: boolean;
  taskId: string | null;
  createdAt: string;
}

// In-memory storage
export const db = {
  users: new Map<string, User>(),
  lists: new Map<string, List>(),
  tasks: new Map<string, Task>(),
  steps: new Map<string, Step>(),
  myDayTasks: new Map<string, MyDayTask>(),
  notifications: new Map<string, Notification>(),
};

// Helper functions
export function generateId(): string {
  return randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export function getTodayString(): string {
  return getTodayDateKey();
}

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  return true;
}

// Initialize seed data
function seedData() {
  const demoUserId = "demo-user";
  const nowStr = now();

  // Create demo user
  db.users.set(demoUserId, {
    id: demoUserId,
    email: "demo@example.com",
    password: "demo-salt:dc548fb7432bad5dafda603929473162cc79e81fbaf8934de53ea41879b164d1",
    isActive: true,
    name: "Demo User",
    avatar: null,
    role: "admin",
    locale: "zh-CN",
    theme: "light",
    dueDateReminders: true,
    weeklyDigest: false,
    createdAt: nowStr,
  });

  // Create default list
  const defaultListId = generateId();
  db.lists.set(defaultListId, {
    id: defaultListId,
    name: "任务",
    color: "#3b82f6",
    isDefault: true,
    isArchived: false,
    order: 0,
    userId: demoUserId,
    createdAt: nowStr,
    updatedAt: nowStr,
  });

  // Create work list
  const workListId = generateId();
  db.lists.set(workListId, {
    id: workListId,
    name: "工作",
    color: "#8b5cf6",
    isDefault: false,
    isArchived: false,
    order: 1,
    userId: demoUserId,
    createdAt: nowStr,
    updatedAt: nowStr,
  });

  // Create sample tasks
  const task1Id = generateId();
  db.tasks.set(task1Id, {
    id: task1Id,
    title: "完成项目规划文档",
    note: "包含技术架构设计和开发计划",
    isCompleted: false,
    isImportant: true,
    dueDate: nowStr,
    reminderAt: null,
    priority: "high",
    order: 0,
    userId: demoUserId,
    listId: workListId,
    createdAt: nowStr,
    updatedAt: nowStr,
  });

  const task2Id = generateId();
  db.tasks.set(task2Id, {
    id: task2Id,
    title: "购买生活用品",
    note: "牛奶、面包、鸡蛋",
    isCompleted: false,
    isImportant: false,
    dueDate: null,
    reminderAt: null,
    priority: "normal",
    order: 1,
    userId: demoUserId,
    listId: defaultListId,
    createdAt: nowStr,
    updatedAt: nowStr,
  });

  // Add task1 to My Day
  db.myDayTasks.set(generateId(), {
    id: generateId(),
    taskId: task1Id,
    userId: demoUserId,
    date: getTodayString(),
    createdAt: nowStr,
  });

  // Seed a welcome notification so new sessions are not empty.
  const notificationId = generateId();
  db.notifications.set(notificationId, {
    id: notificationId,
    userId: demoUserId,
    title: "Welcome to TaskFlow",
    message: "You will receive reminders and due task notifications here.",
    type: "system",
    isRead: false,
    taskId: null,
    createdAt: nowStr,
  });

  console.log("✅ Seeded in-memory database with demo data");
}

seedData();
console.log("✅ Using in-memory database");
