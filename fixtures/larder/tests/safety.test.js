import test from "node:test";
import assert from "node:assert/strict";
import { app } from "./helpers.js";

test("a stock-take books differences as adjust movements", async () => {
  const { handle, store } = app();
  const take = (await handle({ method: "POST", path: "/stocktakes", body: { location: "dry" } })).body;
  await handle({ method: "POST", path: `/stocktakes/${take.id}/counts`, body: { batchId: 6, counted: 12 } });
  await handle({ method: "POST", path: `/stocktakes/${take.id}/counts`, body: { batchId: 1, counted: 4 } });
  const m0 = store.data.movements.length;
  const res = await handle({ method: "POST", path: `/stocktakes/${take.id}/finish` });
  assert.deepEqual(res.body.lines, [{ batchId: 6, expected: 12.5, counted: 12, diff: -0.5 }]);
  assert.equal(store.data.movements.length, m0 + 1);
  assert.equal(store.data.movements.at(-1).ref, `stocktake:${take.id}:down`);
  const again = await handle({ method: "POST", path: "/stocktakes", body: { location: "dry" } });
  assert.equal(again.status, 201);
});

test("only one open stock-take per location", async () => {
  const { handle } = app();
  await handle({ method: "POST", path: "/stocktakes", body: { location: "fridge" } });
  const second = await handle({ method: "POST", path: "/stocktakes", body: { location: "fridge" } });
  assert.equal(second.status, 400);
});

test("allergens roll up from items to dishes", async () => {
  const { handle } = app();
  assert.deepEqual((await handle({ path: "/recipes/1/allergens" })).body, ["celery", "milk"]);
  const set = await handle({ method: "PUT", path: "/items/1/allergens", body: { allergens: ["Sulphites", "celery", "celery"] } });
  assert.deepEqual(set.body.allergens, ["celery", "sulphites"]);
  const bad = await handle({ method: "PUT", path: "/items/1/allergens", body: { allergens: ["glitter"] } });
  assert.equal(bad.status, 400);
  const matrix = (await handle({ path: "/reports/allergens" })).body;
  assert.deepEqual(matrix.find((d) => d.dishId === 2).allergens, ["gluten", "milk"]);
});

test("temperature breaches and missing checks", async () => {
  const { handle } = app();
  const r = (await handle({ path: "/reports/temperatures?day=2026-10-28" })).body;
  assert.deepEqual(r.breaches.map((b) => b.location), ["freezer"]);
  assert.deepEqual(r.missing, []);
  const next = (await handle({ path: "/reports/temperatures?day=2026-10-29" })).body;
  assert.deepEqual(next.missing, ["fridge", "freezer"]);
  const warm = await handle({ method: "POST", path: "/temperatures", body: { location: "fridge", celsius: 7 } });
  assert.equal(warm.body.ok, false);
});

test("CSV exports", async () => {
  const { handle } = app();
  const ledger = (await handle({ path: "/export/ledger.csv" })).body;
  assert.match(ledger, /^id,at,type,batch,item,qty,ref\n1,2026-10-18T07:30:00Z,receive,1,1,4,order:0\n/);
  const stock = (await handle({ path: "/export/stock.csv" })).body;
  assert.match(stock, /\nDAI-BUTTER,butter,kg,1.5,1\n/);
});
