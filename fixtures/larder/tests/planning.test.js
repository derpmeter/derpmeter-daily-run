import test from "node:test";
import assert from "node:assert/strict";
import { bestPrice, priceOn } from "../src/domain/suppliers.js";
import { portionCost, recipeCost } from "../src/domain/costing.js";
import { margins } from "../src/domain/menu.js";
import { dailyUse, reorderSuggestions } from "../src/domain/forecast.js";
import { app, fresh, NOW } from "./helpers.js";

test("prices are valid from their date", () => {
  const store = fresh();
  assert.equal(priceOn(store, 1, 1, "2026-10-01"), 175);
  assert.equal(priceOn(store, 1, 1, "2026-10-20"), 180);
  assert.equal(priceOn(store, 1, 1, "2026-08-01"), null);
  assert.deepEqual(bestPrice(store, 1, "2026-10-20"), { supplierId: 2, priceCents: 178 });
});

test("recipe costing and margins", () => {
  const store = fresh();
  const cost = recipeCost(store, 1);
  assert.equal(cost.totalCents, 216 + 95 + 623 + 133);
  assert.equal(portionCost(store, 1), 267);
  const m = margins(store);
  assert.equal(m.length, 2);
  assert.equal(m[0].marginCents, 850 - 267);
});

test("daily use and reorder suggestions from the ledger", () => {
  const store = fresh();
  assert.equal(dailyUse(store, 2, "2026-10-28"), Math.round((2 / 14) * 1000) / 1000);
  const groups = reorderSuggestions(store, "2026-10-28");
  assert.ok(groups.every((g) => g.lines.length > 0));
});

test("the nightly job is safe to run twice", async () => {
  const { handle, store } = app();
  await handle({ method: "POST", path: "/jobs/nightly" });
  const n = store.data.outbox.length;
  assert.ok(n > 0);
  await handle({ method: "POST", path: "/jobs/nightly" });
  assert.equal(store.data.outbox.length, n);
});

test("item import adds and updates by sku, or nothing on a bad row", async () => {
  const { handle, store } = app();
  const ok = await handle({ method: "POST", path: "/import/items", body: { csv: "sku,name,unit,minQty,supplierId,priceCents,tags\nVEG-ONION,Onion,kg,6,1,182,veg\nDRY-SALT,Salt,kg,1,1,60,dry;Basic\n" } });
  assert.deepEqual(ok.body, { added: 1, updated: 1 });
  assert.equal(store.data.items.find((i) => i.sku === "DRY-SALT").id, 7);
  const before = JSON.stringify(store.data.items);
  const bad = await handle({ method: "POST", path: "/import/items", body: { csv: "sku,name,unit,minQty,supplierId,priceCents,tags\nDRY-RICE,Rice,kg,1,1,90,\nbad,x,kg,1,1,1,\n" } });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error.message, /row 3/);
  assert.equal(JSON.stringify(store.data.items), before);
  assert.equal(NOW > 0, true);
});
