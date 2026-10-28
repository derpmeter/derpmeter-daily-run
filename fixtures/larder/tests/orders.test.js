import test from "node:test";
import assert from "node:assert/strict";
import { createOrder, orderTotal, receiveOrder, sendOrder } from "../src/domain/orders.js";
import { fresh } from "./helpers.js";

test("an order goes draft → sent → received and makes batches", () => {
  const store = fresh();
  const order = createOrder(store, { supplierId: 1, lines: [{ itemId: 4, qty: 10 }] }, { today: "2026-10-28" });
  assert.equal(order.state, "draft");
  assert.equal(orderTotal(order), 850);
  sendOrder(store, order.id);
  const [batch] = receiveOrder(store, order.id, [{ lot: "GF-1028", expires: "2027-04-28", location: "dry" }], { at: "2026-10-30T08:00:00Z" });
  assert.equal(batch.qty, 10);
  assert.equal(batch.receivedOn, "2026-10-30");
  assert.equal(store.data.orders.find((o) => o.id === order.id).state, "received");
});

test("a draft cannot be received", () => {
  const store = fresh();
  assert.throws(() => receiveOrder(store, 3, [{ lot: "x", expires: null, location: "dry" }], { at: "2026-10-30T08:00:00Z" }), (e) => e.code === "order_state");
});
