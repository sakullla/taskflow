import type { FastifyInstance } from "fastify";
import { loginSchema, registerSchema } from "./schemas.js";
import { loginUser, registerUser, getCurrentUser } from "./service.js";

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/register
  fastify.post(
    "/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            name: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const data = registerSchema.parse(request.body);
      const result = await registerUser(data);

      // Mock token
      const token = "mock-jwt-token";

      reply.status(201).send({
        success: true,
        data: {
          user: result.user,
          token,
        },
      });
    }
  );

  // POST /auth/login
  fastify.post(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const data = loginSchema.parse(request.body);
      const result = await loginUser(data);

      // Mock token
      const token = "mock-jwt-token";

      reply.send({
        success: true,
        data: {
          user: result.user,
          token,
        },
      });
    }
  );

  // GET /auth/me - Get current user
  fastify.get(
    "/me",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const user = await getCurrentUser(request.user.userId);

      reply.send({
        success: true,
        data: user,
      });
    }
  );
}
