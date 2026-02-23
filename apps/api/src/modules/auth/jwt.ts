import jwt from "@fastify/jwt";
import fp from "fastify-plugin";
import { env } from "../../config/env.js";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { TokenPayload } from "./schemas.js";

// Extend Fastify types
declare module "fastify" {
  interface FastifyRequest {
    user: TokenPayload;
  }
}

export const jwtPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  // Add authenticate decorator
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest) => {
      try {
        const verifiedPayload = await request.jwtVerify<TokenPayload>();
        request.user = verifiedPayload;
      } catch {
        throw new Error("Unauthorized");
      }
    }
  );
});

export function generateToken(_payload: TokenPayload): string {
  // Use JWT sign through fastify-jwt in routes
  // This is a placeholder for the actual implementation
  return "token";
}
