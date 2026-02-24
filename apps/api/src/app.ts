import fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import fs from "node:fs";
import path from "node:path";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./config/env.js";
import { db } from "./config/db.js";
import { authRoutes } from "./modules/auth/routes.js";
import { listRoutes } from "./modules/lists/routes.js";
import { taskRoutes } from "./modules/tasks/routes.js";
import { stepRoutes } from "./modules/steps/routes.js";
import { myDayRoutes } from "./modules/my-day/routes.js";
import { notificationRoutes } from "./modules/notifications/routes.js";
import { userRoutes } from "./modules/users/routes.js";
import { checkTaskReminders, checkDueTasks } from "./modules/notifications/service.js";
import { AppError, AuthenticationError } from "./shared/errors/index.js";
import { tokenPayloadSchema, type TokenPayload } from "./modules/auth/schemas.js";
import type { FastifyError, FastifyInstance, FastifyRequest } from "fastify";

// Extend Fastify types
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
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

  const allowedOrigins = env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  // Register plugins
  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || env.NODE_ENV !== "production") {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  app.decorate("authenticate", async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
      const parsed = tokenPayloadSchema.safeParse(request.user);
      if (!parsed.success) {
        throw new AuthenticationError("Invalid token payload");
      }

      const user = db.users.get(parsed.data.userId);
      if (!user) {
        throw new AuthenticationError("User not found");
      }
      if (user.isActive === false) {
        throw new AuthenticationError("User is disabled");
      }
    } catch {
      throw new AuthenticationError("Authentication required");
    }
  });

  // Swagger documentation
  if (env.ENABLE_API_DOCS) {
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
  }

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
  await app.register(notificationRoutes, { prefix: "/api/notifications" });
  await app.register(userRoutes, { prefix: "/api/users" });

  // Serve built web app from the API container in production.
  const webDistPath = path.resolve(process.cwd(), "../web/dist");
  const hasWebDist = fs.existsSync(webDistPath);

  if (env.NODE_ENV === "production" && hasWebDist) {
    await app.register(fastifyStatic, {
      root: webDistPath,
      prefix: "/",
      index: false,
      // Avoid registering plugin wildcard route so SPA fallback can own GET /*.
      wildcard: false,
    });

    app.get("/*", async (request, reply) => {
      if (
        request.url.startsWith("/api") ||
        request.url.startsWith("/docs") ||
        request.url === "/health"
      ) {
        return reply.callNotFound();
      }

      return reply.sendFile("index.html");
    });
  }

  const runNotificationChecks = async () => {
    try {
      await checkTaskReminders();
      await checkDueTasks();
    } catch (error) {
      app.log.error(error, "Error checking notifications");
    }
  };

  // Run once on startup so users can see initial notifications immediately.
  void runNotificationChecks();

  // Continue checking every minute.
  setInterval(runNotificationChecks, 60 * 1000);

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    if (!request.url.startsWith("/api")) {
      reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Not found" } });
      return;
    }

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

    // JWT error
    if (
      error.code === "FST_JWT_NO_AUTHORIZATION_IN_COOKIE" ||
      error.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER" ||
      error.code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED" ||
      error.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID"
    ) {
      reply.status(401).send({
        success: false,
        error: {
          code: "AUTHENTICATION_ERROR",
          message: "Authentication required",
        },
      });
      return;
    }

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
