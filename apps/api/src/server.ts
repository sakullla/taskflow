import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

type TaskPriority = "low" | "normal" | "high";

interface TodoList {
  id: string;
  userId: string;
  name: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

interface Task {
  id: string;
  userId: string;
  listId: string;
  title: string;
  note: string;
  isCompleted: boolean;
  isImportant: boolean;
  inMyDay: boolean;
  dueDate: string | null;
  reminderAt: string | null;
  priority: TaskPriority;
  createdAt: string;
}

interface Step {
  id: string;
  userId: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  order: number;
  createdAt: string;
}

interface MyDayTask {
  id: string;
  userId: string;
  taskId: string;
  date: string;
  createdAt: string;
}

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

interface UserRequest extends Request {
  userId: string;
}

const app = express();
const port = Number(process.env.PORT ?? 4000);
const demoUserId = "demo-user";
const nowIso = new Date().toISOString();
const defaultListId = "inbox";
const dbPath = process.env.TODO_DB_PATH ?? "data/todo.sqlite";

const lists: TodoList[] = [
  {
    id: defaultListId,
    userId: demoUserId,
    name: "Tasks",
    color: "#2563eb",
    isDefault: true,
    createdAt: nowIso
  },
  {
    id: "work",
    userId: demoUserId,
    name: "Work",
    color: "#7c3aed",
    isDefault: false,
    createdAt: nowIso
  }
];

const tasks: Task[] = [
  {
    id: "task-1",
    userId: demoUserId,
    listId: "work",
    title: "Review sprint backlog",
    note: "Prepare risks and blockers before standup.",
    isCompleted: false,
    isImportant: true,
    inMyDay: true,
    dueDate: nowIso.slice(0, 10),
    reminderAt: `${nowIso.slice(0, 10)}T09:00`,
    priority: "high",
    createdAt: nowIso
  },
  {
    id: "task-2",
    userId: demoUserId,
    listId: defaultListId,
    title: "Write API contract draft",
    note: "Cover list/task/step payloads.",
    isCompleted: false,
    isImportant: false,
    inMyDay: false,
    dueDate: null,
    reminderAt: null,
    priority: "normal",
    createdAt: nowIso
  }
];

const steps: Step[] = [
  {
    id: "step-1",
    userId: demoUserId,
    taskId: "task-1",
    title: "Collect blocker list",
    isCompleted: false,
    order: 0,
    createdAt: nowIso
  }
];

const myDayTasks: MyDayTask[] = [
  {
    id: "myday-1",
    userId: demoUserId,
    taskId: "task-1",
    date: nowIso.slice(0, 10),
    createdAt: nowIso
  }
];

const db = (() => {
  mkdirSync(dirname(dbPath), { recursive: true });
  return new DatabaseSync(dbPath);
})();

function setupSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      is_default INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      list_id TEXT NOT NULL,
      title TEXT NOT NULL,
      note TEXT NOT NULL,
      is_completed INTEGER NOT NULL,
      is_important INTEGER NOT NULL,
      in_my_day INTEGER NOT NULL,
      due_date TEXT,
      reminder_at TEXT,
      priority TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS steps (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      is_completed INTEGER NOT NULL,
      step_order INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS my_day_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function persistState(): void {
  db.exec("BEGIN TRANSACTION");
  try {
    db.exec("DELETE FROM lists");
    db.exec("DELETE FROM tasks");
    db.exec("DELETE FROM steps");
    db.exec("DELETE FROM my_day_tasks");

    const insertList = db.prepare(
      "INSERT INTO lists (id, user_id, name, color, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const item of lists) {
      insertList.run(
        item.id,
        item.userId,
        item.name,
        item.color,
        item.isDefault ? 1 : 0,
        item.createdAt
      );
    }

    const insertTask = db.prepare(
      "INSERT INTO tasks (id, user_id, list_id, title, note, is_completed, is_important, in_my_day, due_date, reminder_at, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const item of tasks) {
      insertTask.run(
        item.id,
        item.userId,
        item.listId,
        item.title,
        item.note,
        item.isCompleted ? 1 : 0,
        item.isImportant ? 1 : 0,
        item.inMyDay ? 1 : 0,
        item.dueDate,
        item.reminderAt,
        item.priority,
        item.createdAt
      );
    }

    const insertStep = db.prepare(
      "INSERT INTO steps (id, user_id, task_id, title, is_completed, step_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    for (const item of steps) {
      insertStep.run(
        item.id,
        item.userId,
        item.taskId,
        item.title,
        item.isCompleted ? 1 : 0,
        item.order,
        item.createdAt
      );
    }

    const insertMyDay = db.prepare(
      "INSERT INTO my_day_tasks (id, user_id, task_id, date, created_at) VALUES (?, ?, ?, ?, ?)"
    );
    for (const item of myDayTasks) {
      insertMyDay.run(item.id, item.userId, item.taskId, item.date, item.createdAt);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function hydrateState(): void {
  const listRows = db
    .prepare(
      "SELECT id, user_id, name, color, is_default, created_at FROM lists ORDER BY created_at"
    )
    .all() as Array<{
    id: string;
    user_id: string;
    name: string;
    color: string;
    is_default: number;
    created_at: string;
  }>;

  if (listRows.length === 0) {
    persistState();
    return;
  }

  const taskRows = db
    .prepare(
      "SELECT id, user_id, list_id, title, note, is_completed, is_important, in_my_day, due_date, reminder_at, priority, created_at FROM tasks ORDER BY created_at DESC"
    )
    .all() as Array<{
    id: string;
    user_id: string;
    list_id: string;
    title: string;
    note: string;
    is_completed: number;
    is_important: number;
    in_my_day: number;
    due_date: string | null;
    reminder_at: string | null;
    priority: TaskPriority;
    created_at: string;
  }>;

  const stepRows = db
    .prepare(
      "SELECT id, user_id, task_id, title, is_completed, step_order, created_at FROM steps ORDER BY step_order ASC"
    )
    .all() as Array<{
    id: string;
    user_id: string;
    task_id: string;
    title: string;
    is_completed: number;
    step_order: number;
    created_at: string;
  }>;

  const myDayRows = db
    .prepare("SELECT id, user_id, task_id, date, created_at FROM my_day_tasks")
    .all() as Array<{
    id: string;
    user_id: string;
    task_id: string;
    date: string;
    created_at: string;
  }>;

  lists.splice(
    0,
    lists.length,
    ...listRows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      color: row.color,
      isDefault: row.is_default === 1,
      createdAt: row.created_at
    }))
  );

  tasks.splice(
    0,
    tasks.length,
    ...taskRows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      listId: row.list_id,
      title: row.title,
      note: row.note,
      isCompleted: row.is_completed === 1,
      isImportant: row.is_important === 1,
      inMyDay: row.in_my_day === 1,
      dueDate: row.due_date,
      reminderAt: row.reminder_at,
      priority: row.priority,
      createdAt: row.created_at
    }))
  );

  steps.splice(
    0,
    steps.length,
    ...stepRows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      taskId: row.task_id,
      title: row.title,
      isCompleted: row.is_completed === 1,
      order: row.step_order,
      createdAt: row.created_at
    }))
  );

  myDayTasks.splice(
    0,
    myDayTasks.length,
    ...myDayRows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      taskId: row.task_id,
      date: row.date,
      createdAt: row.created_at
    }))
  );
}

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
): void {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      details
    }
  };
  res.status(status).json(body);
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function readString(body: unknown, key: string): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function readBoolean(body: unknown, key: string): boolean | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : undefined;
}

