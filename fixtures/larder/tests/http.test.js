import test from "node:test";
import assert from "node:assert/strict";
import { app } from "./helpers.js";

test("items list with stock on hand", async () => {
  const { handle } = app();
  const res = await handle({ path: "/items" });
  assert.equal(res.status, 200);
  assert.equal(res.body.find((i) => i.id === 1).onHand, 10);
});

test("unknown routes and items answer in the error shape", async () => {
  const { handle } = app();
  const a = await handle({ path: "/nope" });
  assert.equal(a.status, 404);
  assert.equal(a.body.error.code, "not_found");
  const b = await handle({ path: "/items/99" });
  assert.equal(b.status, 404);
  assert.match(b.body.error.message, /99/);
});

test("cooking uses every ingredient", async () => {
  const { handle, store } = app();
  const res = await handle({ method: "POST", path: "/recipes/1/cook", body: { portions: 4 } });
  assert.equal(res.status, 200);
  assert.equal(res.body.used.length, 4);
  assert.equal(store.data.batches.filter((b) => b.itemId === 6).reduce((s, b) => s + b.qty, 0), 6.5);
});

test("cooking more than there is changes nothing", async () => {
  const { handle, store } = app();
  const before = JSON.stringify(store.data.batches);
  const res = await handle({ method: "POST", path: "/recipes/2/cook", body: { portions: 100 } });
  assert.equal(res.status, 409);
  assert.equal(JSON.stringify(store.data.batches), before);
});

test("stock value and alerts answer", async () => {
  const { handle } = app();
  assert.equal((await handle({ path: "/reports/stock-value" })).status, 200);
  const alerts = (await handle({ path: "/alerts" })).body;
  assert.ok(alerts.expiring.some((b) => b.lot === "HD-1022"));
  assert.ok(alerts.lowStock.some((i) => i.name === "flour") === false);
});
