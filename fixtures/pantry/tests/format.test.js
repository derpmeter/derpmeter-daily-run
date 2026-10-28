import test from "node:test";
import assert from "node:assert/strict";
import { formatQty } from "../src/format.js";

test("plural units", () => {
  assert.equal(formatQty(2, "bag", "rice"), "2 bags");
});

test("one of something is singular", () => {
  assert.equal(formatQty(1, "carton", "milk"), "1 carton");
});

test("items without a unit count the item", () => {
  assert.equal(formatQty(6, "", "egg"), "6 eggs");
});
