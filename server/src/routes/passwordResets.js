import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getPasswordResetRequests,
  postCompletePasswordReset,
} from "../controllers/passwordResetController.js";
import { requireAdmin, requireAuth, requirePasswordResetDone } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const r = Router();

r.use(requireAuth, requirePasswordResetDone, requireAdmin);

r.get("/", query("status").optional().isString(), validateRequest, getPasswordResetRequests);

r.post(
  "/:id/complete",
  param("id").isString(),
  body("tempPassword").isString().isLength({ min: 8, max: 128 }),
  validateRequest,
  postCompletePasswordReset
);

export default r;

