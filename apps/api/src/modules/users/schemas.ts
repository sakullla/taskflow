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

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
