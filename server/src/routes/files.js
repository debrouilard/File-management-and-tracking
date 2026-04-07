import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  deleteFile,
  getDashboard,
  getDownload,
  getFileById,
  getFileHistory,
  getFiles,
  postFile,
  postReject,
  postSend,
} from "../controllers/fileController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const r = Router();

r.use(requireAuth);

r.get(
  "/",
  query("q").optional().isString(),
  query("status").optional().isIn(["PENDING", "SENT", "RECEIVED", "REJECTED"]),
  query("departmentId").optional().isString(),
  validateRequest,
  getFiles
);

r.get("/dashboard/summary", getDashboard);

r.post("/", postFile);

r.get("/:id/download", param("id").isString(), validateRequest, getDownload);

r.get("/:id/history", param("id").isString(), validateRequest, getFileHistory);

r.get("/:id", param("id").isString(), validateRequest, getFileById);

r.post(
  "/:id/send",
  param("id").isString(),
  body("receiverDeptId").isString().notEmpty(),
  validateRequest,
  postSend
);

r.post("/:id/reject", param("id").isString(), validateRequest, postReject);

r.delete("/:id", param("id").isString(), validateRequest, deleteFile);

export default r;
