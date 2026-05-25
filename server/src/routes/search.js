import { Router } from "express";
import { query } from "express-validator";
import { getSearch } from "../controllers/searchController.js";
import { requireAuth, requirePasswordResetDone } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const r = Router();

r.use(requireAuth, requirePasswordResetDone);

r.get(
  "/",
  query("q").optional().isString(),
  query("status").optional().isString(),
  query("priority").optional().isString(),
  query("departmentId").optional().isString(),
  query("dateFrom").optional().isString(),
  query("dateTo").optional().isString(),
  query("sortBy").optional().isString(),
  query("sortOrder").optional().isString(),
  validateRequest,
  getSearch
);

export default r;
