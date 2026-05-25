import "dotenv/config";
import { loadAndValidateEnv } from "./config/env.js";

loadAndValidateEnv();

import http from "http";
import { Server } from "socket.io";
import { prisma } from "./utils/prisma.js";
import app from "./app.js";
import { attachSocketAuth } from "./sockets/index.js";
import { getAllowedOrigins } from "./utils/allowedOrigins.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const port = env.port;

try {
  await prisma.$connect();
  logger.info("PostgreSQL connection established.");
} catch (err) {
  logger.error("FATAL: Cannot connect to PostgreSQL. Check DATABASE_URL and that the server is reachable.");
  logger.error(err?.message || err);
  process.exit(1);
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
});

app.set("io", io);
attachSocketAuth(io);

server.listen(port, () => {
  logger.info(`AAU File Management API listening on port ${port}`);
});

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down…`);
  try {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  } catch (_) {
    /* ignore */
  }
  try {
    await prisma.$disconnect();
    logger.info("Prisma disconnected.");
  } catch (e) {
    logger.warn("Prisma disconnect:", e?.message);
  }
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err?.message || err);
  if (err?.stack) logger.error(err.stack);
  process.exit(1);
});
