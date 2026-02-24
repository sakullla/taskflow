import type { FastifyInstance } from "fastify";
import { changePasswordSchema, updateProfileSchema } from "./schemas.js";
import { changePassword, getUserById, getUsers, updateProfile } from "./service.js";

export async function userRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", fastify.authenticate);

  // GET /users - user management list (demo mode: all authenticated users)
  fastify.get("/", async (_request, reply) => {
    const users = await getUsers();
    reply.send({ success: true, data: users });
  });

  // GET /users/me
  fastify.get("/me", async (request, reply) => {
    const user = await getUserById(request.user.userId);
    reply.send({ success: true, data: user });
  });

  // PATCH /users/me
  fastify.patch("/me", async (request, reply) => {
    const payload = updateProfileSchema.parse(request.body);
    const user = await updateProfile(request.user.userId, payload);
    reply.send({ success: true, data: user });
  });

  // PATCH /users/me/password
  fastify.patch("/me/password", async (request, reply) => {
    const payload = changePasswordSchema.parse(request.body);
    await changePassword(request.user.userId, payload);
    reply.send({ success: true, message: "Password changed successfully" });
  });
}
