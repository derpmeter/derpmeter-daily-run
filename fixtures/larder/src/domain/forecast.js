// Forecasting from the ledger: how fast items are used and what to reorder.
import { addDays, dayOf } from "../dates.js";
import { listItems, onHand } from "./items.js";

/** Average quantity of an item consumed per day over the `days` days before `today` (3 decimals). */
export function dailyUse(store, itemId, today, days = 14) {
  const from = addDays(today, -days);
  const batchItem = new Map(store.data.batches.map((b) => [b.id, b.itemId]));
  const used = store.data.movements
    .filter((m) => m.type === "consume" && batchItem.get(m.batchId) === itemId)
    .filter((m) => {
      const d = dayOf(m.at);
      return d >= from && d < today;
    })
    .reduce((s, m) => s + m.qty, 0);
  return Math.round((used / days) * 1000) / 1000;
}

/**
 * Reorder suggestions: items whose stock will not last until a delivery
 * (the supplier's lead days plus `safetyDays`) or are below their minimum.
 * Quantity brings stock up to cover lead + safety + `coverDays` of use, and
 * at least to the minimum. Grouped by supplier.
 */
export function reorderSuggestions(store, today, { safetyDays = 2, coverDays = 7, window = 14 } = {}) {
  const bySupplier = new Map();
  for (const item of listItems(store)) {
    const supplier = store.data.suppliers.find((s) => s.id === item.supplierId);
    if (!supplier) continue;
    const use = dailyUse(store, item.id, today, window);
    const stock = onHand(store, item.id);
    const lead = supplier.leadDays + safetyDays;
    const needAtDelivery = use * lead;
    if (stock > needAtDelivery && stock >= item.minQty) continue;
    const target = Math.max(item.minQty, use * (lead + coverDays));
    const qty = Math.ceil(Math.max(0, target - stock) * 10) / 10;
    if (qty <= 0) continue;
    const list = bySupplier.get(supplier.id) ?? [];
    list.push({ itemId: item.id, name: item.name, qty, unit: item.unit });
    bySupplier.set(supplier.id, list);
  }
  return [...bySupplier].map(([supplierId, lines]) => ({ supplierId, lines })).sort((a, b) => a.supplierId - b.supplierId);
}
