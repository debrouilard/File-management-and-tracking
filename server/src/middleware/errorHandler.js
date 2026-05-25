import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

const PRISMA_ENGINE_ERRORS = new Set(["PrismaClientInitializationError", "PrismaClientRustPanicError"]);

function prismaStatus(err) {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return null;
  switch (err.code) {
    case "P2002":
      return { status: 409, message: "A record with this value already exists." };
    case "P2025":
      return { status: 404, message: "Record not found." };
    case "P2003":
      return { status: 400, message: "Related record constraint failed." };
    case "P2014":
      return { status: 400, message: "Invalid relation change." };
    default:
      logger.warn("Prisma known error", { code: err.code, meta: err.meta });
      return { status: 400, message: "Database request could not be completed." };
  }
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (PRISMA_ENGINE_ERRORS.has(err?.name)) {
    logger.error("Prisma engine error:", err.message);
    return res.status(503).json({ error: "Database temporarily unavailable." });
  }

  const prismaMapped = prismaStatus(err);
  if (prismaMapped) {
    logger.warn("Request failed (Prisma)", { path: req.originalUrl, code: err.code });
    return res.status(prismaMapped.status).json({ error: prismaMapped.message });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.warn("Prisma validation error", { path: req.originalUrl });
    return res.status(400).json({ error: "Invalid data supplied." });
  }

  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    logger.error("Upstream connection error:", err.code, err.message);
    return res.status(503).json({ error: "Service temporarily unavailable." });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({ error: err.message || "Upload error" });
  }

  const status = Number(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  const exposeMessage = status < 500 || !env.isProduction;
  const message = exposeMessage ? err.message || "Server error" : "Internal server error";

  if (status >= 500) {
    logger.error("Unhandled error:", err.message);
    if (!env.isProduction && err.stack) {
      logger.error(err.stack);
    }
  } else {
    logger.warn("Client error:", err.message, { path: req.originalUrl, status });
  }

  const body = { error: message };
  if (!env.isProduction && status >= 500 && err.stack) {
    body.detail = err.stack.split("\n").slice(0, 6).join("\n");
  }

  res.status(status).json(body);
}
