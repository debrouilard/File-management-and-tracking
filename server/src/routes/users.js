import { Router } from "express";
import { body } from "express-validator";
import { getUsers, postUser } from "../controllers/userController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const r = Router();

r.use(requireAuth, requireAdmin);

r.get("/", getUsers);

r.post(
  "/",
  body("name").isString().trim().isLength({ min: 2, max: 120 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 8, max: 128 }),
  body("role").isIn(["ADMIN", "STAFF"]),
  body("departmentId").isString().notEmpty(),
  validateRequest,
  postUser
);

export default r;
