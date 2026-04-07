import "dotenv/config";
import http from "http";

if (!process.env.JWT_SECRET) {
  console.error("#92lPq!xZ0@secureKey");
  process.exit(1);
}
import { Server } from "socket.io";
import app from "./app.js";
import { attachSocketAuth } from "./sockets/index.js";

const port = Number(process.env.PORT || 5173);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

app.set("io", io);
attachSocketAuth(io);

server.listen(port, () => {
  console.log(`AAU File Management API listening on port ${port}`);
});
