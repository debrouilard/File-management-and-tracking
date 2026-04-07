import { prisma } from "../utils/prisma.js";

export async function getNotifications(req, res, next) {
  try {
    const rows = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function patchNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    const n = await prisma.notification.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!n) return res.status(404).json({ error: "Not found" });
    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function postMarkAllRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
