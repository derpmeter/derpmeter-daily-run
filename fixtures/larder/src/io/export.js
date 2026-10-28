// CSV exports for accounting and audits.
import { formatCsv } from "./csv.js";
import { listItems, onHand } from "../domain/items.js";

/** The ledger as CSV, oldest first. */
export function ledgerCsv(store) {
  const batchItem = new Map(store.data.batches.map((b) => [b.id, b.itemId]));
  return formatCsv([
    ["id", "at", "type", "batch", "item", "qty", "ref"],
    ...[...store.data.movements].sort((a, b) => a.id - b.id).map((m) => [m.id, m.at, m.type, m.batchId, batchItem.get(m.batchId) ?? "", m.qty, m.ref]),
  ]);
}

/** Stock on hand per item as CSV. */
export function stockCsv(store) {
  return formatCsv([["sku", "name", "unit", "onHand", "minQty"], ...listItems(store).map((i) => [i.sku, i.name, i.unit, onHand(store, i.id), i.minQty])]);
}
