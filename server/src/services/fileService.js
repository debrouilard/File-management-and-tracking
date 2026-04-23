import fs from "fs";
import path from "path";
import { prisma } from "../utils/prisma.js";
import { moveTempToFinal } from "../storage/localStorageAdapter.js";
import { formatDisplayId, parseCombinedId, serializeFileRecord, serializeFileRecords } from "../utils/fileDisplay.js";
import {
  buildFileMessage,
  createNotificationsForUsers,
  emitToUsers,
  notifyUsersByDepartment,
} from "./notificationService.js";
import { writeAudit } from "./auditService.js";
import { withRetry } from "../utils/retry.js";

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function canAccessFile(user, file) {
  if (user.role === "ADMIN") return true;
  if (file.senderDeptId === user.departmentId) return true;
  if (file.receiverDeptId && file.receiverDeptId === user.departmentId) return true;
  return false;
}

export async function assertFileAccess(user, fileRecordId) {
  const file = await prisma.fileRecord.findUnique({
    where: { id: fileRecordId },
    include: {
      senderDept: { select: { id: true, name: true, prefix: true } },
      receiverDept: { select: { id: true, name: true, prefix: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
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

function isReceiverSide(user, file) {
  return user.role === "ADMIN" || (file.receiverDeptId && file.receiverDeptId === user.departmentId);
}

function isSenderSide(user, file) {
  return user.role === "ADMIN" || file.senderDeptId === user.departmentId;
}

export async function createFileRecord(
  reqCtx,
  user,
  { title, description, priority },
  tempAbsolutePath,
  originalName,
  mimeType,
  sizeBytes
) {
  const dept = await prisma.department.findUnique({ where: { id: user.departmentId } });
  if (!dept) {
    const err = new Error("Department missing");
    err.status = 400;
    throw err;
  }

  const record = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const created = await tx.fileRecord.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          priority,
          status: "DRAFT",
          senderDeptId: user.departmentId,
          receiverDeptId: null,
          createdById: user.id,
          filePath: "__pending__",
          originalName,
          mimeType: mimeType || null,
          sizeBytes: sizeBytes ?? null,
        },
        include: { senderDept: true },
      });

      const rel = await moveTempToFinal({
        tempAbsolutePath,
        departmentPrefix: dept.prefix,
        fileNumber: created.fileNumber,
        originalName,
      });

      return tx.fileRecord.update({
        where: { id: created.id },
        data: { filePath: rel },
        include: {
          senderDept: { select: { id: true, name: true, prefix: true } },
          receiverDept: { select: { id: true, name: true, prefix: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });
    })
  );

  await writeAudit({
    userId: user.id,
    action: "FILE_CREATED",
    resourceType: "FILE",
    resourceId: record.id,
    metadata: {
      displayId: formatDisplayId(record.senderDept.prefix, record.fileNumber),
      title: record.title,
      priority: record.priority,
    },
    ipAddress: reqCtx.ip,
    userAgent: reqCtx.get("user-agent"),
  });

  if (record.priority === "HIGH") {
    const ids = await usersInDepartment(user.departmentId);
    const notes = await createNotificationsForUsers(
      ids.map((userId) => ({
        userId,
        type: "HIGH_PRIORITY",
        title: "High priority file registered",
        message: buildFileMessage(record.senderDept.prefix, record.fileNumber, record.title),
        fileRecordId: record.id,
      }))
    );
    const io = reqCtx.app?.get("io");
    emitToUsers(io, "notification", notes);
  }

  return serializeFileRecord(record);
}

export async function sendFile(reqCtx, user, fileRecordId, receiverDeptId, io) {
  const file = await assertFileAccess(user, fileRecordId);
  if (!isSenderSide(user, file)) {
    const err = new Error("Only the sending department can dispatch this file");
    err.status = 403;
    throw err;
  }
  if (file.status !== "DRAFT") {
    const err = new Error("Only draft files can be sent");
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

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.fileRecord.update({
      where: { id: file.id },
      data: {
        status: "SENT",
        receiverDeptId,
      },
      include: {
        senderDept: { select: { id: true, name: true, prefix: true } },
        receiverDept: { select: { id: true, name: true, prefix: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.fileTransfer.create({
      data: {
        fileRecordId: file.id,
        fromDeptId: file.senderDeptId,
        toDeptId: receiverDeptId,
        transferredByUserId: user.id,
      },
    });

    return u;
  });

  await writeAudit({
    userId: user.id,
    action: "FILE_SENT",
    resourceType: "FILE",
    resourceId: file.id,
    metadata: {
      to: receiver.prefix,
      displayId: formatDisplayId(updated.senderDept.prefix, updated.fileNumber),
    },
    ipAddress: reqCtx.ip,
    userAgent: reqCtx.get("user-agent"),
  });

  const targets = await usersInDepartment(receiverDeptId);
  const msg = buildFileMessage(updated.senderDept.prefix, updated.fileNumber, `Sent from ${updated.senderDept.prefix} — ${updated.title}`);
  const notes = await createNotificationsForUsers(
    targets.map((userId) => ({
      userId,
      type: "FILE_SENT",
      title: "Incoming file",
      message: msg,
      fileRecordId: updated.id,
    }))
  );
  emitToUsers(io, "notification", notes);

  if (updated.priority === "HIGH") {
    const extra = await notifyUsersByDepartment(receiverDeptId, {
      type: "HIGH_PRIORITY",
      title: "High priority file in transit",
      message: msg,
      fileRecordId: updated.id,
    });
    emitToUsers(io, "notification", extra);
  }

  return serializeFileRecord(updated);
}

export async function markReceivedIfViewer(reqCtx, user, file, io) {
  if (file.status !== "SENT" || !file.receiverDeptId) return serializeFileRecord(file);
  if (user.role === "ADMIN") return serializeFileRecord(file);
  if (file.receiverDeptId !== user.departmentId) return serializeFileRecord(file);

  const updated = await prisma.fileRecord.update({
    where: { id: file.id },
    data: {
      status: "RECEIVED",
    },
    include: {
      senderDept: { select: { id: true, name: true, prefix: true } },
      receiverDept: { select: { id: true, name: true, prefix: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  await writeAudit({
    userId: user.id,
    action: "FILE_RECEIVED",
    resourceType: "FILE",
    resourceId: file.id,
    metadata: { displayId: formatDisplayId(updated.senderDept.prefix, updated.fileNumber) },
    ipAddress: reqCtx.ip,
    userAgent: reqCtx.get("user-agent"),
  });

  const targets = await usersInDepartment(file.senderDeptId);
  const msg = buildFileMessage(
    updated.receiverDept.prefix,
    updated.fileNumber,
    `Received by ${updated.receiverDept.prefix} — ${updated.title}`
  );
  const notes = await createNotificationsForUsers(
    targets.map((userId) => ({
      userId,
      type: "FILE_RECEIVED",
      title: "File received",
      message: msg,
      fileRecordId: updated.id,
    }))
  );
  emitToUsers(io, "notification", notes);

  return serializeFileRecord(updated);
}

export async function markReceivedExplicit(reqCtx, user, fileRecordId, io) {
  const file = await assertFileAccess(user, fileRecordId);
  if (!isReceiverSide(user, file)) {
    const err = new Error("Only the receiving department can acknowledge receipt");
    err.status = 403;
    throw err;
  }
  if (file.status !== "SENT") {
    const err = new Error("Only sent files can be marked as received");
    err.status = 400;
    throw err;
  }
  return markReceivedIfViewer(reqCtx, user, file, io);
}

export async function updateFileStatus(reqCtx, user, fileRecordId, nextStatus, io) {
  const file = await assertFileAccess(user, fileRecordId);
  const status = nextStatus;

  const allowedReceiver = ["RECEIVED", "UNDER_REVIEW", "APPROVED", "REJECTED"];
  const allowedSenderArchive = ["ARCHIVED"];

  if (status === "ARCHIVED") {
    if (user.role !== "ADMIN" && file.senderDeptId !== user.departmentId) {
      const err = new Error("Only admin or the sender department can archive");
      err.status = 403;
      throw err;
    }
  } else if (allowedReceiver.includes(status)) {
    if (!isReceiverSide(user, file)) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }
  } else {
    const err = new Error("Invalid status transition target");
    err.status = 400;
    throw err;
  }

  const current = file.status;
  const ok =
    (status === "RECEIVED" && current === "SENT") ||
    (status === "UNDER_REVIEW" && (current === "RECEIVED" || current === "SENT")) ||
    (status === "APPROVED" && (current === "UNDER_REVIEW" || current === "RECEIVED")) ||
    (status === "REJECTED" && (current === "SENT" || current === "RECEIVED" || current === "UNDER_REVIEW")) ||
    (status === "ARCHIVED" && current !== "ARCHIVED");

  if (!ok) {
    const err = new Error(`Cannot move from ${current} to ${status}`);
    err.status = 400;
    throw err;
  }

  const updated = await prisma.fileRecord.update({
    where: { id: file.id },
    data: { status },
    include: {
      senderDept: { select: { id: true, name: true, prefix: true } },
      receiverDept: { select: { id: true, name: true, prefix: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  await writeAudit({
    userId: user.id,
    action: "STATUS_CHANGED",
    resourceType: "FILE",
    resourceId: file.id,
    metadata: { from: current, to: status },
    ipAddress: reqCtx.ip,
    userAgent: reqCtx.get("user-agent"),
  });

  let notifType = "STATUS_CHANGED";
  let title = "File status updated";
  if (status === "APPROVED") {
    notifType = "APPROVAL";
    title = "File approved";
  } else if (status === "REJECTED") {
    notifType = "REJECTION";
    title = "File rejected";
  }

  const msg = buildFileMessage(updated.senderDept.prefix, updated.fileNumber, `${title} — ${updated.title}`);
  const senderTargets = await usersInDepartment(file.senderDeptId);
  const notes = await createNotificationsForUsers(
    senderTargets.map((userId) => ({
      userId,
      type: notifType,
      title,
      message: msg,
      fileRecordId: updated.id,
    }))
  );
  emitToUsers(io, "notification", notes);

  return serializeFileRecord(updated);
}

export async function rejectFile(reqCtx, user, fileRecordId, io) {
  return updateFileStatus(reqCtx, user, fileRecordId, "REJECTED", io);
}

function buildListWhere(user, query) {
  const {
    q,
    status,
    priority,
    departmentId,
    dateFrom,
    dateTo,
  } = query;

  const and = [];

  if (user.role !== "ADMIN") {
    and.push({
      OR: [{ senderDeptId: user.departmentId }, { receiverDeptId: user.departmentId }],
    });
  }

  if (status) and.push({ status });
  if (priority) and.push({ priority });

  if (departmentId) {
    and.push({
      OR: [{ senderDeptId: departmentId }, { receiverDeptId: departmentId }],
    });
  }

  if (dateFrom || dateTo) {
    const createdAt = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) createdAt.lte = new Date(dateTo);
    and.push({ createdAt });
  }

  if (q?.trim()) {
    const term = q.trim();
    const combined = parseCombinedId(term);
    if (combined) {
      and.push({
        AND: [
          { senderDept: { is: { prefix: combined.prefix } } },
          { fileNumber: combined.fileNumber },
        ],
      });
    } else if (/^\d+$/.test(term)) {
      and.push({ fileNumber: parseInt(term, 10) });
    } else {
      and.push({
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { senderDept: { is: { prefix: { contains: term, mode: "insensitive" } } } },
        ],
      });
    }
  }

  return and.length ? { AND: and } : {};
}

function buildOrderBy(query) {
  const sortBy = query.sortBy || "createdAt";
  const order = query.sortOrder === "asc" ? "asc" : "desc";
  if (sortBy === "fileNumber") return { fileNumber: order };
  if (sortBy === "priority") return { priority: order };
  if (sortBy === "department") return { senderDept: { prefix: order } };
  return { createdAt: order };
}

export async function listFilesForUser(user, query) {
  const where = buildListWhere(user, query);
  const sortBy = query.sortBy || "createdAt";
  const orderBy = sortBy === "priority" ? { createdAt: "desc" } : buildOrderBy(query);
  const rows = await prisma.fileRecord.findMany({
    where,
    orderBy,
    include: {
      senderDept: { select: { id: true, name: true, prefix: true } },
      receiverDept: { select: { id: true, name: true, prefix: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (sortBy === "priority") {
    const mul = query.sortOrder === "asc" ? 1 : -1;
    rows.sort((a, b) => mul * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]));
  }

  return serializeFileRecords(rows);
}

export async function dashboardSummary(user) {
  const baseWhere =
    user.role === "ADMIN"
      ? {}
      : {
          OR: [{ senderDeptId: user.departmentId }, { receiverDeptId: user.departmentId }],
        };

  const [draft, sent, received, underReview, pendingApproval, archived] = await Promise.all([
    prisma.fileRecord.count({ where: { ...baseWhere, status: "DRAFT" } }),
    prisma.fileRecord.count({ where: { ...baseWhere, status: "SENT" } }),
    prisma.fileRecord.count({ where: { ...baseWhere, status: "RECEIVED" } }),
    prisma.fileRecord.count({ where: { ...baseWhere, status: "UNDER_REVIEW" } }),
    prisma.fileRecord.count({
      where: {
        ...baseWhere,
        status: { in: ["RECEIVED", "UNDER_REVIEW", "SENT"] },
      },
    }),
    prisma.fileRecord.count({ where: { ...baseWhere, status: "ARCHIVED" } }),
  ]);

  return {
    draft,
    sent,
    received,
    underReview,
    pendingActions: pendingApproval,
    archived,
  };
}

export async function getFileAuditTimeline(fileRecordId) {
  return prisma.auditLog.findMany({
    where: { resourceType: "FILE", resourceId: fileRecordId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

export async function deleteFileRecord(reqCtx, user, fileRecordId) {
  const file = await assertFileAccess(user, fileRecordId);
  if (!isSenderSide(user, file)) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  if (file.status !== "DRAFT") {
    const err = new Error("Only draft files can be deleted");
    err.status = 400;
    throw err;
  }

  const abs = path.join(process.cwd(), file.filePath);
  await prisma.fileRecord.delete({ where: { id: file.id } });
  fs.rm(path.dirname(abs), { recursive: true, force: true }, () => {});

  await writeAudit({
    userId: user.id,
    action: "FILE_DELETED",
    resourceType: "FILE",
    resourceId: fileRecordId,
    metadata: { displayId: formatDisplayId(file.senderDept.prefix, file.fileNumber) },
    ipAddress: reqCtx.ip,
    userAgent: reqCtx.get("user-agent"),
  });
}
