import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./utils/prisma.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import departmentRoutes from "./routes/departments.js";
import fileRoutes from "./routes/files.js";
import notificationRoutes from "./routes/notifications.js";
import searchRoutes from "./routes/search.js";
import auditRoutes from "./routes/audit.js";
import passwordResetRoutes from "./routes/passwordResets.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { corsOriginCallback } from "./utils/allowedOrigins.js";
import { logger } from "./utils/logger.js";

const app = express();

app.use(
  cors({
    origin: corsOriginCallback,
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "AAU File Management API" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "AAU File Management", uptime: process.uptime() });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: "connected" });
  } catch (err) {
    logger.error("Readiness check failed:", err?.message || err);
    res.status(503).json({ ok: false, error: "database_unavailable" });
  }
});

app.use((req, _res, next) => {
  if (process.env.NODE_ENV === "development") {
    logger.info(req.method, req.originalUrl);
  }
  next();
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/departments", departmentRoutes);
app.use("/files", fileRoutes);
app.use("/notifications", notificationRoutes);
app.use("/search", searchRoutes);
app.use("/audit", auditRoutes);
app.use("/password-resets", passwordResetRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

export default app;
