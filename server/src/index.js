import "dotenv/config";
import http from "http";

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Copy server/.env.example to server/.env and set secrets.");
  process.exit(1);
}

import { Server } from "socket.io";
import app from "./app.js";
import { attachSocketAuth } from "./sockets/index.js";

const port = Number(process.env.PORT || 4000);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

app.set("io", io);
attachSocketAuth(io);

/* ✅ ADD THIS HERE */
app.get("/", (req, res) => {
  res.json({ status: "Server is running" });
});

server.listen(port, () => {
  console.log(`AAU File Management API listening on port ${port}`);
});
