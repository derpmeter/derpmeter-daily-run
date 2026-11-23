import { test } from "node:test";
import assert from "node:assert/strict";
import { STALL_SEC, pastHardCap } from "../lib/stall.mjs";

const task = { budgetSec: 100 }; // hard cap 400 s

test("old results keep the hard cap reading", () => {
  assert.equal(pastHardCap({ timed_out: true, duration_ms: 1000 }, task), true);
  assert.equal(pastHardCap({ timed_out: false, duration_ms: 500_000 }, task), true);
  assert.equal(pastHardCap({ timed_out: false, duration_ms: 10_000 }, task), false);
});

test("a result that ran past the old cap to the end is not a timeout", () => {
  assert.equal(pastHardCap({ timed_out: false, duration_ms: 2_000_000, stall_cap_sec: STALL_SEC }, task), false);
});

test("a stalled result is not a timeout either (it is skipped)", () => {
  assert.equal(pastHardCap({ timed_out: true, skipped: "crash", duration_ms: STALL_SEC * 1000, stall_cap_sec: STALL_SEC }, task), false);
});
