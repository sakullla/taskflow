import fastify from "fastify";
import cors from "@fastify/cors";
// import jwt from "@fastify/jwt";
// JWT is disabled for now
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./config/env.js";
import { authRoutes } from "./modules/auth/routes.js";
import { listRoutes } from "./modules/lists/routes.js";
import { taskRoutes } from "./modules/tasks/routes.js";
import { stepRoutes } from "./modules/steps/routes.js";
import { myDayRoutes } from "./modules/my-day/routes.js";
import { AppError } from "./shared/errors/index.js";
import type { FastifyError, FastifyInstance, FastifyRequest } from "fastify";

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user: {
      userId: string;
      email: string;
    };
  }
}

export async function createApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === "development" ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      } : undefined,
    },
  });

  // Register plugins
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  // JWT plugin disabled for now
  // await app.register(jwt, {
  //   secret: env.JWT_SECRET,
  //   sign: {
  //     expiresIn: env.JWT_EXPIRES_IN,
  //   },
  // });

  // JWT authenticate decorator (mock for now)
  app.decorate(
    "authenticate",
    async (request: FastifyRequest) => {
      // Mock authentication - use demo user
      request.user = { userId: "demo-user", email: "demo@example.com" };
    }
  );

  // Swagger documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Todo API",
        description: "Production-ready Todo API",
        version: "2.0.0",
      },
      servers: [
        {
          url: "http://localhost:4000",
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });

  // Health check
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // API routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(listRoutes, { prefix: "/api/lists" });
  await app.register(taskRoutes, { prefix: "/api/tasks" });
  await app.register(stepRoutes, { prefix: "/api/tasks/:taskId/steps" });
  await app.register(myDayRoutes, { prefix: "/api/my-day" });

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });

  // Error handler
  app.setErrorHandler((error: FastifyError, _request, reply): void => {
    // AppError handling
    if (error instanceof AppError) {
      reply.status(error.statusCode).send(error.toJSON());
      return;
    }

    // Zod validation error
    if (error.name === "ZodError") {
      reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.message,
        },
      });
      return;
    }

    // JWT error (disabled for now)
    // if (error.code === "FST_JWT_NO_AUTHORIZATION_IN_COOKIE" || error.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER") {
    //   return reply.status(401).send({
    //     success: false,
    //     error: {
    //       code: "UNAUTHORIZED",
    //       message: "Authentication required",
    //     },
    //   });
    // }

    // Log error
    app.log.error(error);

    // Generic error
    const statusCode = error.statusCode ?? 500;
    void reply.status(statusCode).send({
      success: false,
      error: {
        code: statusCode === 500 ? "INTERNAL_ERROR" : "ERROR",
        message: env.NODE_ENV === "production"
          ? "An error occurred"
          : error.message,
      },
    });
  });

  return app;
}
