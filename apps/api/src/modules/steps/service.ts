import { db, generateId, now } from "../../config/db.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import type { CreateStepInput, UpdateStepInput } from "./schemas.js";

export async function getSteps(taskId: string, userId: string) {
  // Verify task exists and belongs to user
  const task = db.tasks.get(taskId);
  if (!task || task.userId !== userId) {
    throw new NotFoundError("Task");
  }

  const steps: Array<typeof db.steps extends Map<string, infer U> ? U : never> = [];
  for (const step of db.steps.values()) {
    if (step.taskId === taskId) {
      steps.push(step);
    }
  }

  return steps.sort((a, b) => a.order - b.order);
}

export async function createStep(taskId: string, userId: string, data: CreateStepInput) {
  // Verify task exists and belongs to user
  const task = db.tasks.get(taskId);
  if (!task || task.userId !== userId) {
    throw new NotFoundError("Task");
  }

  // Get max order
  let maxOrder = -1;
  for (const step of db.steps.values()) {
    if (step.taskId === taskId && step.order > maxOrder) {
      maxOrder = step.order;
    }
  }

  const stepId = generateId();
  const step = {
    id: stepId,
    title: data.title,
    taskId,
    userId,
    isCompleted: false,
    order: maxOrder + 1,
    createdAt: now(),
    updatedAt: now(),
  };

  db.steps.set(stepId, step);
  return step;
}

export async function updateStep(id: string, userId: string, data: UpdateStepInput) {
  const step = db.steps.get(id);

  if (!step || step.userId !== userId) {
    throw new NotFoundError("Step");
  }

  const updated = {
    ...step,
    ...(data.title !== undefined && { title: data.title }),
    ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
    ...(data.order !== undefined && { order: data.order }),
    updatedAt: now(),
  };

  db.steps.set(id, updated);
  return updated;
}

export async function deleteStep(id: string, userId: string) {
  const step = db.steps.get(id);

  if (!step || step.userId !== userId) {
    throw new NotFoundError("Step");
  }

  const taskId = step.taskId;
  db.steps.delete(id);

  // Reorder remaining steps
  const remainingSteps: Array<typeof step> = [];
  for (const s of db.steps.values()) {
    if (s.taskId === taskId) {
      remainingSteps.push(s);
    }
  }

  remainingSteps.sort((a, b) => a.order - b.order);
  remainingSteps.forEach((s, index) => {
    s.order = index;
    s.updatedAt = now();
    db.steps.set(s.id, s);
  });

  return { deleted: id };
}

export async function reorderSteps(taskId: string, userId: string, stepIds: string[]) {
  // Verify task belongs to user
  const task = db.tasks.get(taskId);
  if (!task || task.userId !== userId) {
    throw new NotFoundError("Task");
  }

  // Verify all steps belong to this task
  const taskSteps = new Set<string>();
  for (const step of db.steps.values()) {
    if (step.taskId === taskId) {
      taskSteps.add(step.id);
    }
  }

  if (!stepIds.every((id) => taskSteps.has(id))) {
    throw new ValidationError("Invalid step IDs");
  }

  // Update orders
  stepIds.forEach((id, index) => {
    const step = db.steps.get(id);
    if (step) {
      step.order = index;
      step.updatedAt = now();
      db.steps.set(id, step);
    }
  });

  return getSteps(taskId, userId);
}