function readNumber(body: unknown, key: string): number | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}

function readNullableString(body: unknown, key: string): string | null | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }
  const value = (body as Record<string, unknown>)[key];
  if (value === null) {
    return null;
  }
  return typeof value === "string" ? value : undefined;
}

function findDefaultListId(userId: string): string {
  const list = lists.find((item) => item.userId === userId && item.isDefault);
  return list?.id ?? defaultListId;
}

function findTaskByUser(taskId: string, userId: string): Task | undefined {
  return tasks.find((item) => item.id === taskId && item.userId === userId);
}

setupSchema();
hydrateState();

app.use(cors());
app.use(express.json());

// Auth stub: user identity comes from header, defaults to demo-user.
app.use((req: Request, _res: Response, next: NextFunction) => {
  const userId = req.header("x-user-id")?.trim() || demoUserId;
  (req as UserRequest).userId = userId;
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/lists", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  res.json(lists.filter((item) => item.userId === userId));
});

app.post("/lists", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const name = readString(req.body, "name")?.trim();
  const color = readString(req.body, "color")?.trim();

  if (!name) {
    sendError(res, 400, "VALIDATION_ERROR", "name is required");
    return;
  }

  const nextList: TodoList = {
    id: randomUUID(),
    userId,
    name,
    color: color || "#0f766e",
    isDefault: false,
    createdAt: new Date().toISOString()
  };

  lists.push(nextList);
  persistState();
  res.status(201).json(nextList);
});

app.patch("/lists/:id", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const list = lists.find((item) => item.id === req.params.id && item.userId === userId);

  if (!list) {
    sendError(res, 404, "NOT_FOUND", "list not found");
    return;
  }

  const name = readString(req.body, "name")?.trim();
  if (!name) {
    sendError(res, 400, "VALIDATION_ERROR", "name is required");
    return;
  }

  list.name = name;
  persistState();
  res.json(list);
});

