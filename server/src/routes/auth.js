import { Router } from "express";
import { body } from "express-validator";
import { postChangePassword, postLogin } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const r = Router();

r.post(
  "/login",
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 6 }),
  validateRequest,
  postLogin
);

r.post(
  "/change-password",
  requireAuth,
  body("currentPassword").isString().isLength({ min: 1 }),
  body("newPassword").isString().isLength({ min: 8, max: 128 }),
  validateRequest,
  postChangePassword
);

export default r;
