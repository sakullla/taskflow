import type { FastifyInstance } from "fastify";
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from "./schemas.js";
import { getTasks, getTaskById, createTask, updateTask, deleteTask, getImportantTasks, getPlannedTasks } from "./service.js";

export async function taskRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  // GET /tasks
  fastify.get("/", async (request, reply) => {
    const query = taskQuerySchema.parse(request.query);
    const tasks = await getTasks(request.user.userId, query);
    reply.send({ success: true, data: tasks });
  });

  // GET /tasks/important
  fastify.get("/important", async (request, reply) => {
    const tasks = await getImportantTasks(request.user.userId);
    reply.send({ success: true, data: tasks });
  });

  // GET /tasks/planned
  fastify.get("/planned", async (request, reply) => {
    const tasks = await getPlannedTasks(request.user.userId);
    reply.send({ success: true, data: tasks });
  });

  // GET /tasks/search
  fastify.get("/search", async (request, reply) => {
    const query = taskQuerySchema.parse(request.query);
    const tasks = await getTasks(request.user.userId, { ...query, search: query.search || "" });
    reply.send({ success: true, data: tasks });
  });

  // GET /tasks/:id
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const task = await getTaskById(id, request.user.userId);
    reply.send({ success: true, data: task });
  });

  // POST /tasks
  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", minLength: 1, maxLength: 500 },
            note: { type: "string", maxLength: 10000 },
            listId: { type: "string", format: "uuid" },
            isImportant: { type: "boolean" },
            dueDate: { type: "string", format: "date-time" },
            reminderAt: { type: "string", format: "date-time" },
            priority: { type: "string", enum: ["low", "normal", "high"] },
          },
        },
      },
    },
    async (request, reply) => {
      const data = createTaskSchema.parse(request.body);
      const task = await createTask(request.user.userId, data);
      reply.status(201).send({ success: true, data: task });
    }
  );

  // PATCH /tasks/:id
  fastify.patch(
    "/:id",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            title: { type: "string", minLength: 1, maxLength: 500 },
            note: { type: "string", maxLength: 10000 },
            listId: { type: "string", format: "uuid" },
            isCompleted: { type: "boolean" },
            isImportant: { type: "boolean" },
            dueDate: { type: ["string", "null"], format: "date-time" },
            reminderAt: { type: ["string", "null"], format: "date-time" },
            priority: { type: "string", enum: ["low", "normal", "high"] },
            order: { type: "integer", minimum: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = updateTaskSchema.parse(request.body);
      const task = await updateTask(id, request.user.userId, data);
      reply.send({ success: true, data: task });
    }
  );

  // DELETE /tasks/:id
  fastify.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await deleteTask(id, request.user.userId);
    reply.send({ success: true, data: result });
  });
}
