// Purchase orders: draft → sent → received (or cancelled). Receiving an order
// creates one batch per line and a "receive" movement for each.
import { AppError } from "../errors.js";
import { isDate } from "../dates.js";
import { lineCents } from "../money.js";
import { getItem } from "./items.js";
import { record } from "./ledger.js";

const NEXT = { draft: ["sent", "cancelled"], sent: ["received", "cancelled"] };

/** One order, or AppError not_found. */
export function getOrder(store, id) {
  const order = store.data.orders.find((o) => o.id === id);
  if (!order) throw new AppError("not_found");
  return order;
}

/** Creates a draft order for one supplier. */
export function createOrder(store, { supplierId, lines }, { today }) {
  if (!store.data.suppliers.some((s) => s.id === supplierId))
    throw new AppError("unknown_supplier", { id: supplierId });
  if (!Array.isArray(lines) || !lines.length) throw new AppError("bad_request", { reason: "no lines" });
  const clean = lines.map((l) => {
    const item = getItem(store, l.itemId);
    if (!(l.qty > 0)) throw new AppError("invalid_qty");
    return { itemId: item.id, qty: l.qty, priceCents: item.priceCents };
  });
  const order = { id: store.nextId("order"), supplierId, state: "draft", createdOn: today, lines: clean };
  store.data.orders.push(order);
  return order;
}

function move(order, to, action) {
  if (!(NEXT[order.state] ?? []).includes(to))
    throw new AppError("order_state", { id: order.id, state: order.state, action });
  order.state = to;
}

/** draft → sent. */
export function sendOrder(store, id) {
  const order = getOrder(store, id);
  move(order, "sent", "sent");
  return order;
}

/** draft or sent → cancelled. */
export function cancelOrder(store, id) {
  const order = getOrder(store, id);
  move(order, "cancelled", "cancelled");
  return order;
}

/**
 * sent → received. `lots` gives each line's lot, expiry and location, in
 * line order. Creates the batches and their "receive" movements.
 */
export function receiveOrder(store, id, lots, { at }) {
  const order = getOrder(store, id);
  if (!Array.isArray(lots) || lots.length !== order.lines.length)
    throw new AppError("bad_request", { reason: "one lot per line" });
  lots.forEach((l) => {
    if (l.expires !== null && !isDate(l.expires)) throw new AppError("invalid_date");
    if (!store.data.locations.some((loc) => loc.id === l.location))
      throw new AppError("unknown_location", { id: l.location });
  });
  move(order, "received", "received");
  return order.lines.map((line, i) => {
    const batch = {
      id: store.nextId("batch"),
      itemId: line.itemId,
      lot: lots[i].lot,
      qty: line.qty,
      receivedOn: at.slice(0, 10),
      expires: lots[i].expires,
      location: lots[i].location,
    };
    store.data.batches.push(batch);
    record(store, { type: "receive", batchId: batch.id, qty: line.qty, at, ref: `order:${order.id}` });
    return batch;
  });
}

/** An order's total in cents. */
export function orderTotal(order) {
  return order.lines.reduce((sum, l) => sum + lineCents(l.qty, l.priceCents), 0);
}
