// Importing items from CSV (sku,name,unit,minQty,supplierId,priceCents,tags).
// Rows are matched by sku: known skus are updated, new ones added. The whole
// file is checked first; one bad row and nothing is imported.
import { AppError } from "../errors.js";
import { isCents } from "../money.js";
import { parseCsvObjects } from "./csv.js";

const HEADER = ["sku", "name", "unit", "minQty", "supplierId", "priceCents", "tags"];

/** Imports items; returns { added, updated } counts or throws bad_request naming the row. */
export function importItems(store, text) {
  const rows = parseCsvObjects(text);
  const clean = rows.map((r, i) => {
    const where = `row ${i + 2}`;
    for (const k of HEADER) if (!(k in r)) throw new AppError("bad_request", { reason: `missing column ${k}` });
    const minQty = Number(r.minQty);
    const supplierId = Number(r.supplierId);
    const priceCents = Number(r.priceCents);
    if (!/^[A-Z]{3}-[A-Z0-9-]+$/.test(r.sku)) throw new AppError("bad_request", { reason: `${where}: bad sku` });
    if (!r.name) throw new AppError("bad_request", { reason: `${where}: name is required` });
    if (!(minQty >= 0)) throw new AppError("bad_request", { reason: `${where}: bad minQty` });
    if (!store.data.suppliers.some((s) => s.id === supplierId)) throw new AppError("bad_request", { reason: `${where}: unknown supplier` });
    if (!isCents(priceCents)) throw new AppError("bad_request", { reason: `${where}: bad priceCents` });
    const tags = [...new Set(r.tags.split(";").map((t) => t.trim().toLowerCase()).filter(Boolean))].sort();
    return { sku: r.sku, name: r.name.trim().toLowerCase(), unit: r.unit, minQty, supplierId, priceCents, tags };
  });
  let added = 0;
  let updated = 0;
  for (const c of clean) {
    const item = store.data.items.find((i) => i.sku === c.sku);
    if (item) {
      Object.assign(item, c);
      updated++;
    } else {
      store.data.items.push({ id: store.nextId("item"), ...c });
      added++;
    }
  }
  return { added, updated };
}
