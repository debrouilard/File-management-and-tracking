import { prisma } from "../utils/prisma.js";
import { formatDisplayId } from "../utils/fileDisplay.js";

export async function createNotificationsForUsers(entries) {
  const unique = entries.filter(Boolean);
  if (!unique.length) return [];
  return prisma.$transaction(
    unique.map((e) =>
      prisma.notification.create({
        data: {
          userId: e.userId,
          type: e.type,
          title: e.title,
          message: e.message,
          fileRecordId: e.fileRecordId ?? null,
        },
      })
    )
  );
}

export async function notifyUsersByDepartment(deptId, payload) {
  const users = await prisma.user.findMany({
    where: { departmentId: deptId },
    select: { id: true },
  });
  const rows = users.map((u) => ({ userId: u.id, ...payload }));
  return createNotificationsForUsers(rows);
}

export function emitToUsers(io, eventName, notifications) {
  if (!io) return;
  for (const n of notifications) {
    io.to(`user:${n.userId}`).emit(eventName, {
      notificationId: n.id,
      fileRecordId: n.fileRecordId,
      message: n.message,
      title: n.title,
      type: n.type,
      timestamp: n.createdAt.toISOString(),
      read: n.read,
    });
  }
}

export function buildFileMessage(prefix, fileNumber, suffix) {
  const id = formatDisplayId(prefix, fileNumber);
  return `${id} — ${suffix}`;
}
