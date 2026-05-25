import { prisma } from "../utils/prisma.js";

export async function writeAudit({
  userId,
  action,
  resourceType,
  resourceId,
  metadata,
  ipAddress,
  userAgent,
}) {
  return prisma.auditLog.create({
    data: {
      userId: userId || null,
      action,
      resourceType,
      resourceId: resourceId || null,
      metadata: metadata ?? undefined,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });
}

export async function listAuditLogs({ take = 100, skip = 0, resourceType, resourceId }) {
  const where = {};
  if (resourceType) where.resourceType = resourceType;
  if (resourceId) where.resourceId = resourceId;
  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(take, 500),
    skip,
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });
}
