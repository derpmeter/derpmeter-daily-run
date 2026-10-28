// Storage: one JSON document, loaded whole and written whole. The file is
// written to a temp file first and renamed, so a crash never leaves half a
// file. Ids come from `seq` and are never reused (docs/DATA.md).
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { CURRENT_VERSION, migrate } from "./migrations.js";

class Store {
  constructor(data, file = null) {
    this.data = data;
    this.file = file;
  }

  /** The next id for a collection ("item", "batch", ...). */
  nextId(kind) {
    this.data.seq[kind] = (this.data.seq[kind] ?? 0) + 1;
    return this.data.seq[kind];
  }

  /** Writes the document back (no-op for memory stores). */
  save() {
    if (!this.file) return;
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(this.data, null, 2)}\n`);
    renameSync(tmp, this.file);
  }
}

/** Opens a data file, upgrading it to the current schema in memory. */
export function openStore(file) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  return new Store(migrate(raw), file);
}

/** A store over an in-memory copy of `data` (tests, tools). */
export function memoryStore(data) {
  const copy = migrate(data);
  if (copy.schemaVersion !== CURRENT_VERSION) throw new Error("migration failed");
  return new Store(copy);
}
