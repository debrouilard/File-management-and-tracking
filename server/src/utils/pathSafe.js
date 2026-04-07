import path from "path";

export function sanitizeFilename(name) {
  const base = path.basename(name || "document");
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "document";
}
