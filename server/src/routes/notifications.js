import { Router } from "express";
import {
  getNotifications,
  patchNotificationRead,
  postMarkAllRead,
} from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

r.use(requireAuth);

r.get("/", getNotifications);
r.patch("/:id/read", patchNotificationRead);
r.post("/read-all", postMarkAllRead);

export default r;
