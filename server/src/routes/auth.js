import { Router } from "express";
import { body } from "express-validator";
import { postLogin } from "../controllers/authController.js";
import { validateRequest } from "../middleware/validateRequest.js";

const r = Router();

r.post(
  "/login",
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 6 }),
  validateRequest,
  postLogin
);

export default r;
