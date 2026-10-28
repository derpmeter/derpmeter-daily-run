// The nightly job: queues expiry and low-stock notices for the kitchen
// manager. Safe to run more than once a day (outbox keys include the day).
import { config } from "../config.js";
import { dayOf } from "../dates.js";
import { expiringSoon, lowStock } from "../domain/alerts.js";
import { getItem } from "../domain/items.js";
import { enqueue } from "../domain/outbox.js";

export const MANAGER = "kitchen-manager@larder.local";

/** Runs the nightly checks at `now`; returns the messages it queued or found. */
export function runNightly(store, now) {
  const at = new Date(now).toISOString();
  const day = dayOf(now);
  const out = [];
  for (const b of expiringSoon(store, now, config.expiryAlertDays)) {
    const item = getItem(store, b.itemId);
    out.push(
      enqueue(
        store,
        { key: `expiry:${day}:${b.id}`, kind: "expiry", to: MANAGER, subject: `${item.name} lot ${b.lot} expires ${b.expires}`, body: `${b.qty} ${item.unit} in ${b.location}.` },
        { at },
      ),
    );
  }
  const low = lowStock(store);
  if (low.length)
    out.push(
      enqueue(
        store,
        { key: `low:${day}`, kind: "low_stock", to: MANAGER, subject: `${low.length} items below minimum`, body: low.map((l) => `${l.name}: ${l.qty}/${l.minQty}`).join("\n") },
        { at },
      ),
    );
  return out;
}
