import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import { AuthenticationError, TooManyRequestsError } from "../../shared/errors/index.js";
import { LoginRateLimiter } from "../../shared/security/login-rate-limit.js";
import { loginSchema, registerSchema } from "./schemas.js";
import { loginUser, registerUser, getCurrentUser } from "./service.js";

const loginRateLimiter = new LoginRateLimiter(
  env.AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  env.AUTH_RATE_LIMIT_WINDOW_MS
);

function getAttemptKey(email: string, ip: string): string {
  return `${email.toLowerCase()}:${ip}`;
}

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
            password: { type: "string", minLength: 8 },
            name: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const data = registerSchema.parse(request.body);
      const result = await registerUser(data);
      const token = fastify.jwt.sign({
        userId: result.user.id,
        email: result.user.email,
      });

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
            password: { type: "string", minLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      const data = loginSchema.parse(request.body);
      const key = getAttemptKey(data.email, request.ip);

      if (loginRateLimiter.isBlocked(key)) {
        throw new TooManyRequestsError("Too many failed login attempts, try again later");
      }

      try {
        const result = await loginUser(data);
        const token = fastify.jwt.sign({
          userId: result.user.id,
          email: result.user.email,
        });

        loginRateLimiter.reset(key);

        reply.send({
          success: true,
          data: {
            user: result.user,
            token,
          },
        });
      } catch (error) {
        if (error instanceof AuthenticationError) {
          loginRateLimiter.recordFailure(key);
        }
        throw error;
      }
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
