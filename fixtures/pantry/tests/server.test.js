import test from "node:test";
import assert from "node:assert/strict";
import { handle } from "../src/server.js";

const NOW = Date.parse("2026-10-30T00:00:00Z");

test("expiring lists items within a week that have not expired", async () => {
  const res = await handle("/expiring", NOW);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.map((i) => i.name), ["milk"]);
});

test("unknown paths are 404", async () => {
  assert.equal((await handle("/nope", NOW)).status, 404);
});
