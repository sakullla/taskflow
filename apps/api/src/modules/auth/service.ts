import { db, generateId, now } from "../../config/db.js";
import { AuthenticationError, ConflictError } from "../../shared/errors/index.js";
import { hashPassword, verifyPassword } from "../../shared/utils/password.js";
import type { LoginInput, RegisterInput } from "./schemas.js";

export async function registerUser(data: RegisterInput) {
  // Check if user exists
  for (const user of db.users.values()) {
    if (user.email === data.email) {
      throw new ConflictError("User with this email already exists");
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const userId = generateId();
  const user = {
    id: userId,
    email: data.email,
    password: hashedPassword,
    isActive: true,
    name: data.name ?? null,
    avatar: null,
    role: "user" as const,
    locale: "zh-CN",
    theme: "system",
    dueDateReminders: true,
    weeklyDigest: false,
    createdAt: now(),
  };
  db.users.set(userId, user);

  // Create default list
  const listId = generateId();
  db.lists.set(listId, {
    id: listId,
    name: "任务",
    color: "#3b82f6",
    isDefault: true,
    isArchived: false,
    order: 0,
    userId,
    createdAt: now(),
    updatedAt: now(),
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      locale: user.locale,
      theme: user.theme,
      dueDateReminders: user.dueDateReminders,
      weeklyDigest: user.weeklyDigest,
    },
  };
}

export async function loginUser(data: LoginInput) {
  // Find user
  let user: (typeof db.users extends Map<string, infer U> ? U : never) | undefined = undefined;
  for (const u of db.users.values()) {
    if (u.email === data.email) {
      user = u;
      break;
    }
  }

  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  if (user.isActive === false) {
    throw new AuthenticationError("User is disabled");
  }

  // Verify password
  const isValid = await verifyPassword(data.password, user.password);

  if (!isValid) {
    throw new AuthenticationError("Invalid email or password");
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      locale: user.locale,
      theme: user.theme,
      dueDateReminders: user.dueDateReminders,
      weeklyDigest: user.weeklyDigest,
    },
  };
}

export async function getCurrentUser(userId: string) {
  const user = db.users.get(userId);

  if (!user) {
    throw new AuthenticationError("User not found");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    isActive: user.isActive,
    locale: user.locale,
    theme: user.theme,
    dueDateReminders: user.dueDateReminders,
    weeklyDigest: user.weeklyDigest,
    role: user.role,
    createdAt: user.createdAt,
  };
}
