import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import departmentRoutes from "./routes/departments.js";
import fileRoutes from "./routes/files.js";
import notificationRoutes from "./routes/notifications.js";
import searchRoutes from "./routes/search.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "AAU File Management" });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/departments", departmentRoutes);
app.use("/files", fileRoutes);
app.use("/notifications", notificationRoutes);
app.use("/search", searchRoutes);

app.use(errorHandler);

export default app;
