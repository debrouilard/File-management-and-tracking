import Csrf from "csrf";
import { logger } from "../utils/logger.js";

const tokens = new Csrf();

export function issueCsrf(req, res) {
  const secret = tokens.secretSync();
  res.cookie("csrfSecret", secret, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  const token = tokens.create(secret);
  res.json({ csrfToken: token });
}

export function verifyCsrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const secret = req.cookies?.csrfSecret;
  const headerToken = req.headers["x-csrf-token"] || req.headers["x-xsrf-token"];
  if (!secret || !headerToken) {
    logger.warn("CSRF missing", { path: req.path, method: req.method });
    return res.status(403).json({ error: "CSRF token required" });
  }
  try {
    if (!tokens.verify(secret, String(headerToken))) {
      return res.status(403).json({ error: "Invalid CSRF token" });
    }
    return next();
  } catch {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
}
