// Alerts: batches that expire soon and items below their minimum.
import { addDays, dayOf } from "../dates.js";
import { listItems, onHand } from "./items.js";

/** Batches with stock that expire within `days` days of `now`, soonest first. */
export function expiringSoon(store, now, days) {
  const today = dayOf(now);
  const until = addDays(today, days);
  return store.data.batches
    .filter((b) => b.qty > 0 && b.expires && b.expires >= today && b.expires <= until)
    .sort((a, b) => a.expires.localeCompare(b.expires) || a.id - b.id);
}

/** Items whose stock is below `minQty`. */
export function lowStock(store) {
  return listItems(store)
    .map((item) => ({ item, qty: onHand(store, item.id) }))
    .filter(({ item, qty }) => qty < item.minQty)
    .map(({ item, qty }) => ({ itemId: item.id, name: item.name, qty, minQty: item.minQty }));
}