app.delete("/lists/:id", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const index = lists.findIndex((item) => item.id === req.params.id && item.userId === userId);

  if (index === -1) {
    sendError(res, 404, "NOT_FOUND", "list not found");
    return;
  }

  if (lists[index].isDefault) {
    sendError(res, 400, "INVALID_OPERATION", "default list cannot be deleted");
    return;
  }

  const fallbackListId = findDefaultListId(userId);
  const [removed] = lists.splice(index, 1);

  for (const task of tasks) {
    if (task.userId === userId && task.listId === removed.id) {
      task.listId = fallbackListId;
    }
  }

  persistState();
  res.json({ deleted: removed.id, reassignedTo: fallbackListId });
});

app.get("/tasks", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const listId = typeof req.query.listId === "string" ? req.query.listId : undefined;

  const scoped = tasks.filter((item) => item.userId === userId);
  if (!listId) {
    res.json(scoped);
    return;
  }

  res.json(scoped.filter((item) => item.listId === listId));
});

app.post("/tasks", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const title = readString(req.body, "title")?.trim();
  const requestedListId = readString(req.body, "listId");

  if (!title) {
    sendError(res, 400, "VALIDATION_ERROR", "title is required");
    return;
  }

  const listExists = requestedListId
    ? lists.some((list) => list.userId === userId && list.id === requestedListId)
    : false;

  const nextTask: Task = {
    id: randomUUID(),
    userId,
    listId: listExists ? (requestedListId as string) : findDefaultListId(userId),
    title,
    note: readString(req.body, "note") ?? "",
    isCompleted: readBoolean(req.body, "isCompleted") ?? false,
    isImportant: readBoolean(req.body, "isImportant") ?? false,
    inMyDay: readBoolean(req.body, "inMyDay") ?? false,
    dueDate: readNullableString(req.body, "dueDate") ?? null,
    reminderAt: readNullableString(req.body, "reminderAt") ?? null,
    priority: (() => {
      const raw = readString(req.body, "priority");
      return raw === "low" || raw === "high" ? raw : "normal";
    })(),
    createdAt: new Date().toISOString()
  };

  tasks.unshift(nextTask);
  persistState();
  res.status(201).json(nextTask);
});

app.patch("/tasks/:id", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const task = findTaskByUser(req.params.id, userId);

  if (!task) {
    sendError(res, 404, "NOT_FOUND", "task not found");
    return;
  }

  const title = readString(req.body, "title");
  if (typeof title === "string") {
    task.title = title;
  }

  const note = readString(req.body, "note");
  if (typeof note === "string") {
    task.note = note;
  }

  const isCompleted = readBoolean(req.body, "isCompleted");
  if (typeof isCompleted === "boolean") {
    task.isCompleted = isCompleted;
  }

  const isImportant = readBoolean(req.body, "isImportant");
  if (typeof isImportant === "boolean") {
    task.isImportant = isImportant;
  }

  const inMyDay = readBoolean(req.body, "inMyDay");
  if (typeof inMyDay === "boolean") {
    task.inMyDay = inMyDay;

    if (inMyDay) {
      const today = getTodayDate();
      if (!myDayTasks.some((entry) => entry.userId === userId && entry.taskId === task.id && entry.date === today)) {
        myDayTasks.push({
          id: randomUUID(),
          userId,
          taskId: task.id,
          date: today,
          createdAt: new Date().toISOString()
        });
      }
    } else {
      for (let index = myDayTasks.length - 1; index >= 0; index -= 1) {
        if (myDayTasks[index].userId === userId && myDayTasks[index].taskId === task.id) {
          myDayTasks.splice(index, 1);
        }
      }
    }
  }

  const dueDate = readNullableString(req.body, "dueDate");
  if (dueDate !== undefined) {
    task.dueDate = dueDate;
  }

  const reminderAt = readNullableString(req.body, "reminderAt");
  if (reminderAt !== undefined) {
    task.reminderAt = reminderAt;
  }

  const priority = readString(req.body, "priority");
  if (priority === "low" || priority === "normal" || priority === "high") {
    task.priority = priority;
  }

  const listId = readString(req.body, "listId");
  if (listId && lists.some((list) => list.userId === userId && list.id === listId)) {
    task.listId = listId;
  }

  persistState();
  res.json(task);
});

app.delete("/tasks/:id", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const index = tasks.findIndex((item) => item.id === req.params.id && item.userId === userId);

  if (index === -1) {
    sendError(res, 404, "NOT_FOUND", "task not found");
    return;
  }

  const [deleted] = tasks.splice(index, 1);

  for (let i = steps.length - 1; i >= 0; i -= 1) {
    if (steps[i].userId === userId && steps[i].taskId === deleted.id) {
      steps.splice(i, 1);
    }
  }

  for (let i = myDayTasks.length - 1; i >= 0; i -= 1) {
    if (myDayTasks[i].userId === userId && myDayTasks[i].taskId === deleted.id) {
      myDayTasks.splice(i, 1);
    }
  }

  persistState();
  res.json({ deleted: deleted.id });
});

