import {
  completePasswordResetRequest,
  createPasswordResetRequest,
  listPasswordResetRequests,
} from "../services/passwordResetService.js";

export async function postForgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await createPasswordResetRequest(email, req);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function getPasswordResetRequests(req, res, next) {
  try {
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const rows = await listPasswordResetRequests({ status });
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function postCompletePasswordReset(req, res, next) {
  try {
    const { tempPassword } = req.body;
    const row = await completePasswordResetRequest(req.params.id, { tempPassword }, req.user.id, req);
    res.json(row);
  } catch (e) {
    next(e);
  }
}

