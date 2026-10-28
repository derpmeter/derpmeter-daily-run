// Suppliers and their price lists. A price list entry is valid from its
// date until the next entry for the same item and supplier.
import { AppError } from "../errors.js";
import { isDate } from "../dates.js";
import { isCents } from "../money.js";
import { getItem } from "./items.js";

/** Every supplier, in id order. */
export function listSuppliers(store) {
  return [...store.data.suppliers].sort((a, b) => a.id - b.id);
}

/** One supplier, or AppError unknown_supplier. */
export function getSupplier(store, id) {
  const s = store.data.suppliers.find((x) => x.id === id);
  if (!s) throw new AppError("unknown_supplier", { id });
  return s;
}

/** Adds a price list entry (supplier, item, cents, valid from). */
export function addPrice(store, { supplierId, itemId, priceCents, validFrom }) {
  getSupplier(store, supplierId);
  getItem(store, itemId);
  if (!isCents(priceCents)) throw new AppError("bad_request", { reason: "priceCents must be whole cents" });
  if (!isDate(validFrom)) throw new AppError("invalid_date");
  store.data.prices ??= [];
  const entry = { supplierId, itemId, priceCents, validFrom };
  store.data.prices.push(entry);
  return entry;
}

/** The price a supplier charges for an item on `day`, or null. */
export function priceOn(store, supplierId, itemId, day) {
  const entries = (store.data.prices ?? [])
    .filter((p) => p.supplierId === supplierId && p.itemId === itemId && p.validFrom <= day)
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom));
  return entries[0]?.priceCents ?? null;
}

/** The cheapest supplier price for an item on `day`: { supplierId, priceCents } or null. */
export function bestPrice(store, itemId, day) {
  let best = null;
  for (const s of store.data.suppliers) {
    const p = priceOn(store, s.id, itemId, day);
    if (p !== null && (best === null || p < best.priceCents || (p === best.priceCents && s.id < best.supplierId)))
      best = { supplierId: s.id, priceCents: p };
  }
  return best;
}
