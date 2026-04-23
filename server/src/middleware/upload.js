import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";
import { sanitizeFilename } from "../utils/pathSafe.js";

const maxMb = Number(process.env.MAX_UPLOAD_MB || 10);
const maxBytes = maxMb * 1024 * 1024;

const allowedMime = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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
    if (!allowedMime.has(file.mimetype)) {
      return cb(new Error("Only PDF and DOCX files are allowed"));
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
