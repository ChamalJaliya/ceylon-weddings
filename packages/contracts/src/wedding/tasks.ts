import { z } from "zod";
import { taskStatusSchema } from "./enums";

export const taskSchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  title: z.string(),
  dueAt: z.string().nullable(),
  status: taskStatusSchema,
  category: z.string().nullable(),
  assigneeUserId: z.string().nullable(),
});

export const createTaskBodySchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  dueAt: z.string().nullable().optional(),
  assigneeUserId: z.string().nullable().optional(),
  status: taskStatusSchema.default("TODO"),
});

export const updateTaskBodySchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  assigneeUserId: z.string().nullable().optional(),
  status: taskStatusSchema.optional(),
});

export type Task = z.infer<typeof taskSchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
