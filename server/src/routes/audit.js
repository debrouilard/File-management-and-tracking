import { Router } from "express";
import { query } from "express-validator";
import { getAuditLogs } from "../controllers/auditController.js";
import { requireAdmin, requireAuth, requirePasswordResetDone } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const r = Router();

r.use(requireAuth, requirePasswordResetDone, requireAdmin);

r.get(
  "/",
  query("take").optional().isInt({ min: 1, max: 500 }),
  query("skip").optional().isInt({ min: 0 }),
  validateRequest,
  getAuditLogs
);

export default r;
