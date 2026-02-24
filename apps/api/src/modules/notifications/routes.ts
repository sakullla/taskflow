import type { FastifyInstance } from "fastify";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "./service.js";

export async function notificationRoutes(fastify: FastifyInstance) {
  // Get all notifications for user
  fastify.get("/", async (request, reply) => {
    const { unreadOnly } = request.query as { unreadOnly?: string };
    const notifications = await getNotifications(
      request.user.userId,
      unreadOnly === "true"
    );
    reply.send({ success: true, data: notifications });
  });

  // Mark notification as read
  fastify.patch("/:id/read", async (request, reply) => {
    const { id } = request.params as { id: string };
    const notification = await markAsRead(id, request.user.userId);
    reply.send({ success: true, data: notification });
  });

  // Mark all as read
  fastify.patch("/read-all", async (request, reply) => {
    await markAllAsRead(request.user.userId);
    reply.send({ success: true, message: "All notifications marked as read" });
  });

  // Delete notification
  fastify.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteNotification(id, request.user.userId);
    reply.send({ success: true, message: "Notification deleted" });
  });
}
