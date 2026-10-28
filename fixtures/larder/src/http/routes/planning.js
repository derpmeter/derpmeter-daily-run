import { addPrice, bestPrice, getSupplier, listSuppliers, priceOn } from "../../domain/suppliers.js";
import { addDish, listDishes, margins } from "../../domain/menu.js";
import { recipeCost } from "../../domain/costing.js";
import { dailyUse, reorderSuggestions } from "../../domain/forecast.js";
import { getItem } from "../../domain/items.js";
import { markSent, pending } from "../../domain/outbox.js";
import { importItems } from "../../io/items-import.js";
import { runNightly } from "../../jobs/nightly.js";
import { dayOf } from "../../dates.js";
import { AppError } from "../../errors.js";
import { dateField, idParam, objectBody } from "../validate.js";

/** Suppliers, prices, menu, costing, forecasts, outbox, imports and the nightly job. */
export const planningRoutes = [
  ["GET", "/suppliers", ({ store }) => ({ status: 200, body: listSuppliers(store) })],
  ["GET", "/suppliers/:id/prices", ({ store, params, query, now }) => {
    const s = getSupplier(store, idParam(params.id));
    const day = query.on ? dateField(query.on) : dayOf(now);
    const items = store.data.items.filter((i) => priceOn(store, s.id, i.id, day) !== null);
    return { status: 200, body: items.map((i) => ({ itemId: i.id, priceCents: priceOn(store, s.id, i.id, day) })) };
  }],
  ["POST", "/prices", ({ store, body }) => {
    const b = objectBody(body);
    const entry = addPrice(store, { supplierId: b.supplierId, itemId: b.itemId, priceCents: b.priceCents, validFrom: b.validFrom });
    store.save();
    return { status: 201, body: entry };
  }],
  ["GET", "/items/:id/best-price", ({ store, params, now }) => {
    const item = getItem(store, idParam(params.id));
    return { status: 200, body: bestPrice(store, item.id, dayOf(now)) };
  }],
  ["GET", "/dishes", ({ store }) => ({ status: 200, body: listDishes(store) })],
  ["POST", "/dishes", ({ store, body }) => {
    const b = objectBody(body);
    const dish = addDish(store, { name: b.name, recipeId: b.recipeId, priceCents: b.priceCents });
    store.save();
    return { status: 201, body: dish };
  }],
  ["GET", "/reports/margins", ({ store }) => ({ status: 200, body: margins(store) })],
  ["GET", "/recipes/:id/cost", ({ store, params }) => ({ status: 200, body: recipeCost(store, idParam(params.id)) })],
  ["GET", "/forecast/use/:itemId", ({ store, params, now }) => {
    const item = getItem(store, idParam(params.itemId));
    return { status: 200, body: { itemId: item.id, perDay: dailyUse(store, item.id, dayOf(now)) } };
  }],
  ["GET", "/forecast/reorder", ({ store, now }) => ({ status: 200, body: reorderSuggestions(store, dayOf(now)) })],
  ["GET", "/outbox", ({ store }) => ({ status: 200, body: pending(store) })],
  ["POST", "/outbox/:id/sent", ({ store, params, now }) => {
    const m = markSent(store, idParam(params.id), { at: new Date(now).toISOString() });
    if (!m) throw new AppError("not_found");
    store.save();
    return { status: 200, body: m };
  }],
  ["POST", "/import/items", ({ store, body }) => {
    const b = objectBody(body);
    if (typeof b.csv !== "string") throw new AppError("bad_request", { reason: "csv must be text" });
    const result = importItems(store, b.csv);
    store.save();
    return { status: 200, body: result };
  }],
  ["POST", "/jobs/nightly", ({ store, now }) => {
    const queued = runNightly(store, now);
    store.save();
    return { status: 200, body: { queued: queued.length } };
  }],
];
