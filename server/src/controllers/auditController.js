import { listAuditLogs } from "../services/auditService.js";

export async function getAuditLogs(req, res, next) {
  try {
    const take = Number(req.query.take || 100);
    const skip = Number(req.query.skip || 0);
    const rows = await listAuditLogs({
      take,
      skip,
      resourceType: req.query.resourceType,
      resourceId: req.query.resourceId,
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
}
