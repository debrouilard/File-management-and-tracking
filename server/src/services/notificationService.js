import { prisma } from "../utils/prisma.js";

export async function createNotificationsForUsers(userIds, message, fileId) {
  const unique = [...new Set(userIds)];
  return prisma.$transaction(
    unique.map((userId) =>
      prisma.notification.create({
        data: { userId, message, fileId },
      })
    )
  );
}

export function emitToUsers(io, eventName, notifications) {
  if (!io) return;
  for (const n of notifications) {
    io.to(`user:${n.userId}`).emit(eventName, {
      notificationId: n.id,
      fileId: n.fileId,
      message: n.message,
      timestamp: n.createdAt.toISOString(),
      read: n.read,
    });
  }
}
