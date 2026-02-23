import { db, generateId, now, getTodayString } from "../../config/db.js";
import { NotFoundError, ConflictError } from "../../shared/errors/index.js";
import type { Task, Step } from "../../config/db-simple.js";

// Extended task type with steps and list info
interface TaskWithSteps extends Task {
  steps: Array<Pick<Step, "id" | "title" | "isCompleted" | "order">>;
  list?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export async function getMyDayTasks(userId: string, date?: string) {
  const targetDate = date ?? getTodayString();

  const taskIds: string[] = [];
  for (const entry of db.myDayTasks.values()) {
    if (entry.userId === userId && entry.date === targetDate) {
      taskIds.push(entry.taskId);
    }
  }

  const tasks: TaskWithSteps[] = [];
  for (const taskId of taskIds) {
    const task = db.tasks.get(taskId);
    if (task) {
      // Add steps
      const steps: Array<Pick<typeof db.steps extends Map<string, infer U> ? U : never, "id" | "title" | "isCompleted" | "order">> = [];
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

      // Add list info
      const list = db.lists.get(task.listId);

      tasks.push({
        ...task,
        steps,
        list: list ? {
          id: list.id,
          name: list.name,
          color: list.color,
        } : null,
      });
    }
  }

  // Sort by added time (entry createdAt)
  tasks.sort((a, b) => {
    const entryA = Array.from(db.myDayTasks.values()).find(e => e.taskId === a.id && e.date === targetDate);
    const entryB = Array.from(db.myDayTasks.values()).find(e => e.taskId === b.id && e.date === targetDate);
    if (!entryA || !entryB) return 0;
    return new Date(entryA.createdAt).getTime() - new Date(entryB.createdAt).getTime();
  });

  return {
    date: targetDate,
    tasks,
    count: tasks.length,
  };
}

export async function addTaskToMyDay(userId: string, taskId: string, date?: string) {
  const targetDate = date ?? getTodayString();

  // Verify task exists and belongs to user
  const task = db.tasks.get(taskId);
  if (!task || task.userId !== userId) {
    throw new NotFoundError("Task");
  }

  // Check if already added
  const existingKey = Array.from(db.myDayTasks.entries()).find(
    ([, e]) => e.taskId === taskId && e.date === targetDate
  )?.[0];

  if (existingKey) {
    throw new ConflictError("Task is already in My Day for this date");
  }

  // Create entry
  const entryId = generateId();
  const entry = {
    id: entryId,
    taskId,
    userId,
    date: targetDate,
    createdAt: now(),
  };

  db.myDayTasks.set(entryId, entry);

  // Update task inMyDay flag if it's for today
  if (targetDate === getTodayString()) {
    task.inMyDay = true;
    task.updatedAt = now();
    db.tasks.set(taskId, task);
  }

  return entry;
}

export async function removeTaskFromMyDay(userId: string, taskId: string, date?: string) {
  const targetDate = date ?? getTodayString();

  // Verify task exists
  const task = db.tasks.get(taskId);
  if (!task || task.userId !== userId) {
    throw new NotFoundError("Task");
  }

  // Find entry
  const entryKey = Array.from(db.myDayTasks.entries()).find(
    ([, e]) => e.taskId === taskId && e.date === targetDate
  )?.[0];

  if (!entryKey) {
    throw new NotFoundError("My Day entry");
  }

  db.myDayTasks.delete(entryKey);

  // Update task inMyDay flag if it's for today and no other entries
  if (targetDate === getTodayString()) {
    let hasOtherEntries = false;
    for (const entry of db.myDayTasks.values()) {
      if (entry.taskId === taskId) {
        hasOtherEntries = true;
        break;
      }
    }

    if (!hasOtherEntries) {
      task.inMyDay = false;
      task.updatedAt = now();
      db.tasks.set(taskId, task);
    }
  }

  return { deleted: entryKey, taskId, date: targetDate };
}

export async function getMyDayHistory(userId: string, limit: number = 30) {
  const dateMap = new Map<string, number>();

  for (const entry of db.myDayTasks.values()) {
    if (entry.userId === userId) {
      const count = dateMap.get(entry.date) ?? 0;
      dateMap.set(entry.date, count + 1);
    }
  }

  const history = Array.from(dateMap.entries())
    .map(([date, taskCount]) => ({ date, taskCount }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);

  return history;
}
