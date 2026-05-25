import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import { writeAudit } from "./auditService.js";

async function resolveUserFromIdentifier(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return { user: null, emailForRecord: "" };

  const asEmail = trimmed.toLowerCase();
  let user = await prisma.user.findUnique({
    where: { email: asEmail },
    select: { id: true, email: true },
  });

  if (!user && !trimmed.includes("@")) {
    user = await prisma.user.findFirst({
      where: { name: { equals: trimmed, mode: "insensitive" } },
      select: { id: true, email: true },
    });
  }

  const emailForRecord = user?.email ?? (trimmed.includes("@") ? asEmail : trimmed);
  return { user, emailForRecord };
}

export async function createPasswordResetRequest(identifierRaw, reqCtx) {
  const trimmed = String(identifierRaw || "").trim();
  if (!trimmed || trimmed.length < 3) {
    const err = new Error("Enter your email address or username");
    err.status = 400;
    throw err;
  }

  const { user, emailForRecord } = await resolveUserFromIdentifier(trimmed);

  const created = await prisma.passwordResetRequest.create({
    data: {
      email: emailForRecord,
      userId: user?.id || null,
      status: "PENDING",
    },
  });

  await writeAudit({
    userId: user?.id || null,
    action: "PASSWORD_RESET_REQUESTED",
    resourceType: "PASSWORD_RESET",
    resourceId: created.id,
    metadata: { identifier: trimmed, email: emailForRecord },
    ipAddress: reqCtx?.ip,
    userAgent: reqCtx?.get?.("user-agent"),
  });

  // Always return a generic response to avoid user enumeration.
  return { ok: true };
}

const resetListInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      department: { select: { prefix: true, name: true } },
    },
  },
  completedBy: { select: { id: true, name: true, email: true } },
};

export async function listPasswordResetRequests({ status, limit } = {}) {
  const where = {};
  if (status) where.status = status;
  return prisma.passwordResetRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: typeof limit === "number" && limit > 0 ? limit : undefined,
    include: resetListInclude,
  });
}

export async function completePasswordResetRequest(requestId, { tempPassword }, actorUserId, reqCtx) {
  const reqRow = await prisma.passwordResetRequest.findUnique({
    where: { id: requestId },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!reqRow) {
    const err = new Error("Reset request not found");
    err.status = 404;
    throw err;
  }
  if (reqRow.status !== "PENDING") {
    const err = new Error("Reset request already completed");
    err.status = 400;
    throw err;
  }
  if (!reqRow.userId) {
    const err = new Error("No user account found for this request");
    err.status = 400;
    throw err;
  }
  const pwd = String(tempPassword || "");
  if (pwd.length < 8 || pwd.length > 128) {
    const err = new Error("Temporary password must be 8-128 characters");
    err.status = 400;
    throw err;
  }

  const hash = await bcrypt.hash(pwd, 12);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: reqRow.userId },
      data: { password: hash, mustResetPassword: true },
    });

    return tx.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completedById: actorUserId,
      },
      include: { user: { select: { id: true, email: true } } },
    });
  });

  await writeAudit({
    userId: actorUserId,
    action: "PASSWORD_RESET_COMPLETED",
    resourceType: "PASSWORD_RESET",
    resourceId: requestId,
    metadata: { email: updated.email, userId: updated.userId },
    ipAddress: reqCtx?.ip,
    userAgent: reqCtx?.get?.("user-agent"),
  });

  return updated;
}

