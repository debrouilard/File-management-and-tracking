import { searchFiles } from "../services/searchService.js";

export async function getSearch(req, res, next) {
  try {
    const rows = await searchFiles(req.user, req.query);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}
