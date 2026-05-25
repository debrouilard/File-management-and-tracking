import bcrypt from "bcryptjs";
import { parse } from "csv-parse/sync";
import { prisma } from "../utils/prisma.js";
import { writeAudit } from "./auditService.js";

export async function createUser({ name, email, password, role, departmentId }, reqCtx) {
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hash,
      role,
      departmentId,
      mustResetPassword: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      mustResetPassword: true,
      department: { select: { id: true, name: true, prefix: true } },
      createdAt: true,
    },
  });

  await writeAudit({
    userId: reqCtx?.user?.id,
    action: "USER_CREATED",
    resourceType: "USER",
    resourceId: user.id,
    metadata: { email: user.email, role: user.role },
    ipAddress: reqCtx?.ip,
    userAgent: reqCtx?.get?.("user-agent"),
  });

  return user;
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      mustResetPassword: true,
      department: { select: { id: true, name: true, prefix: true } },
      createdAt: true,
    },
  });
}

export async function bulkImportUsersFromCsv(buffer, { actorUserId }, reqCtx) {
  const text = buffer.toString("utf8");
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const required = ["name", "email", "password", "role", "departmentPrefix"];
  const created = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      for (const k of required) {
        if (!row[k]) throw new Error(`Missing ${k}`);
      }
      const dept = await prisma.department.findUnique({
        where: { prefix: String(row.departmentPrefix).toUpperCase().trim() },
      });
      if (!dept) throw new Error(`Unknown department prefix ${row.departmentPrefix}`);

      const role = String(row.role).toUpperCase().trim();
      if (!["ADMIN", "DEPARTMENT_HEAD", "STAFF"].includes(role)) {
        throw new Error(`Invalid role ${row.role}`);
      }

      const hash = await bcrypt.hash(String(row.password), 12);
      const user = await prisma.user.create({
        data: {
          name: String(row.name).trim(),
          email: String(row.email).trim().toLowerCase(),
          password: hash,
          role,
          departmentId: dept.id,
          mustResetPassword: true,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });
      created.push(user);
      await writeAudit({
        userId: actorUserId,
        action: "USER_BULK_IMPORTED",
        resourceType: "USER",
        resourceId: user.id,
        metadata: { email: user.email, row: i + 2 },
        ipAddress: reqCtx?.ip,
        userAgent: reqCtx?.get?.("user-agent"),
      });
    } catch (e) {
      errors.push({ row: i + 2, message: e.message || String(e) });
    }
  }

  return { created: created.length, failed: errors.length, errors };
}

export async function updateUser(userId, { name, email, role, departmentId }, reqCtx) {
  const data = {
    name: String(name).trim(),
    role,
    departmentId,
  };
  if (email != null && String(email).trim()) {
    data.email = String(email).trim().toLowerCase();
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      mustResetPassword: true,
      department: { select: { id: true, name: true, prefix: true } },
      createdAt: true,
    },
  });

  await writeAudit({
    userId: reqCtx?.user?.id,
    action: "USER_UPDATED",
    resourceType: "USER",
    resourceId: updated.id,
    metadata: { email: updated.email, role: updated.role, departmentId: updated.departmentId },
    ipAddress: reqCtx?.ip,
    userAgent: reqCtx?.get?.("user-agent"),
  });

  return updated;
}

export async function deleteUser(userId, reqCtx) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!u) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  await prisma.user.delete({ where: { id: userId } });

  await writeAudit({
    userId: reqCtx?.user?.id,
    action: "USER_DELETED",
    resourceType: "USER",
    resourceId: userId,
    metadata: { email: u.email, role: u.role },
    ipAddress: reqCtx?.ip,
    userAgent: reqCtx?.get?.("user-agent"),
  });
}
