import { Router } from "express";
import { body } from "express-validator";
import { deleteUserById, getUsers, patchUser, postBulkUsers, postUser } from "../controllers/userController.js";
import { csvUpload } from "../middleware/upload.js";
import { requireAdmin, requireAuth, requirePasswordResetDone } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const r = Router();

r.use(requireAuth, requirePasswordResetDone, requireAdmin);

r.get("/", getUsers);

r.post(
  "/",
  body("name").isString().trim().isLength({ min: 2, max: 120 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 8, max: 128 }),
  body("role").isIn(["ADMIN", "DEPARTMENT_HEAD", "STAFF"]),
  body("departmentId").isString().notEmpty(),
  validateRequest,
  postUser
);

r.post("/bulk", csvUpload.single("file"), postBulkUsers);

r.patch(
  "/:id",
  body("name").isString().trim().isLength({ min: 2, max: 120 }),
  body("role").isIn(["ADMIN", "DEPARTMENT_HEAD", "STAFF"]),
  body("departmentId").isString().notEmpty(),
  validateRequest,
  patchUser
);

r.delete("/:id", validateRequest, deleteUserById);

export default r;
