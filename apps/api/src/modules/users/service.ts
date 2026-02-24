import { db, generateId, now } from "../../config/db.js";
import { AuthenticationError, AuthorizationError, ConflictError, NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { hashPassword, verifyPassword } from "../../shared/utils/password.js";
import type { ChangePasswordInput, CreateUserInput, UpdateProfileInput, UpdateUserStatusInput } from "./schemas.js";

function sanitizeUser(user: {
  id: string;
  email: string;
  isActive?: boolean;
  name: string | null;
  avatar: string | null;
  locale: string;
  theme: string;
  dueDateReminders?: boolean;
  weeklyDigest?: boolean;
  createdAt: string;
  role?: "admin" | "user";
}) {
  return {
    id: user.id,
    email: user.email,
    isActive: user.isActive ?? true,
    name: user.name,
    avatar: user.avatar,
    locale: user.locale,
    theme: user.theme,
    dueDateReminders: user.dueDateReminders ?? true,
    weeklyDigest: user.weeklyDigest ?? false,
    createdAt: user.createdAt,
    role: user.role ?? "user",
  };
}

function assertAdmin(actorUserId: string) {
  const actor = db.users.get(actorUserId);
  if (!actor) throw new NotFoundError("User");
  if (actor.role !== "admin") {
    throw new AuthorizationError("Admin permission required");
  }
}

export async function getUsers(actorUserId: string) {
  assertAdmin(actorUserId);

  return Array.from(db.users.values())
    .map(sanitizeUser)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createUserByAdmin(actorUserId: string, data: CreateUserInput) {
  assertAdmin(actorUserId);

  for (const user of db.users.values()) {
    if (user.email.toLowerCase() === data.email.toLowerCase()) {
      throw new ConflictError("User with this email already exists");
    }
  }

  const userId = generateId();
  const createdAt = now();
  const hashedPassword = await hashPassword(data.password);

  db.users.set(userId, {
    id: userId,
    email: data.email,
    password: hashedPassword,
    isActive: true,
    name: data.name ?? null,
    avatar: null,
    role: data.role,
    locale: "zh-CN",
    theme: "system",
    dueDateReminders: true,
    weeklyDigest: false,
    createdAt,
  });

  const listId = generateId();
  db.lists.set(listId, {
    id: listId,
    name: "任务",
    color: "#3b82f6",
    isDefault: true,
    isArchived: false,
    order: 0,
    userId,
    createdAt,
    updatedAt: createdAt,
  });

  const user = db.users.get(userId);
  if (!user) throw new NotFoundError("User");
  return sanitizeUser(user);
}

export async function updateUserStatusByAdmin(
  actorUserId: string,
  targetUserId: string,
  data: UpdateUserStatusInput
) {
  assertAdmin(actorUserId);

  if (actorUserId === targetUserId && data.isActive === false) {
    throw new ValidationError("You cannot disable your own account");
  }

  const targetUser = db.users.get(targetUserId);
  if (!targetUser) throw new NotFoundError("User");

  const updated = {
    ...targetUser,
    isActive: data.isActive,
    updatedAt: now(),
  };
  db.users.set(targetUserId, updated);
  return sanitizeUser(updated);
}

export async function getUserById(userId: string) {
  const user = db.users.get(userId);
  if (!user) throw new NotFoundError("User");
  return sanitizeUser(user);
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const user = db.users.get(userId);
  if (!user) throw new NotFoundError("User");

  const updated = {
    ...user,
    ...(data.name !== undefined && { name: data.name }),
    ...(data.locale !== undefined && { locale: data.locale }),
    ...(data.theme !== undefined && { theme: data.theme }),
    ...(data.dueDateReminders !== undefined && {
      dueDateReminders: data.dueDateReminders,
    }),
    ...(data.weeklyDigest !== undefined && { weeklyDigest: data.weeklyDigest }),
    ...(data.avatar !== undefined && { avatar: data.avatar }),
    updatedAt: now(),
  };

  db.users.set(userId, updated);
  return sanitizeUser(updated);
}

export async function changePassword(userId: string, data: ChangePasswordInput) {
  const user = db.users.get(userId);
  if (!user) throw new NotFoundError("User");

  if (user.isActive === false) {
    throw new AuthenticationError("User is disabled");
  }

  const ok = await verifyPassword(data.currentPassword, user.password);
  if (!ok) throw new AuthenticationError("Current password is incorrect");

  const updated = {
    ...user,
    password: await hashPassword(data.newPassword),
    updatedAt: now(),
  };
  db.users.set(userId, updated);
}
