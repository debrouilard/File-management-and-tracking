import { Router } from "express";
import { body } from "express-validator";
import { getDepartments, postDepartment } from "../controllers/departmentController.js";
import { requireAdmin, requireAuth, requirePasswordResetDone } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const r = Router();

r.get("/", requireAuth, requirePasswordResetDone, getDepartments);

r.post(
  "/",
  requireAuth,
  requirePasswordResetDone,
  requireAdmin,
  body("name").isString().trim().isLength({ min: 2, max: 120 }),
  body("prefix").isString().trim().isLength({ min: 2, max: 8 }),
  validateRequest,
  postDepartment
);

export default r;
