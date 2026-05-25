import fs from "fs";
import path from "path";
import { tempUpload } from "../middleware/upload.js";
import {
  assertFileAccess,
  createFileRecord,
  deleteFileRecord,
  dashboardSummary,
  getFileAuditTimeline,
  listFilesForUser,
  markReceivedExplicit,
  markReceivedIfViewer,
  rejectFile,
  sendFile,
  updateFileStatus,
} from "../services/fileService.js";

function validateDocumentCode(raw) {
  const s = String(raw ?? "").trim();
  if (!/^\d{1,20}$/.test(s)) {
    const err = new Error("Document ID must be numbers only (1–20 digits)");
    err.status = 400;
    throw err;
  }
  return s;
}

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
  const priority = (body.priority || "MEDIUM").toUpperCase();
  if (!["HIGH", "MEDIUM", "LOW"].includes(priority)) {
    const err = new Error("Invalid priority");
    err.status = 400;
    throw err;
  }
  const documentCode = validateDocumentCode(body.documentCode ?? body.documentId);
  return { title, description: desc || undefined, priority, documentCode };
}

export async function postFile(req, res, next) {
  const upload = tempUpload.single("document");
  upload(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ error: "A PDF or JPG/JPEG document is required" });
    try {
      const meta = validateMultipartMeta(req.body);
      const record = await createFileRecord(
        req,
        req.user,
        meta,
        req.file.path,
        req.file.originalname,
        req.file.mimetype,
        req.file.size
      );
      res.status(201).json(record);
    } catch (e) {
      next(e);
    }
  });
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
    file = await markReceivedIfViewer(req, req.user, file, io);
    res.json(file);
  } catch (e) {
    next(e);
  }
}

export async function getFileHistory(req, res, next) {
  try {
    await assertFileAccess(req.user, req.params.id);
    const rows = await getFileAuditTimeline(req.params.id);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function postSend(req, res, next) {
  try {
    const io = req.app.get("io");
    const { receiverDeptId } = req.body;
    const updated = await sendFile(req, req.user, req.params.id, receiverDeptId, io);
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function postReject(req, res, next) {
  try {
    const io = req.app.get("io");
    const updated = await rejectFile(req, req.user, req.params.id, io);
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function postReceive(req, res, next) {
  try {
    const io = req.app.get("io");
    const updated = await markReceivedExplicit(req, req.user, req.params.id, io);
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function patchStatus(req, res, next) {
  try {
    const io = req.app.get("io");
    const { status } = req.body;
    const updated = await updateFileStatus(req, req.user, req.params.id, status, io);
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function deleteFile(req, res, next) {
  try {
    await deleteFileRecord(req, req.user, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function getDownload(req, res, next) {
  try {
    const file = await assertFileAccess(req.user, req.params.id);
    if (file.filePath === "__pending__") {
      return res.status(404).json({ error: "File not ready" });
    }
    const abs = path.join(process.cwd(), file.filePath);
    if (!fs.existsSync(abs)) {
      return res.status(404).json({ error: "File missing on disk" });
    }
    const inline = String(req.query.inline || "") === "true";
    if (inline) {
      const mime = file.mimeType || "application/octet-stream";
      res.setHeader("Content-Type", mime);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.originalName)}"`);
      return res.sendFile(abs);
    }
    res.download(abs, file.originalName);
  } catch (e) {
    next(e);
  }
}
