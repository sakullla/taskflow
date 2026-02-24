import { prisma } from "../../config/db.js";
import { AuthenticationError, ConflictError } from "../../shared/errors/index.js";
import { hashPassword, isLegacyPasswordHash, verifyPassword } from "../../shared/utils/password.js";
import type { LoginInput, RegisterInput } from "./schemas.js";

function sanitizeUser(user: {
  id: string;
  email: string;
  isActive: boolean;
  name: string | null;
  role: "admin" | "user";
  locale: string;
  theme: string;
  dueDateReminders: boolean;
  weeklyDigest: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    isActive: user.isActive,
    name: user.name,
    role: user.role,
    locale: user.locale,
    theme: user.theme,
    dueDateReminders: user.dueDateReminders,
    weeklyDigest: user.weeklyDigest,
  };
}

export async function registerUser(data: RegisterInput) {
  const email = data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("User with this email already exists");
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findFirst({
      select: { id: true },
    });
    const role: "admin" | "user" = existingUser ? "user" : "admin";

    const created = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        isActive: true,
        name: data.name ?? null,
        role,
        locale: "zh-CN",
        theme: "system",
        dueDateReminders: true,
        weeklyDigest: false,
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        name: true,
        role: true,
        locale: true,
        theme: true,
        dueDateReminders: true,
        weeklyDigest: true,
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

  return { user: sanitizeUser(user) };
}

export async function loginUser(data: LoginInput) {
  const email = data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      isActive: true,
      name: true,
      role: true,
      locale: true,
      theme: true,
      dueDateReminders: true,
      weeklyDigest: true,
    },
  });

  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  if (!user.isActive) {
    throw new AuthenticationError("User is disabled");
  }

  const isValid = await verifyPassword(data.password, user.password);
  if (!isValid) {
    throw new AuthenticationError("Invalid email or password");
  }

  if (isLegacyPasswordHash(user.password)) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(data.password),
      },
    });
  }

  return { user: sanitizeUser(user) };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      isActive: true,
      locale: true,
      theme: true,
      dueDateReminders: true,
      weeklyDigest: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AuthenticationError("User not found");
  }

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };
}
