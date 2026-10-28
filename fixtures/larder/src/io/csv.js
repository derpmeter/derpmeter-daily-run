// CSV reading and writing (RFC 4180: quoted fields, doubled quotes, CRLF or
// LF line ends; no newlines inside fields).

/** Rows of fields from CSV text; blank lines are skipped. */
export function parseCsv(text) {
  const rows = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.trim()) continue;
    const fields = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") {
        fields.push(cur);
        cur = "";
      } else cur += ch;
    }
    fields.push(cur);
    rows.push(fields);
  }
  return rows;
}

/** Objects keyed by the header row. */
export function parseCsvObjects(text) {
  const [head = [], ...rows] = parseCsv(text);
  const keys = head.map((h) => h.trim());
  return rows.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

/** CSV text for rows of values (quoted when needed). */
export function formatCsv(rows) {
  const cell = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return `${rows.map((r) => r.map(cell).join(",")).join("\n")}\n`;
}
