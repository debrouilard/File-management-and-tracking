import { Router } from "express";
import { query } from "express-validator";
import { getSearch } from "../controllers/searchController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const r = Router();

r.get(
  "/",
  requireAuth,
  query("q").optional().isString(),
  query("status").optional().isIn(["PENDING", "SENT", "RECEIVED", "REJECTED"]),
  query("departmentId").optional().isString(),
  validateRequest,
  getSearch
);

export default r;
