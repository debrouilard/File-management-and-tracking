import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  deleteFile,
  getDashboard,
  getDownload,
  getFileById,
  getFileHistory,
  getFiles,
  patchStatus,
  postFile,
  postReceive,
  postReject,
  postSend,
} from "../controllers/fileController.js";
import { requireAuth, requirePasswordResetDone } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const r = Router();

r.use(requireAuth, requirePasswordResetDone);

const statusList = [
  "DRAFT",
  "SENT",
  "RECEIVED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
];

r.get(
  "/",
  query("q").optional().isString(),
  query("status").optional().isIn(statusList),
  query("priority").optional().isIn(["HIGH", "MEDIUM", "LOW"]),
  query("departmentId").optional().isString(),
  query("dateFrom").optional().isString(),
  query("dateTo").optional().isString(),
  query("sortBy").optional().isIn(["createdAt", "fileNumber", "priority", "department"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
  validateRequest,
  getFiles
);

r.get("/dashboard/summary", getDashboard);

r.post("/", postFile);

r.post(
  "/:id/receive",
  param("id").isString(),
  validateRequest,
  postReceive
);

r.patch(
  "/:id/status",
  param("id").isString(),
  body("status").isIn([
    "RECEIVED",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "ARCHIVED",
  ]),
  validateRequest,
  patchStatus
);

r.get("/:id/download", param("id").isString(), validateRequest, getDownload);

r.get("/:id/history", param("id").isString(), validateRequest, getFileHistory);

r.post(
  "/:id/send",
  param("id").isString(),
  body("receiverDeptId").isString().notEmpty(),
  validateRequest,
  postSend
);

r.post("/:id/reject", param("id").isString(), validateRequest, postReject);

r.delete("/:id", param("id").isString(), validateRequest, deleteFile);

r.get("/:id", param("id").isString(), validateRequest, getFileById);

export default r;
