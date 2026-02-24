import { db, now } from "../../config/db.js";
import { AuthenticationError, NotFoundError } from "../../shared/errors/index.js";
import { hashPassword, verifyPassword } from "../../shared/utils/password.js";
import type { ChangePasswordInput, UpdateProfileInput } from "./schemas.js";

function sanitizeUser(user: {
  id: string;
  email: string;
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

export async function getUsers() {
  return Array.from(db.users.values())
    .map(sanitizeUser)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  const ok = await verifyPassword(data.currentPassword, user.password);
  if (!ok) throw new AuthenticationError("Current password is incorrect");

  const updated = {
    ...user,
    password: await hashPassword(data.newPassword),
    updatedAt: now(),
  };
  db.users.set(userId, updated);
}
