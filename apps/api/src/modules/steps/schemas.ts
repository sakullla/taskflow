import { z } from "zod";

export const createStepSchema = z.object({
  title: z.string().min(1, "Step title is required").max(500, "Step title is too long"),
});

export const updateStepSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export type CreateStepInput = z.infer<typeof createStepSchema>;
export type UpdateStepInput = z.infer<typeof updateStepSchema>;
