import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";

type TaskPriority = "low" | "normal" | "high";

interface TodoList {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

interface Task {
  id: string;
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

const app = express();
const port = Number(process.env.PORT ?? 4000);
const nowIso = new Date().toISOString();

const defaultListId = "inbox";
const lists: TodoList[] = [
  {
    id: defaultListId,
    name: "Tasks",
    color: "#2563eb",
    isDefault: true,
    createdAt: nowIso
  },
  {
    id: "work",
    name: "Work",
    color: "#7c3aed",
    isDefault: false,
    createdAt: nowIso
  }
];

const tasks: Task[] = [
  {
    id: "task-1",
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

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/lists", (_req, res) => {
  res.json(lists);
});

app.post("/lists", (req, res) => {
  const { name, color } = req.body as { name?: unknown; color?: unknown };
  if (typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ message: "name is required" });
    return;
  }

  const nextList: TodoList = {
    id: randomUUID(),
    name: name.trim(),
    color: typeof color === "string" && color.trim() ? color : "#0f766e",
    isDefault: false,
    createdAt: new Date().toISOString()
  };

  lists.push(nextList);
  res.status(201).json(nextList);
});

app.patch("/lists/:id", (req, res) => {
  const list = lists.find((item) => item.id === req.params.id);
  if (!list) {
    res.status(404).json({ message: "list not found" });
    return;
  }

  const { name } = req.body as { name?: unknown };
  if (typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ message: "name is required" });
    return;
  }

  list.name = name.trim();
  res.json(list);
});

app.delete("/lists/:id", (req, res) => {
  const index = lists.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ message: "list not found" });
    return;
  }

  if (lists[index].isDefault) {
    res.status(400).json({ message: "default list cannot be deleted" });
    return;
  }

  const [removed] = lists.splice(index, 1);
  for (const task of tasks) {
    if (task.listId === removed.id) {
      task.listId = defaultListId;
    }
  }

  res.json({ deleted: removed.id, reassignedTo: defaultListId });
});

app.get("/tasks", (_req, res) => {
  res.json(tasks);
});

app.post("/tasks", (req, res) => {
  const body = req.body as Partial<Task>;
  if (typeof body.title !== "string" || body.title.trim().length === 0) {
    res.status(400).json({ message: "title is required" });
    return;
  }

  const listExists = body.listId
    ? lists.some((list) => list.id === body.listId)
    : false;

  const nextTask: Task = {
    id: randomUUID(),
    listId: listExists ? (body.listId as string) : defaultListId,
    title: body.title.trim(),
    note: typeof body.note === "string" ? body.note : "",
    isCompleted: Boolean(body.isCompleted),
    isImportant: Boolean(body.isImportant),
    inMyDay: Boolean(body.inMyDay),
    dueDate: typeof body.dueDate === "string" ? body.dueDate : null,
    reminderAt: typeof body.reminderAt === "string" ? body.reminderAt : null,
    priority:
      body.priority === "low" || body.priority === "high" ? body.priority : "normal",
    createdAt: new Date().toISOString()
  };

  tasks.unshift(nextTask);
  res.status(201).json(nextTask);
});

app.patch("/tasks/:id", (req, res) => {
  const task = tasks.find((item) => item.id === req.params.id);
  if (!task) {
    res.status(404).json({ message: "task not found" });
    return;
  }

  const patch = req.body as Partial<Task>;

  if (typeof patch.title === "string") {
    const nextTitle = patch.title.trim();
    if (!nextTitle) {
      res.status(400).json({ message: "title cannot be empty" });
      return;
    }
    task.title = nextTitle;
  }

  if (typeof patch.note === "string") {
    task.note = patch.note;
  }

  if (patch.isCompleted !== undefined) {
    task.isCompleted = Boolean(patch.isCompleted);
  }

  if (patch.isImportant !== undefined) {
    task.isImportant = Boolean(patch.isImportant);
  }

  if (patch.inMyDay !== undefined) {
    task.inMyDay = Boolean(patch.inMyDay);
  }

  if (patch.dueDate === null || typeof patch.dueDate === "string") {
    task.dueDate = patch.dueDate;
  }

  if (patch.reminderAt === null || typeof patch.reminderAt === "string") {
    task.reminderAt = patch.reminderAt;
  }

  if (patch.priority === "low" || patch.priority === "normal" || patch.priority === "high") {
    task.priority = patch.priority;
  }

  if (typeof patch.listId === "string" && lists.some((list) => list.id === patch.listId)) {
    task.listId = patch.listId;
  }

  res.json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const index = tasks.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ message: "task not found" });
    return;
  }

  const [deleted] = tasks.splice(index, 1);
  res.json({ deleted: deleted.id });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
