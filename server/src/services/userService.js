import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";

export async function createUser({ name, email, password, role, departmentId }) {
  const hash = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hash,
      role,
      departmentId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      department: { select: { id: true, name: true, prefix: true } },
      createdAt: true,
    },
  });
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
      department: { select: { id: true, name: true, prefix: true } },
      createdAt: true,
    },
  });
}
