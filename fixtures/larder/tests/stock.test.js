import test from "node:test";
import assert from "node:assert/strict";
import { consume, waste } from "../src/domain/batches.js";
import { onHand } from "../src/domain/items.js";
import { fresh } from "./helpers.js";

const at = "2026-10-28T10:00:00Z";

test("consume takes stock and writes the ledger", () => {
  const store = fresh();
  const before = store.data.movements.length;
  const used = consume(store, 4, 2, { at, ref: "test" });
  assert.equal(onHand(store, 4), 10.5);
  assert.equal(used.length, 1);
  assert.equal(store.data.movements.length, before + 1);
});

test("not enough stock changes nothing", () => {
  const store = fresh();
  assert.throws(() => consume(store, 3, 5, { at }), (e) => e.code === "not_enough_stock");
  assert.equal(onHand(store, 3), 1.5);
});

test("waste is recorded against a batch", () => {
  const store = fresh();
  const m = waste(store, 6, 0.5, { at, ref: "spill" });
  assert.equal(m.type, "waste");
  assert.equal(store.data.batches.find((b) => b.id === 6).qty, 12);
});
