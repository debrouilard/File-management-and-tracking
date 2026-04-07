import { Prisma } from "@prisma/client";
import { createUser, listUsers } from "../services/userService.js";

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
    const user = await createUser({ name, email, password, role, departmentId });
    res.status(201).json(user);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return res.status(400).json({ error: "Email already registered" });
    }
    next(e);
  }
}