app.get("/tasks/:taskId/steps", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const task = findTaskByUser(req.params.taskId, userId);
  if (!task) {
    sendError(res, 404, "NOT_FOUND", "task not found");
    return;
  }

  const taskSteps = steps
    .filter((item) => item.userId === userId && item.taskId === task.id)
    .sort((a, b) => a.order - b.order);

  res.json(taskSteps);
});

app.post("/tasks/:taskId/steps", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const task = findTaskByUser(req.params.taskId, userId);
  if (!task) {
    sendError(res, 404, "NOT_FOUND", "task not found");
    return;
  }

  const title = readString(req.body, "title")?.trim();
  if (!title) {
    sendError(res, 400, "VALIDATION_ERROR", "title is required");
    return;
  }

  const nextOrder = Math.max(
    -1,
    ...steps
      .filter((item) => item.userId === userId && item.taskId === task.id)
      .map((item) => item.order)
  );

  const nextStep: Step = {
    id: randomUUID(),
    userId,
    taskId: task.id,
    title,
    isCompleted: false,
    order: nextOrder + 1,
    createdAt: new Date().toISOString()
  };

  steps.push(nextStep);
  persistState();
  res.status(201).json(nextStep);
});

app.patch("/steps/:id", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const step = steps.find((item) => item.id === req.params.id && item.userId === userId);

  if (!step) {
    sendError(res, 404, "NOT_FOUND", "step not found");
    return;
  }

  const title = readString(req.body, "title");
  if (typeof title === "string") {
    step.title = title;
  }

  const isCompleted = readBoolean(req.body, "isCompleted");
  if (typeof isCompleted === "boolean") {
    step.isCompleted = isCompleted;
  }

  const order = readNumber(req.body, "order");
  if (typeof order === "number") {
    step.order = order;
  }

  persistState();
  res.json(step);
});

app.delete("/steps/:id", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const index = steps.findIndex((item) => item.id === req.params.id && item.userId === userId);

  if (index === -1) {
    sendError(res, 404, "NOT_FOUND", "step not found");
    return;
  }

  const [deleted] = steps.splice(index, 1);
  persistState();
  res.json({ deleted: deleted.id });
});

app.get("/my-day", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const date = typeof req.query.date === "string" ? req.query.date : getTodayDate();

  const entries = myDayTasks.filter((item) => item.userId === userId && item.date === date);
  const taskIds = new Set(entries.map((item) => item.taskId));
  const dayTasks = tasks.filter((task) => task.userId === userId && taskIds.has(task.id));

  res.json({ date, tasks: dayTasks, entries });
});

app.post("/my-day", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const taskId = readString(req.body, "taskId");
  const date = readString(req.body, "date") ?? getTodayDate();

  if (!taskId) {
    sendError(res, 400, "VALIDATION_ERROR", "taskId is required");
    return;
  }

  const task = findTaskByUser(taskId, userId);
  if (!task) {
    sendError(res, 404, "NOT_FOUND", "task not found");
    return;
  }

  const existing = myDayTasks.find(
    (item) => item.userId === userId && item.taskId === task.id && item.date === date
  );
  if (existing) {
    res.json(existing);
    return;
  }

  const entry: MyDayTask = {
    id: randomUUID(),
    userId,
    taskId: task.id,
    date,
    createdAt: new Date().toISOString()
  };

  myDayTasks.push(entry);
  task.inMyDay = true;
  persistState();
  res.status(201).json(entry);
});

app.delete("/my-day/:taskId", (req: Request, res) => {
  const userId = (req as UserRequest).userId;
  const date = typeof req.query.date === "string" ? req.query.date : getTodayDate();
  const taskId = req.params.taskId;

  const task = findTaskByUser(taskId, userId);
  if (!task) {
    sendError(res, 404, "NOT_FOUND", "task not found");
    return;
  }

  let deletedCount = 0;
  for (let index = myDayTasks.length - 1; index >= 0; index -= 1) {
    const item = myDayTasks[index];
    if (item.userId === userId && item.taskId === taskId && item.date === date) {
      myDayTasks.splice(index, 1);
      deletedCount += 1;
    }
  }

  if (!myDayTasks.some((item) => item.userId === userId && item.taskId === taskId)) {
    task.inMyDay = false;
  }

  persistState();
  res.json({ deleted: deletedCount, taskId, date });
});

app.use((_req, res) => {
  sendError(res, 404, "NOT_FOUND", "route not found");
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  sendError(res, 500, "INTERNAL_ERROR", "internal server error");
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
