import { Prisma } from "@prisma/client";
import { bulkImportUsersFromCsv, createUser, deleteUser, listUsers, updateUser } from "../services/userService.js";

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

export async function patchUser(req, res, next) {
  try {
    const { name, email, role, departmentId } = req.body;
    const user = await updateUser(req.params.id, { name, email, role, departmentId }, req);
    res.json(user);
  } catch (e) {
    next(e);
  }
}

export async function deleteUserById(req, res, next) {
  try {
    await deleteUser(req.params.id, req);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
