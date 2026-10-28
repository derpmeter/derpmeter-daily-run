import { cancelOrder, createOrder, getOrder, orderTotal, receiveOrder, sendOrder } from "../../domain/orders.js";
import { dayOf } from "../../dates.js";
import { dateField, idParam, objectBody } from "../validate.js";

const withTotal = (o) => ({ ...o, totalCents: orderTotal(o) });

/** Orders: create, read, send, receive, cancel. */
export const orderRoutes = [
  ["GET", "/orders/:id", ({ store, params }) => ({ status: 200, body: withTotal(getOrder(store, idParam(params.id))) })],
  ["POST", "/orders", ({ store, body, now }) => {
    const b = objectBody(body);
    const order = createOrder(store, { supplierId: b.supplierId, lines: b.lines }, { today: dayOf(now) });
    store.save();
    return { status: 201, body: withTotal(order) };
  }],
  ["POST", "/orders/:id/send", ({ store, params }) => {
    const order = sendOrder(store, idParam(params.id));
    store.save();
    return { status: 200, body: withTotal(order) };
  }],
  ["POST", "/orders/:id/cancel", ({ store, params }) => {
    const order = cancelOrder(store, idParam(params.id));
    store.save();
    return { status: 200, body: withTotal(order) };
  }],
  ["POST", "/orders/:id/receive", ({ store, params, body, now }) => {
    const b = objectBody(body);
    const lots = (b.lots ?? []).map((l) => ({ lot: String(l.lot ?? ""), expires: dateField(l.expires ?? null, { nullable: true }), location: l.location }));
    const batches = receiveOrder(store, idParam(params.id), lots, { at: new Date(now).toISOString() });
    store.save();
    return { status: 200, body: { batches } };
  }],
];
