import { createDepartment, listDepartments } from "../services/departmentService.js";

export async function getDepartments(_req, res, next) {
  try {
    const rows = await listDepartments();
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function postDepartment(req, res, next) {
  try {
    const { name, prefix } = req.body;
    const row = await createDepartment({ name, prefix });
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
}
