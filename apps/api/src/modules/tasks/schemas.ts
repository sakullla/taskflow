import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(500, "Task title is too long"),
  note: z.string().max(10000, "Note is too long").optional(),
  listId: z.string().uuid("Invalid list ID").optional(),
  isImportant: z.boolean().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  reminderAt: z.string().datetime().optional().nullable(),
  priority: z.enum(["low", "normal", "high"]).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  note: z.string().max(10000).optional(),
  listId: z.string().uuid().optional(),
  isCompleted: z.boolean().optional(),
  isImportant: z.boolean().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  reminderAt: z.string().datetime().optional().nullable(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  order: z.number().int().min(0).optional(),
});

export const taskQuerySchema = z.object({
  listId: z.string().uuid().optional(),
  isCompleted: z.enum(["true", "false"]).optional(),
  isImportant: z.enum(["true", "false"]).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
