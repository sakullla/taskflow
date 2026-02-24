import { prisma } from "../../config/db.js";
import { NotFoundError, ConflictError } from "../../shared/errors/index.js";
import type { CreateListInput, UpdateListInput } from "./schemas.js";

const DEFAULT_COLOR = "#3b82f6";

function mapListWithCount(list: {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  isArchived: boolean;
  order: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { tasks: number };
}) {
  return {
    id: list.id,
    name: list.name,
    color: list.color,
    isDefault: list.isDefault,
    isArchived: list.isArchived,
    order: list.order,
    userId: list.userId,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
    taskCount: list._count.tasks,
  };
}

export async function getLists(userId: string) {
  const lists = await prisma.list.findMany({
    where: {
      userId,
      isArchived: false,
    },
    include: {
      _count: {
        select: {
          tasks: {
            where: { isCompleted: false },
          },
        },
      },
    },
    orderBy: [{ isDefault: "desc" }, { order: "asc" }, { createdAt: "asc" }],
  });

  return lists.map(mapListWithCount);
}

export async function getListById(id: string, userId: string) {
  const list = await prisma.list.findFirst({
    where: { id, userId },
    include: {
      _count: {
        select: {
          tasks: {
            where: { isCompleted: false },
          },
        },
      },
    },
  });

  if (!list) {
    throw new NotFoundError("List");
  }

  return mapListWithCount(list);
}

export async function createList(userId: string, data: CreateListInput) {
  const duplicate = await prisma.list.findFirst({
    where: {
      userId,
      name: data.name,
      isArchived: false,
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new ConflictError("A list with this name already exists");
  }

  const maxOrder = await prisma.list.aggregate({
    where: { userId },
    _max: { order: true },
  });

  const list = await prisma.list.create({
    data: {
      name: data.name,
      color: data.color ?? DEFAULT_COLOR,
      isDefault: false,
      isArchived: false,
      order: (maxOrder._max.order ?? -1) + 1,
      userId,
    },
  });

  return {
    ...list,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  };
}

export async function updateList(id: string, userId: string, data: UpdateListInput) {
  const list = await prisma.list.findFirst({
    where: { id, userId },
  });

  if (!list) {
    throw new NotFoundError("List");
  }

  if (list.isDefault && data.name === "") {
    throw new ConflictError("Cannot remove default list name");
  }

  if (data.name && data.name !== list.name) {
    const duplicate = await prisma.list.findFirst({
      where: {
        userId,
        name: data.name,
        isArchived: false,
        NOT: { id },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictError("A list with this name already exists");
    }
  }

  const updated = await prisma.list.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
      ...(data.isArchived !== undefined ? { isArchived: data.isArchived } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
    },
  });

  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteList(id: string, userId: string) {
  const list = await prisma.list.findFirst({
    where: { id, userId },
  });

  if (!list) {
    throw new NotFoundError("List");
  }

  if (list.isDefault) {
    throw new ConflictError("Cannot delete default list");
  }

  const defaultList = await prisma.list.findFirst({
    where: {
      userId,
      isDefault: true,
    },
    select: { id: true },
  });

  if (!defaultList) {
    throw new ConflictError("Default list not found");
  }

  await prisma.$transaction([
    prisma.task.updateMany({
      where: {
        userId,
        listId: id,
      },
      data: {
        listId: defaultList.id,
      },
    }),
    prisma.list.delete({
      where: { id },
    }),
  ]);

  return { deleted: id, reassignedTo: defaultList.id };
}
