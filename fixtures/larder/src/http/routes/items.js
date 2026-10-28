import { getItem, listItems, onHand } from "../../domain/items.js";
import { listBatches } from "../../domain/batches.js";
import { idParam } from "../validate.js";

/** GET /items and GET /items/:id. */
export const itemRoutes = [
  ["GET", "/items", ({ store }) => ({
    status: 200,
    body: listItems(store).map((i) => ({ ...i, onHand: onHand(store, i.id) })),
  })],
  ["GET", "/items/:id", ({ store, params }) => {
    const item = getItem(store, idParam(params.id));
    return { status: 200, body: { ...item, onHand: onHand(store, item.id), batches: listBatches(store, { itemId: item.id }) } };
  }],
];
