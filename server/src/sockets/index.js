import { verifyToken } from "../utils/jwt.js";

export function attachSocketAuth(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));
      const payload = verifyToken(token);
      socket.user = {
        id: payload.id,
        role: payload.role,
        departmentId: payload.departmentId,
      };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);
    socket.join(`dept:${socket.user.departmentId}`);
  });
}
