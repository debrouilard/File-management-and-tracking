import crypto from "crypto";
import { prisma } from "./prisma.js";

function randomDigits(len = 6) {
  const n = crypto.randomInt(0, 10 ** len);
  return String(n).padStart(len, "0");
}

export async function generateUniqueFileId(prefix) {
  const clean = prefix.toUpperCase().replace(/[^A-Z0-9]/g, "");
  for (let i = 0; i < 25; i++) {
    const candidate = `${clean}${randomDigits(6)}`;
    const exists = await prisma.fileRecord.findUnique({ where: { fileId: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Could not allocate unique file id");
}
