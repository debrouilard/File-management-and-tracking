import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import { signToken } from "../utils/jwt.js";
import { writeAudit } from "./auditService.js";

export async function login(email, password, reqCtx) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { department: true },
  });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const token = signToken({
    id: user.id,
    role: user.role,
    departmentId: user.departmentId,
    mustResetPassword: user.mustResetPassword,
  });

  await writeAudit({
    userId: user.id,
    action: "USER_LOGIN",
    resourceType: "USER",
    resourceId: user.id,
    metadata: { email: user.email },
    ipAddress: reqCtx?.ip,
    userAgent: reqCtx?.get?.("user-agent"),
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      department: user.department,
      mustResetPassword: user.mustResetPassword,
    },
  };
}

export async function changePassword(userId, currentPassword, newPassword, reqCtx) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) {
    const err = new Error("Current password is incorrect");
    err.status = 401;
    throw err;
  }
  const hash = await bcrypt.hash(newPassword, 12);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { password: hash, mustResetPassword: false },
    include: { department: true },
  });

  const token = signToken({
    id: updated.id,
    role: updated.role,
    departmentId: updated.departmentId,
    mustResetPassword: false,
  });

  await writeAudit({
    userId: updated.id,
    action: "PASSWORD_CHANGED",
    resourceType: "USER",
    resourceId: updated.id,
    metadata: {},
    ipAddress: reqCtx?.ip,
    userAgent: reqCtx?.get?.("user-agent"),
  });

  return {
    token,
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      departmentId: updated.departmentId,
      department: updated.department,
      mustResetPassword: false,
    },
  };
}
