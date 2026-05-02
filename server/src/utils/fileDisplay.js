export function formatDisplayId(prefix, fileNumber) {
  const p = String(prefix || "UNK").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${p}/${fileNumber}/${yyyy}-${mm}-${dd}`;
}

export function parseCombinedId(q) {
  const s = String(q || "").trim();
  // Accept legacy format "PREFIX - 123" and new format "PREFIX/123/YYYY-MM-DD" (date optional for search)
  const legacy = s.match(/^([A-Za-z0-9]+)\s*-\s*(\d+)$/);
  if (legacy) return { prefix: legacy[1].toUpperCase(), fileNumber: parseInt(legacy[2], 10) };
  const modern = s.match(/^([A-Za-z0-9]+)\s*\/\s*(\d+)(?:\s*\/\s*(\d{4}-\d{2}-\d{2}))?$/);
  if (!modern) return null;
  return { prefix: modern[1].toUpperCase(), fileNumber: parseInt(modern[2], 10) };
}

export function serializeFileRecord(row) {
  if (!row) return row;
  const prefix = row.senderDept?.prefix || "UNK";
  return {
    ...row,
    displayId: formatDisplayId(prefix, row.fileNumber),
  };
}

export function serializeFileRecords(rows) {
  return rows.map(serializeFileRecord);
}
