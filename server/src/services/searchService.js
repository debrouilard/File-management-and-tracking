import { listFilesForUser } from "./fileService.js";

export async function searchFiles(user, query) {
  return listFilesForUser(user, query);
}
