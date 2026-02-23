import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getMyDayTasks, addTaskToMyDay, removeTaskFromMyDay, getMyDayHistory } from "./service.js";

// Date schema for validation: YYYY-MM-DD (used in route schemas)
void z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function myDayRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  // GET /my-day
  fastify.get("/", async (request, reply) => {
    const { date } = request.query as { date?: string };
    const result = await getMyDayTasks(request.user.userId, date);
    reply.send({ success: true, data: result });
  });

  // GET /my-day/history
  fastify.get("/history", async (request, reply) => {
    const { limit } = request.query as { limit?: string };
    const history = await getMyDayHistory(request.user.userId, limit ? parseInt(limit) : 30);
    reply.send({ success: true, data: history });
  });

  // POST /my-day
  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["taskId"],
          properties: {
            taskId: { type: "string", format: "uuid" },
            date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          },
        },
      },
    },
    async (request, reply) => {
      const { taskId, date } = request.body as { taskId: string; date?: string };
      const entry = await addTaskToMyDay(request.user.userId, taskId, date);
      reply.status(201).send({ success: true, data: entry });
    }
  );

  // DELETE /my-day/:taskId
  fastify.delete("/:taskId", async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const { date } = request.query as { date?: string };
    const result = await removeTaskFromMyDay(request.user.userId, taskId, date);
    reply.send({ success: true, data: result });
  });
}
