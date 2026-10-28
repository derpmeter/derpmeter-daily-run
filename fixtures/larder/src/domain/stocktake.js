// Stock-takes: count what is really on the shelf, then book the differences.
// A stock-take is open while counts are entered; finishing it writes one
// "adjust" movement per batch whose count differs (docs/DATA.md: the ledger
// explains every change).
import { AppError } from "../errors.js";
import { getBatch } from "./batches.js";
import { record } from "./ledger.js";

/** Starts a stock-take for one location; only one may be open per location. */
export function startStocktake(store, location, { at }) {
  if (!store.data.locations.some((l) => l.id === location)) throw new AppError("unknown_location", { id: location });
  store.data.stocktakes ??= [];
  if (store.data.stocktakes.some((s) => s.location === location && s.state === "open"))
    throw new AppError("bad_request", { reason: `a stock-take is already open for ${location}` });
  const take = { id: store.nextId("stocktake"), location, state: "open", startedAt: at, finishedAt: null, counts: [] };
  store.data.stocktakes.push(take);
  return take;
}

function openTake(store, id) {
  const take = (store.data.stocktakes ?? []).find((s) => s.id === id);
  if (!take) throw new AppError("not_found");
  if (take.state !== "open") throw new AppError("bad_request", { reason: "the stock-take is finished" });
  return take;
}

/** Enters (or replaces) the counted quantity of one batch. */
export function enterCount(store, id, batchId, counted) {
  const take = openTake(store, id);
  const batch = getBatch(store, batchId);
  if (batch.location !== take.location) throw new AppError("bad_request", { reason: "the batch is not in this location" });
  if (!(counted >= 0)) throw new AppError("invalid_qty");
  take.counts = take.counts.filter((c) => c.batchId !== batchId).concat({ batchId, counted });
  return take;
}

/** Finishes a stock-take and books the differences; returns the variance lines. */
export function finishStocktake(store, id, { at }) {
  const take = openTake(store, id);
  const lines = [];
  for (const c of take.counts) {
    const batch = getBatch(store, c.batchId);
    const diff = Math.round((c.counted - batch.qty) * 1000) / 1000;
    if (diff === 0) continue;
    batch.qty = c.counted;
    record(store, { type: "adjust", batchId: batch.id, qty: Math.abs(diff), at, ref: `stocktake:${take.id}:${diff > 0 ? "up" : "down"}` });
    lines.push({ batchId: batch.id, expected: Math.round((c.counted - diff) * 1000) / 1000, counted: c.counted, diff });
  }
  take.state = "finished";
  take.finishedAt = at;
  return lines;
}
