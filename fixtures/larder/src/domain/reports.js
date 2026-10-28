// Reports over the whole store.
import { listItems } from "./items.js";

/**
 * Stock value: every batch at its item's price. Returns the total and one
 * line per item, in cents.
 */
export function stockValue(store) {
  const lines = listItems(store).map((item) => {
    const qty = store.data.batches
      .filter((b) => b.itemId === item.id)
      .reduce((s, b) => s + b.qty, 0);
    return { itemId: item.id, name: item.name, qty, valueCents: qty * item.priceCents };
  });
  const total = lines.reduce((s, l) => s + l.valueCents, 0);
  return {
    totalCents: Math.round(total),
    lines: lines.map((l) => ({ ...l, valueCents: Math.round(l.valueCents) })),
  };
}

/** Waste per item between two days (inclusive), from the ledger. */
export function wasteReport(store, from, to) {
  const byItem = new Map();
  for (const m of store.data.movements) {
    if (m.type !== "waste" || m.qty <= 0) continue;
    const day = m.at.slice(0, 10);
    if (day < from || day > to) continue;
    const batch = store.data.batches.find((b) => b.id === m.batchId);
    if (!batch) continue;
    byItem.set(batch.itemId, (byItem.get(batch.itemId) ?? 0) + m.qty);
  }
  return [...byItem].map(([itemId, qty]) => ({ itemId, qty })).sort((a, b) => a.itemId - b.itemId);
}
