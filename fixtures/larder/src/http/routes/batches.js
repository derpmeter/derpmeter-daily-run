import { getBatch, listBatches, waste } from "../../domain/batches.js";
import { movementsFor } from "../../domain/ledger.js";
import { idParam, objectBody, qtyField } from "../validate.js";

/** GET /batches, GET /batches/:id, POST /batches/:id/waste. */
export const batchRoutes = [
  ["GET", "/batches", ({ store, query }) => ({
    status: 200,
    body: listBatches(store, query.itemId ? { itemId: idParam(query.itemId) } : {}),
  })],
  ["GET", "/batches/:id", ({ store, params }) => {
    const batch = getBatch(store, idParam(params.id));
    return { status: 200, body: { ...batch, movements: movementsFor(store, batch.id) } };
  }],
  ["POST", "/batches/:id/waste", ({ store, params, body, now }) => {
    const b = objectBody(body);
    const movement = waste(store, idParam(params.id), qtyField(b.qty), { at: new Date(now).toISOString(), ref: String(b.reason ?? "") });
    store.save();
    return { status: 201, body: movement };
  }],
];
