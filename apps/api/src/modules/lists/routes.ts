import type { FastifyInstance } from "fastify";
import { createListSchema, updateListSchema } from "./schemas.js";
import { getLists, getListById, createList, updateList, deleteList } from "./service.js";

export async function listRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  // GET /lists
  fastify.get("/", async (request, reply) => {
    const lists = await getLists(request.user.userId);
    reply.send({ success: true, data: lists });
  });

  // GET /lists/:id
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const list = await getListById(id, request.user.userId);
    reply.send({ success: true, data: list });
  });

  // POST /lists
  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 100 },
            color: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
          },
        },
      },
    },
    async (request, reply) => {
      const data = createListSchema.parse(request.body);
      const list = await createList(request.user.userId, data);
      reply.status(201).send({ success: true, data: list });
    }
  );

  // PATCH /lists/:id
  fastify.patch(
    "/:id",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 100 },
            color: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
            isArchived: { type: "boolean" },
            order: { type: "integer", minimum: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = updateListSchema.parse(request.body);
      const list = await updateList(id, request.user.userId, data);
      reply.send({ success: true, data: list });
    }
  );

  // DELETE /lists/:id
  fastify.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await deleteList(id, request.user.userId);
    reply.send({ success: true, data: result });
  });
}
