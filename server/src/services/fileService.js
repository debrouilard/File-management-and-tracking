import fs from "fs";
import path from "path";
import { prisma } from "../utils/prisma.js";
import { generateUniqueFileId } from "../utils/fileId.js";
import { createNotificationsForUsers, emitToUsers } from "./notificationService.js";

export function canAccessFile(user, file) {
  if (user.role === "ADMIN") return true;
  if (file.senderDeptId === user.departmentId) return true;
  if (file.receiverDeptId && file.receiverDeptId === user.departmentId) return true;
  return false;
}

export async function assertFileAccess(user, fileRecordId) {
  const file = await prisma.fileRecord.findUnique({
    where: { id: fileRecordId },
  });
  if (!file) {
    const err = new Error("File not found");
    err.status = 404;
    throw err;
  }
  if (!canAccessFile(user, file)) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return file;
}

async function usersInDepartment(deptId) {
  const users = await prisma.user.findMany({
    where: { departmentId: deptId },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function createFileRecord(user, { title, description }, diskPath, originalName, fileId) {
  const rel = path.relative(process.cwd(), diskPath).split(path.sep).join("/");

  return prisma.fileRecord.create({
    data: {
      fileId,
      title: title.trim(),
      description: description?.trim() || null,
      filePath: rel,
      originalName,
      status: "PENDING",
      senderDeptId: user.departmentId,
      receiverDeptId: null,
      histories: {
        create: {
          fileId,
          action: "CREATED",
        },
      },
    },
    include: {
      senderDept: true,
      receiverDept: true,
    },
  });
}

export async function sendFile(user, fileRecordId, receiverDeptId, io) {
  const file = await assertFileAccess(user, fileRecordId);
  if (file.senderDeptId !== user.departmentId) {
    const err = new Error("Only the sending department can dispatch this file");
    err.status = 403;
    throw err;
  }
  if (file.status !== "PENDING") {
    const err = new Error("File must be pending before it can be sent");
    err.status = 400;
    throw err;
  }
  if (receiverDeptId === file.senderDeptId) {
    const err = new Error("Receiver must be a different department");
    err.status = 400;
    throw err;
  }

  const receiver = await prisma.department.findUnique({ where: { id: receiverDeptId } });
  if (!receiver) {
    const err = new Error("Receiver department not found");
    err.status = 404;
    throw err;
  }

  const updated = await prisma.fileRecord.update({
    where: { id: file.id },
    data: {
      status: "SENT",
      receiverDeptId,
      histories: {
        create: { fileId: file.fileId, action: "SENT" },
      },
    },
    include: { senderDept: true, receiverDept: true },
  });

  const targets = await usersInDepartment(receiverDeptId);
  const msg = `File ${file.fileId} was sent to ${receiver.prefix} — ${file.title}`;
  const notes = await createNotificationsForUsers(targets, msg, file.fileId);
  emitToUsers(io, "file_sent", notes);

  return updated;
}

export async function markReceivedIfViewer(user, file, io) {
  if (file.status !== "SENT" || !file.receiverDeptId) return file;
  if (user.role === "ADMIN") return file;
  if (file.receiverDeptId !== user.departmentId) return file;

  const updated = await prisma.fileRecord.update({
    where: { id: file.id },
    data: {
      status: "RECEIVED",
      histories: {
        create: { fileId: file.fileId, action: "RECEIVED" },
      },
    },
    include: { senderDept: true, receiverDept: true },
  });

  const targets = await usersInDepartment(file.senderDeptId);
  const msg = `File ${file.fileId} was received by ${updated.receiverDept?.prefix} — ${file.title}`;
  const notes = await createNotificationsForUsers(targets, msg, file.fileId);
  emitToUsers(io, "file_received", notes);

  return updated;
}

export async function rejectFile(user, fileRecordId, io) {
  const file = await assertFileAccess(user, fileRecordId);
  const canReject =
    user.role === "ADMIN" ||
    (file.receiverDeptId && file.receiverDeptId === user.departmentId);
  if (!canReject) {
    const err = new Error("Only the receiving department can reject");
    err.status = 403;
    throw err;
  }
  if (file.status !== "SENT") {
    const err = new Error("Only sent files can be rejected");
    err.status = 400;
    throw err;
  }

  const updated = await prisma.fileRecord.update({
    where: { id: file.id },
    data: {
      status: "REJECTED",
      histories: {
        create: { fileId: file.fileId, action: "REJECTED" },
      },
    },
    include: { senderDept: true, receiverDept: true },
  });

  const targets = await usersInDepartment(file.senderDeptId);
  const msg = `File ${file.fileId} was rejected by ${updated.receiverDept?.prefix} — ${file.title}`;
  const notes = await createNotificationsForUsers(targets, msg, file.fileId);
  emitToUsers(io, "file_rejected", notes);

  return updated;
}

export async function listFilesForUser(user, query) {
  const { status, departmentId, q } = query;
  const and = [];

  if (user.role !== "ADMIN") {
    and.push({
      OR: [
        { senderDeptId: user.departmentId },
        { receiverDeptId: user.departmentId },
      ],
    });
  }

  if (status) and.push({ status });
  if (departmentId) {
    and.push({
      OR: [{ senderDeptId: departmentId }, { receiverDeptId: departmentId }],
    });
  }
  if (q?.trim()) {
    const term = q.trim();
    and.push({
      OR: [
        { fileId: { contains: term, mode: "insensitive" } },
        { title: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  return prisma.fileRecord.findMany({
    where: and.length ? { AND: and } : {},
    orderBy: { createdAt: "desc" },
    include: {
      senderDept: { select: { id: true, name: true, prefix: true } },
      receiverDept: { select: { id: true, name: true, prefix: true } },
    },
  });
}

export async function dashboardSummary(user) {
  if (user.role === "ADMIN") {
    const [pending, sent, received, rejected] = await Promise.all([
      prisma.fileRecord.count({ where: { status: "PENDING" } }),
      prisma.fileRecord.count({ where: { status: "SENT" } }),
      prisma.fileRecord.count({ where: { status: "RECEIVED" } }),
      prisma.fileRecord.count({ where: { status: "REJECTED" } }),
    ]);
    return { pending, sent, received, rejected };
  }

  const dept = user.departmentId;
  const [pending, sent, received, rejected] = await Promise.all([
    prisma.fileRecord.count({ where: { status: "PENDING", senderDeptId: dept } }),
    prisma.fileRecord.count({ where: { status: "SENT", senderDeptId: dept } }),
    prisma.fileRecord.count({ where: { status: "RECEIVED", receiverDeptId: dept } }),
    prisma.fileRecord.count({ where: { status: "REJECTED", senderDeptId: dept } }),
  ]);

  return { pending, sent, received, rejected };
}

export async function getHistory(fileRecordId) {
  return prisma.fileHistory.findMany({
    where: { fileRecordId },
    orderBy: { timestamp: "asc" },
  });
}

export async function deleteFileRecord(user, fileRecordId) {
  const file = await assertFileAccess(user, fileRecordId);
  if (file.senderDeptId !== user.departmentId) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  if (file.status !== "PENDING") {
    const err = new Error("Only pending drafts can be deleted");
    err.status = 400;
    throw err;
  }

  const abs = path.join(process.cwd(), file.filePath);
  await prisma.fileRecord.delete({ where: { id: file.id } });
  fs.rm(path.dirname(abs), { recursive: true, force: true }, () => {});
}

export { generateUniqueFileId };
