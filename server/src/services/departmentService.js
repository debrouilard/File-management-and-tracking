import { prisma } from "../utils/prisma.js";

export async function listDepartments() {
  return prisma.department.findMany({ orderBy: { prefix: "asc" } });
}

export async function createDepartment({ name, prefix }) {
  const p = prefix.toUpperCase().trim();
  return prisma.department.create({
    data: { name: name.trim(), prefix: p },
  });
}
