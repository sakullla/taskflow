import type { FastifyInstance } from "fastify";
import { createStepSchema, updateStepSchema } from "./schemas.js";
import { getSteps, createStep, updateStep, deleteStep, reorderSteps } from "./service.js";

export async function stepRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  // GET /tasks/:taskId/steps
  fastify.get("/", async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const steps = await getSteps(taskId, request.user.userId);
    reply.send({ success: true, data: steps });
  });

  // POST /tasks/:taskId/steps
  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", minLength: 1, maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      const { taskId } = request.params as { taskId: string };
      const data = createStepSchema.parse(request.body);
      const step = await createStep(taskId, request.user.userId, data);
      reply.status(201).send({ success: true, data: step });
    }
  );

  // PATCH /steps/:id
  fastify.patch(
    "/:id",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            title: { type: "string", minLength: 1, maxLength: 500 },
            isCompleted: { type: "boolean" },
            order: { type: "integer", minimum: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = updateStepSchema.parse(request.body);
      const step = await updateStep(id, request.user.userId, data);
      reply.send({ success: true, data: step });
    }
  );

  // DELETE /steps/:id
  fastify.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await deleteStep(id, request.user.userId);
    reply.send({ success: true, data: result });
  });

  // POST /tasks/:taskId/steps/reorder
  fastify.post(
    "/reorder",
    {
      schema: {
        body: {
          type: "object",
          required: ["stepIds"],
          properties: {
            stepIds: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      const { taskId } = request.params as { taskId: string };
      const { stepIds } = request.body as { stepIds: string[] };
      const steps = await reorderSteps(taskId, request.user.userId, stepIds);
      reply.send({ success: true, data: steps });
    }
  );
}
