import fs from "fs";
import path from "path";
import multer from "multer";
import { sanitizeFilename } from "../utils/pathSafe.js";

const maxMb = Number(process.env.MAX_UPLOAD_MB || 10);
const maxBytes = maxMb * 1024 * 1024;

const allowedMime = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function createUploadForFile(deptFolderName, fileIdFolder) {
  const root = path.join(process.cwd(), "uploads", deptFolderName, fileIdFolder);
  ensureDir(root);

  const storage = multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, root);
    },
    filename(_req, file, cb) {
      cb(null, sanitizeFilename(file.originalname));
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter(_req, file, cb) {
      if (!allowedMime.has(file.mimetype)) {
        return cb(new Error("Only PDF and DOCX files are allowed"));
      }
      cb(null, true);
    },
  });
}
