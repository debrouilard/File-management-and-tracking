import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const departments = [
    { name: "Registry", prefix: "REG" },
    { name: "Finance", prefix: "FIN" },
    { name: "Administration", prefix: "ADM" },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { prefix: d.prefix },
      update: { name: d.name },
      create: d,
    });
  }

  const reg = await prisma.department.findUnique({ where: { prefix: "REG" } });
  if (!reg) throw new Error("Seed failed: REG department missing");

  const hash = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@aau.edu" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@aau.edu",
      password: hash,
      role: "ADMIN",
      departmentId: reg.id,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
