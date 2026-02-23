import { db, generateId, now } from "../../config/db.js";
import { NotFoundError, ConflictError } from "../../shared/errors/index.js";
import type { CreateListInput, UpdateListInput } from "./schemas.js";

const DEFAULT_COLOR = "#3b82f6";

export async function getLists(userId: string) {
  const lists: Array<ReturnType<typeof getListWithTaskCount>> = [];

  for (const list of db.lists.values()) {
    if (list.userId === userId && !list.isArchived) {
      lists.push(getListWithTaskCount(list));
    }
  }

  // Sort by isDefault desc, order asc, createdAt asc
  return lists.sort((a, b) => {
    if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
    if (a.order !== b.order) return a.order - b.order;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function getListWithTaskCount(list: typeof db.lists extends Map<string, infer U> ? U : never) {
  let taskCount = 0;
  for (const task of db.tasks.values()) {
    if (task.listId === list.id && !task.isCompleted) {
      taskCount++;
    }
  }
  return { ...list, taskCount };
}

export async function getListById(id: string, userId: string) {
  const list = db.lists.get(id);

  if (!list || list.userId !== userId) {
    throw new NotFoundError("List");
  }

  return getListWithTaskCount(list);
}

export async function createList(userId: string, data: CreateListInput) {
  // Check for duplicate name
  for (const list of db.lists.values()) {
    if (list.userId === userId && list.name === data.name && !list.isArchived) {
      throw new ConflictError("A list with this name already exists");
    }
  }

  // Get max order
  let maxOrder = -1;
  for (const list of db.lists.values()) {
    if (list.userId === userId && list.order > maxOrder) {
      maxOrder = list.order;
    }
  }

  const listId = generateId();
  const list = {
    id: listId,
    name: data.name,
    color: data.color ?? DEFAULT_COLOR,
    isDefault: false,
    isArchived: false,
    order: maxOrder + 1,
    userId,
    createdAt: now(),
    updatedAt: now(),
  };

  db.lists.set(listId, list);
  return list;
}

export async function updateList(id: string, userId: string, data: UpdateListInput) {
  const list = db.lists.get(id);

  if (!list || list.userId !== userId) {
    throw new NotFoundError("List");
  }

  // Prevent updating default list name to empty
  if (list.isDefault && data.name === "") {
    throw new ConflictError("Cannot remove default list name");
  }

  // Check for duplicate name
  if (data.name && data.name !== list.name) {
    for (const l of db.lists.values()) {
      if (l.userId === userId && l.name === data.name && !l.isArchived && l.id !== id) {
        throw new ConflictError("A list with this name already exists");
      }
    }
  }

  const updated = {
    ...list,
    ...(data.name && { name: data.name }),
    ...(data.color && { color: data.color }),
    ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
    ...(data.order !== undefined && { order: data.order }),
    updatedAt: now(),
  };

  db.lists.set(id, updated);
  return updated;
}

export async function deleteList(id: string, userId: string) {
  const list = db.lists.get(id);

  if (!list || list.userId !== userId) {
    throw new NotFoundError("List");
  }

  if (list.isDefault) {
    throw new ConflictError("Cannot delete default list");
  }

  // Find default list
  let defaultList: typeof list | undefined;
  for (const l of db.lists.values()) {
    if (l.userId === userId && l.isDefault) {
      defaultList = l;
      break;
    }
  }

  if (!defaultList) {
    throw new ConflictError("Default list not found");
  }

  // Move tasks to default list
  for (const task of db.tasks.values()) {
    if (task.listId === id && task.userId === userId) {
      task.listId = defaultList.id;
      task.updatedAt = now();
    }
  }

  db.lists.delete(id);

  return { deleted: id, reassignedTo: defaultList.id };
}
