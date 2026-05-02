import { createDepartment, deleteDepartment, listDepartments, updateDepartment } from "../services/departmentService.js";

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

export async function patchDepartment(req, res, next) {
  try {
    const { name, prefix } = req.body;
    const row = await updateDepartment(req.params.id, { name, prefix }, req);
    res.json(row);
  } catch (e) {
    next(e);
  }
}

export async function deleteDepartmentById(req, res, next) {
  try {
    await deleteDepartment(req.params.id, req);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
