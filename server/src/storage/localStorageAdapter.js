import fs from "fs";
import path from "path";
import { sanitizeFilename } from "../utils/pathSafe.js";

const cwd = process.cwd();

/**
 * Local disk storage (swap for S3-compatible adapter later).
 */
export function buildRelativePath(departmentPrefix, fileNumber, originalName) {
  const safe = sanitizeFilename(originalName);
  return path.join("uploads", departmentPrefix, String(fileNumber), safe).split(path.sep).join("/");
}

export async function moveTempToFinal({ tempAbsolutePath, departmentPrefix, fileNumber, originalName }) {
  const rel = buildRelativePath(departmentPrefix, fileNumber, originalName);
  const destAbs = path.join(cwd, rel);
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  await fs.promises.rename(tempAbsolutePath, destAbs);
  return rel;
}

export function absoluteFromRelative(rel) {
  return path.join(cwd, rel.split("/").join(path.sep));
}
