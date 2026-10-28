import test from "node:test";
import assert from "node:assert/strict";
import { findByTag, addItem } from "../src/items.js";
import { fetchItems } from "../src/store.js";

test("findByTag returns fridge items", async () => {
  const names = (await findByTag("fridge")).map((i) => i.name);
  assert.deepEqual(names, ["milk", "egg", "yogurt"]);
});

test("addItem assigns the next id", async () => {
  const item = await addItem({ name: "flour", qty: 1, unit: "bag" });
  assert.equal(item.id, 5);
  assert.equal((await fetchItems()).length, 5);
});
