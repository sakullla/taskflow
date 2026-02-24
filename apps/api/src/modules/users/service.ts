import { prisma } from "../../config/db.js";
import { AuthenticationError, AuthorizationError, ConflictError, NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { hashPassword, verifyPassword } from "../../shared/utils/password.js";
import type { ChangePasswordInput, CreateUserInput, UpdateProfileInput, UpdateUserStatusInput } from "./schemas.js";

function sanitizeUser(user: {
  id: string;
  email: string;
  isActive: boolean;
  name: string | null;
  avatar: string | null;
  locale: string;
  theme: string;
  dueDateReminders: boolean;
  weeklyDigest: boolean;
  createdAt: Date;
  role: "admin" | "user";
}) {
  return {
    id: user.id,
    email: user.email,
    isActive: user.isActive,
    name: user.name,
    avatar: user.avatar,
    locale: user.locale,
    theme: user.theme,
    dueDateReminders: user.dueDateReminders,
    weeklyDigest: user.weeklyDigest,
    createdAt: user.createdAt.toISOString(),
    role: user.role,
  };
}

async function assertAdmin(actorUserId: string) {
  const actor = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { id: true, role: true },
  });
  if (!actor) throw new NotFoundError("User");
  if (actor.role !== "admin") {
    throw new AuthorizationError("Admin permission required");
  }
}

export async function getUsers(actorUserId: string) {
  await assertAdmin(actorUserId);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return users.map(sanitizeUser);
}

export async function createUserByAdmin(actorUserId: string, data: CreateUserInput) {
  await assertAdmin(actorUserId);

  const email = data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError("User with this email already exists");
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        isActive: true,
        name: data.name ?? null,
        avatar: null,
        role: data.role,
        locale: "zh-CN",
        theme: "system",
        dueDateReminders: true,
        weeklyDigest: false,
      },
    });

    await tx.list.create({
      data: {
        name: "Tasks",
        color: "#3b82f6",
        isDefault: true,
        isArchived: false,
        order: 0,
        userId: created.id,
      },
    });

    return created;
  });

  return sanitizeUser(user);
}

export async function updateUserStatusByAdmin(
  actorUserId: string,
  targetUserId: string,
  data: UpdateUserStatusInput
) {
  await assertAdmin(actorUserId);

  if (actorUserId === targetUserId && data.isActive === false) {
    throw new ValidationError("You cannot disable your own account");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });
  if (!targetUser) throw new NotFoundError("User");

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isActive: data.isActive,
    },
  });
  return sanitizeUser(updated);
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new NotFoundError("User");
  return sanitizeUser(user);
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) throw new NotFoundError("User");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.locale !== undefined ? { locale: data.locale } : {}),
      ...(data.theme !== undefined ? { theme: data.theme } : {}),
      ...(data.dueDateReminders !== undefined
        ? { dueDateReminders: data.dueDateReminders }
        : {}),
      ...(data.weeklyDigest !== undefined ? { weeklyDigest: data.weeklyDigest } : {}),
      ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
    },
  });

  return sanitizeUser(updated);
}

export async function changePassword(userId: string, data: ChangePasswordInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true, isActive: true },
  });
  if (!user) throw new NotFoundError("User");

  if (user.isActive === false) {
    throw new AuthenticationError("User is disabled");
  }

  const ok = await verifyPassword(data.currentPassword, user.password);
  if (!ok) throw new AuthenticationError("Current password is incorrect");

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: await hashPassword(data.newPassword),
    },
  });
}
