import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";
import { sanitizeFilename } from "../utils/pathSafe.js";

const maxMb = Number(process.env.MAX_UPLOAD_MB || 10);
const maxBytes = maxMb * 1024 * 1024;

const allowedMime = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
]);

function isAllowedUpload(file) {
  const mime = String(file.mimetype || "").toLowerCase();
  const name = String(file.originalname || "").toLowerCase();
  if (allowedMime.has(mime)) return true;
  if (name.endsWith(".pdf") && (mime === "application/octet-stream" || !mime)) return true;
  if ((name.endsWith(".jpg") || name.endsWith(".jpeg")) && (mime === "application/octet-stream" || !mime)) return true;
  return false;
}

const tmpRoot = path.join(process.cwd(), "uploads", "tmp");
fs.mkdirSync(tmpRoot, { recursive: true });

export const tempUpload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, tmpRoot);
    },
    filename(_req, file, cb) {
      cb(null, `${randomUUID()}-${sanitizeFilename(file.originalname)}`);
    },
  }),
  limits: { fileSize: maxBytes, files: 1 },
  fileFilter(_req, file, cb) {
    if (!isAllowedUpload(file)) {
      const e = new Error("Only PDF and JPG/JPEG files are allowed");
      e.status = 400;
      return cb(e);
    }
    cb(null, true);
  },
});

export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.includes("csv") && !file.originalname.toLowerCase().endsWith(".csv")) {
      return cb(new Error("CSV file required"));
    }
    cb(null, true);
  },
});
