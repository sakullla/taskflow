import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  locale: z.string().trim().min(2).max(20).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  dueDateReminders: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  avatar: z.string().trim().url().nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().trim().min(1).max(100).optional(),
  role: z.enum(["admin", "user"]).default("user"),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
