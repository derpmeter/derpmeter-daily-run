import { test } from "node:test";
import assert from "node:assert/strict";
import { kstDay, scheduledOut } from "../lib/schedule.mjs";

const schedule = [
  { agent: "codex", pausedThrough: "2026-11-26" },
  { agent: "gemini-cli", models: ["gemini-4-argon", "gemini-4-carbon"], everyDays: 2, anchor: "2026-11-24" },
];
const codex = { agent: "codex", model: "gpt-6.2-sol" };
const argon = { agent: "gemini-cli", model: "gemini-4-argon" };
const neon = { agent: "gemini-cli", model: "gemini-4-neon" };

test("the 03:30 KST run belongs to the KST day", () => {
  assert.equal(kstDay(new Date("2026-11-22T18:30:00Z")), "2026-11-23");
});

test("a paused agent runs again the day after its pause", () => {
  assert.match(scheduledOut(schedule, codex, "2026-11-23"), /paused/);
  assert.match(scheduledOut(schedule, codex, "2026-11-26"), /paused/);
  assert.equal(scheduledOut(schedule, codex, "2026-11-27"), null);
});

test("every other day runs on the anchor and every second day", () => {
  assert.notEqual(scheduledOut(schedule, argon, "2026-11-23"), null);
  assert.equal(scheduledOut(schedule, argon, "2026-11-24"), null);
  assert.notEqual(scheduledOut(schedule, argon, "2026-11-25"), null);
  assert.equal(scheduledOut(schedule, argon, "2026-11-26"), null);
  assert.equal(scheduledOut(schedule, argon, "2026-12-02"), null);
});

test("models outside a rule are not touched", () => {
  for (const day of ["2026-11-23", "2026-11-24"]) assert.equal(scheduledOut(schedule, neon, day), null);
  assert.equal(scheduledOut(undefined, argon, "2026-11-23"), null);
});
