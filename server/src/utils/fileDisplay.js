/** Display ID shown everywhere in the UI: manual numeric document code only. */
export function formatDisplayId(documentCode) {
  return String(documentCode || "").trim() || "—";
}

export function parseCombinedId(q) {
  const s = String(q || "").trim();
  const legacy = s.match(/^([A-Za-z0-9]+)\s*-\s*(\d+)$/);
  if (legacy) return { prefix: legacy[1].toUpperCase(), fileNumber: parseInt(legacy[2], 10) };
  const modern = s.match(/^([A-Za-z0-9]+)\s*\/\s*(\d+)(?:\s*\/\s*(\d{4}-\d{2}-\d{2}))?$/);
  if (!modern) return null;
  return { prefix: modern[1].toUpperCase(), fileNumber: parseInt(modern[2], 10) };
}

export function serializeFileRecord(row) {
  if (!row) return row;
  return {
    ...row,
    displayId: formatDisplayId(row.documentCode),
  };
}

export function serializeFileRecords(rows) {
  return rows.map(serializeFileRecord);
}
