import type { FastifyInstance } from "fastify";
import type { z } from "zod";
import { ValidationError } from "../../shared/errors/index.js";
import { changePasswordSchema, createUserSchema, updateProfileSchema, updateUserStatusSchema } from "./schemas.js";
import { changePassword, createUserByAdmin, getUserById, getUsers, updateProfile, updateUserStatusByAdmin } from "./service.js";

function parsePayload<T extends z.ZodTypeAny>(
  schema: T,
  payload: unknown
) : z.infer<T> {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Validation failed";
    throw new ValidationError(message);
  }
  return result.data;
}

export async function userRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", fastify.authenticate);

  // GET /users - user management list (demo mode: all authenticated users)
  fastify.get("/", async (request, reply) => {
    const users = await getUsers(request.user.userId);
    reply.send({ success: true, data: users });
  });

  // POST /users - admin creates a user
  fastify.post("/", async (request, reply) => {
    const payload = parsePayload(createUserSchema, request.body);
    const user = await createUserByAdmin(request.user.userId, payload);
    reply.status(201).send({ success: true, data: user });
  });

  // PATCH /users/:id/status - admin enables/disables user
  fastify.patch("/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const payload = parsePayload(updateUserStatusSchema, request.body);
    const user = await updateUserStatusByAdmin(request.user.userId, id, payload);
    reply.send({ success: true, data: user });
  });

  // GET /users/me
  fastify.get("/me", async (request, reply) => {
    const user = await getUserById(request.user.userId);
    reply.send({ success: true, data: user });
  });

  // PATCH /users/me
  fastify.patch("/me", async (request, reply) => {
    const payload = parsePayload(updateProfileSchema, request.body);
    const user = await updateProfile(request.user.userId, payload);
    reply.send({ success: true, data: user });
  });

  // PATCH /users/me/password
  fastify.patch("/me/password", async (request, reply) => {
    const payload = parsePayload(changePasswordSchema, request.body);
    await changePassword(request.user.userId, payload);
    reply.send({ success: true, message: "Password changed successfully" });
  });
}
