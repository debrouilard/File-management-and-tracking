import { completePasswordResetRequest, listPasswordResetRequests } from "../services/passwordResetService.js";

export async function getPasswordResetRequests(req, res, next) {
  try {
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const rawLimit = req.query.limit;
    let limit;
    if (rawLimit !== undefined && rawLimit !== "") {
      const n = parseInt(String(rawLimit), 10);
      if (Number.isFinite(n)) limit = Math.min(200, Math.max(1, n));
    }
    const rows = await listPasswordResetRequests({ status, limit });
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
