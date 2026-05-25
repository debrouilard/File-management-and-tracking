import { prisma } from "../utils/prisma.js";
import { writeAudit } from "./auditService.js";

export async function listDepartments() {
  return prisma.department.findMany({ orderBy: { prefix: "asc" } });
}

export async function createDepartment({ name, prefix }) {
  const p = prefix.toUpperCase().trim();
  return prisma.department.create({
    data: { name: name.trim(), prefix: p },
  });
}

export async function updateDepartment(departmentId, { name, prefix }, reqCtx) {
  const p = String(prefix || "").toUpperCase().trim();
  const updated = await prisma.department.update({
    where: { id: departmentId },
    data: { name: String(name).trim(), prefix: p },
  });

  await writeAudit({
    userId: reqCtx?.user?.id,
    action: "DEPARTMENT_UPDATED",
    resourceType: "DEPARTMENT",
    resourceId: updated.id,
    metadata: { prefix: updated.prefix, name: updated.name },
    ipAddress: reqCtx?.ip,
    userAgent: reqCtx?.get?.("user-agent"),
  });

  return updated;
}

export async function deleteDepartment(departmentId, reqCtx) {
  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    select: {
      id: true,
      prefix: true,
      name: true,
      _count: { select: { users: true, sentFiles: true, receivedFiles: true } },
    },
  });
  if (!dept) {
    const err = new Error("Department not found");
    err.status = 404;
    throw err;
  }
  const hasRefs = dept._count.users + dept._count.sentFiles + dept._count.receivedFiles > 0;
  if (hasRefs) {
    const err = new Error("Cannot delete department with users or files");
    err.status = 400;
    throw err;
  }

  await prisma.department.delete({ where: { id: departmentId } });

  await writeAudit({
    userId: reqCtx?.user?.id,
    action: "DEPARTMENT_DELETED",
    resourceType: "DEPARTMENT",
    resourceId: departmentId,
    metadata: { prefix: dept.prefix, name: dept.name },
    ipAddress: reqCtx?.ip,
    userAgent: reqCtx?.get?.("user-agent"),
  });
}
