// Batches (lots) of an item. Stock is consumed from batches in the order set
// by docs/DATA.md; consumption is all or nothing.
import { AppError } from "../errors.js";
import { getItem, onHand } from "./items.js";
import { record } from "./ledger.js";

/** Batches, optionally of one item, in id order. */
export function listBatches(store, { itemId } = {}) {
  return store.data.batches
    .filter((b) => itemId === undefined || b.itemId === itemId)
    .sort((a, b) => a.id - b.id);
}

/** One batch, or AppError unknown_batch. */
export function getBatch(store, id) {
  const batch = store.data.batches.find((b) => b.id === id);
  if (!batch) throw new AppError("unknown_batch", { id });
  return batch;
}

// The order in which an item's batches are used up.
function consumptionOrder(batches) {
  return [...batches].sort((a, b) => b.receivedOn.localeCompare(a.receivedOn));
}

/**
 * Takes `qty` of an item from its batches and writes one "consume" movement
 * per batch touched. Throws not_enough_stock (and changes nothing) when the
 * item does not have enough.
 */
export function consume(store, itemId, qty, { at, ref = "" }) {
  const item = getItem(store, itemId);
  if (!(qty > 0)) throw new AppError("invalid_qty");
  const available = onHand(store, itemId);
  if (available < qty)
    throw new AppError("not_enough_stock", { item: item.name, available, unit: item.unit });
  let left = qty;
  const used = [];
  for (const batch of consumptionOrder(listBatches(store, { itemId }))) {
    if (left <= 0) break;
    const take = Math.min(batch.qty, left);
    if (take <= 0) continue;
    batch.qty = Math.round((batch.qty - take) * 1000) / 1000;
    left = Math.round((left - take) * 1000) / 1000;
    used.push({ batchId: batch.id, qty: take });
    record(store, { type: "consume", batchId: batch.id, qty: take, at, ref });
  }
  return used;
}

/** Records waste from one batch (spoiled, dropped). */
export function waste(store, batchId, qty, { at, ref = "" }) {
  const batch = getBatch(store, batchId);
  if (!(qty > 0) || qty > batch.qty) throw new AppError("invalid_qty");
  batch.qty = Math.round((batch.qty - qty) * 1000) / 1000;
  return record(store, { type: "waste", batchId, qty, at, ref });
}
