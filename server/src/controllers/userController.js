import { Prisma } from "@prisma/client";
import { bulkImportUsersFromCsv, createUser, listUsers } from "../services/userService.js";

export async function getUsers(_req, res, next) {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (e) {
    next(e);
  }
}

export async function postUser(req, res, next) {
  try {
    const { name, email, password, role, departmentId } = req.body;
    const user = await createUser({ name, email, password, role, departmentId }, req);
    res.status(201).json(user);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return res.status(400).json({ error: "Email already registered" });
    }
    next(e);
  }
}

export async function postBulkUsers(req, res, next) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "CSV file required" });
    }
    const result = await bulkImportUsersFromCsv(req.file.buffer, { actorUserId: req.user.id }, req);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}
