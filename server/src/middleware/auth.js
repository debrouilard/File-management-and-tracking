import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    req.user = {
      id: payload.id,
      role: payload.role,
      departmentId: payload.departmentId,
      mustResetPassword: Boolean(payload.mustResetPassword),
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requirePasswordResetDone(req, res, next) {
  if (req.user?.mustResetPassword) {
    return res.status(403).json({
      error: "PASSWORD_RESET_REQUIRED",
      code: "PASSWORD_RESET_REQUIRED",
      mustResetPassword: true,
    });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}
