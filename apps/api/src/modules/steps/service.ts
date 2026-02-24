import { prisma } from "../../config/db.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import type { CreateStepInput, UpdateStepInput } from "./schemas.js";

function mapStep(step: {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...step,
    createdAt: step.createdAt.toISOString(),
    updatedAt: step.updatedAt.toISOString(),
  };
}

export async function getSteps(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) {
    throw new NotFoundError("Task");
  }

  const steps = await prisma.step.findMany({
    where: { taskId },
    orderBy: { order: "asc" },
  });

  return steps.map(mapStep);
}

export async function createStep(taskId: string, userId: string, data: CreateStepInput) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) {
    throw new NotFoundError("Task");
  }

  const maxOrder = await prisma.step.aggregate({
    where: { taskId },
    _max: { order: true },
  });

  const step = await prisma.step.create({
    data: {
      title: data.title,
      taskId,
      userId,
      isCompleted: false,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return mapStep(step);
}

export async function updateStep(id: string, userId: string, data: UpdateStepInput) {
  const step = await prisma.step.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!step) {
    throw new NotFoundError("Step");
  }

  const updated = await prisma.step.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.isCompleted !== undefined ? { isCompleted: data.isCompleted } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
    },
  });

  return mapStep(updated);
}

export async function deleteStep(id: string, userId: string) {
  const step = await prisma.step.findFirst({
    where: { id, userId },
    select: { id: true, taskId: true },
  });

  if (!step) {
    throw new NotFoundError("Step");
  }

  await prisma.$transaction(async (tx) => {
    await tx.step.delete({
      where: { id },
    });

    const remaining = await tx.step.findMany({
      where: { taskId: step.taskId },
      orderBy: { order: "asc" },
      select: { id: true },
    });

    for (const [index, item] of remaining.entries()) {
      await tx.step.update({
        where: { id: item.id },
        data: { order: index },
      });
    }
  });

  return { deleted: id };
}

export async function reorderSteps(taskId: string, userId: string, stepIds: string[]) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) {
    throw new NotFoundError("Task");
  }

  const existing = await prisma.step.findMany({
    where: { taskId },
    select: { id: true },
  });

  const existingSet = new Set(existing.map((step) => step.id));
  if (!stepIds.every((id) => existingSet.has(id))) {
    throw new ValidationError("Invalid step IDs");
  }

  await prisma.$transaction(
    stepIds.map((id, index) => prisma.step.update({
      where: { id },
      data: { order: index },
    }))
  );

  return getSteps(taskId, userId);
}
