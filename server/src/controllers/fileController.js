import fs from "fs";
import path from "path";
import { prisma } from "../utils/prisma.js";
import { createUploadForFile } from "../middleware/upload.js";
import {
  assertFileAccess,
  createFileRecord,
  deleteFileRecord,
  dashboardSummary,
  generateUniqueFileId,
  getHistory,
  listFilesForUser,
  markReceivedIfViewer,
  rejectFile,
  sendFile,
} from "../services/fileService.js";

function validateMultipartMeta(body) {
  const title = (body.title || "").trim();
  if (title.length < 2 || title.length > 200) {
    const err = new Error("Title must be between 2 and 200 characters");
    err.status = 400;
    throw err;
  }
  const desc = body.description != null ? String(body.description) : "";
  if (desc.length > 4000) {
    const err = new Error("Description is too long");
    err.status = 400;
    throw err;
  }
  return { title, description: desc || undefined };
}

export async function postFile(req, res, next) {
  try {
    const dept = await prisma.department.findUnique({ where: { id: req.user.departmentId } });
    if (!dept) return res.status(400).json({ error: "Department missing" });

    const fileId = await generateUniqueFileId(dept.prefix);
    const upload = createUploadForFile(dept.prefix, fileId).single("document");

    upload(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) return res.status(400).json({ error: "A PDF or DOCX document is required" });
      try {
        const meta = validateMultipartMeta(req.body);
        const record = await createFileRecord(
          req.user,
          meta,
          req.file.path,
          req.file.originalname,
          fileId
        );
        res.status(201).json(record);
      } catch (e) {
        next(e);
      }
    });
  } catch (e) {
    next(e);
  }
}

export async function getFiles(req, res, next) {
  try {
    const rows = await listFilesForUser(req.user, req.query);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function getDashboard(req, res, next) {
  try {
    const summary = await dashboardSummary(req.user);
    res.json(summary);
  } catch (e) {
    next(e);
  }
}

export async function getFileById(req, res, next) {
  try {
    const io = req.app.get("io");
    let file = await assertFileAccess(req.user, req.params.id);
    file = await markReceivedIfViewer(req.user, file, io);
    res.json(file);
  } catch (e) {
    next(e);
  }
}

export async function getFileHistory(req, res, next) {
  try {
    await assertFileAccess(req.user, req.params.id);
    const rows = await getHistory(req.params.id);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function postSend(req, res, next) {
  try {
    const io = req.app.get("io");
    const { receiverDeptId } = req.body;
    const updated = await sendFile(req.user, req.params.id, receiverDeptId, io);
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function postReject(req, res, next) {
  try {
    const io = req.app.get("io");
    const updated = await rejectFile(req.user, req.params.id, io);
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function deleteFile(req, res, next) {
  try {
    await deleteFileRecord(req.user, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function getDownload(req, res, next) {
  try {
    const file = await assertFileAccess(req.user, req.params.id);
    const abs = path.join(process.cwd(), file.filePath);
    if (!fs.existsSync(abs)) {
      return res.status(404).json({ error: "File missing on disk" });
    }
    res.download(abs, file.originalName);
  } catch (e) {
    next(e);
  }
}
