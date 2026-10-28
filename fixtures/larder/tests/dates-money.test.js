import test from "node:test";
import assert from "node:assert/strict";
import { addDays, dayOf, daysBetween, isDate } from "../src/dates.js";
import { formatCents, lineCents } from "../src/money.js";

test("calendar dates", () => {
  assert.equal(isDate("2026-02-28"), true);
  assert.equal(isDate("2026-02-30"), false);
  assert.equal(dayOf("2026-10-28T23:59:59Z"), "2026-10-28");
  assert.equal(daysBetween("2026-10-28", "2026-11-02"), 5);
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("money in cents", () => {
  assert.equal(lineCents(2, 180), 360);
  assert.equal(lineCents(1.5, 945), 1418);
  assert.equal(formatCents(1234), "12.34");
  assert.equal(formatCents(5), "0.05");
});
