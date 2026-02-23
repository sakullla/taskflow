import { z } from "zod";

export const createListSchema = z.object({
  name: z.string().min(1, "List name is required").max(100, "List name is too long"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

export const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isArchived: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
