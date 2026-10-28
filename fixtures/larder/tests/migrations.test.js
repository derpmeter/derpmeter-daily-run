import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CURRENT_VERSION, migrate } from "../src/db/migrations.js";

const legacy = () => JSON.parse(readFileSync(new URL("../data/legacy-v1.json", import.meta.url), "utf8"));

test("schema 1 files open as the current schema", () => {
  const data = migrate(legacy());
  assert.equal(data.schemaVersion, CURRENT_VERSION);
  assert.equal(data.batches.length, 1);
  assert.equal(data.batches[0].qty, 7);
  assert.equal(data.items[0].stock, undefined);
});

test("a newer schema is refused", () => {
  assert.throws(() => migrate({ schemaVersion: CURRENT_VERSION + 1 }));
});
