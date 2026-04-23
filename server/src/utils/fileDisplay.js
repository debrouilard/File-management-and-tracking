export function formatDisplayId(prefix, fileNumber) {
  const p = String(prefix || "UNK").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${p}-${fileNumber}`;
}

export function parseCombinedId(q) {
  const s = String(q || "").trim();
  const m = s.match(/^([A-Za-z0-9]+)-(\d+)$/);
  if (!m) return null;
  return { prefix: m[1].toUpperCase(), fileNumber: parseInt(m[2], 10) };
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
