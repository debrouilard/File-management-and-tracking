import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import departmentRoutes from "./routes/departments.js";
import fileRoutes from "./routes/files.js";
import notificationRoutes from "./routes/notifications.js";
import searchRoutes from "./routes/search.js";
import auditRoutes from "./routes/audit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { issueCsrf, verifyCsrf } from "./middleware/csrf.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "AAU File Management" });
});

app.get("/auth/csrf", issueCsrf);

app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const path = req.originalUrl.split("?")[0];
  if (path === "/health" || path === "/auth/csrf") return next();
  return verifyCsrf(req, res, next);
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/departments", departmentRoutes);
app.use("/files", fileRoutes);
app.use("/notifications", notificationRoutes);
app.use("/search", searchRoutes);
app.use("/audit", auditRoutes);

app.use(errorHandler);

export default app;
