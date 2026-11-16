import test from "node:test";
import assert from "node:assert/strict";
import { addToGrid, changelogEntry, prependEntry, probeAnswered, probeCommand } from "../lib/candidates.mjs";

test("a candidate joins only when its CLI answers with that model", () => {
  const claude = (models, extra = {}) => ({
    code: 0,
    stdout: `${JSON.stringify({ type: "result", is_error: false, modelUsage: Object.fromEntries(models.map((m) => [m, {}])), ...extra })}\n`,
  });
  assert.equal(probeAnswered("claude-code", "claude-opus-5-6", claude(["claude-opus-5-6", "claude-haiku-5-5"])), true);
  assert.equal(probeAnswered("claude-code", "claude-opus-5-6", claude(["claude-opus-5-5"])), false);
  assert.equal(probeAnswered("claude-code", "claude-opus-5-6", claude(["claude-opus-5-6"], { is_error: true })), false);
  assert.equal(probeAnswered("claude-code", "x", { code: 1, stdout: "" }), false);
  assert.equal(probeAnswered("codex", "gpt-6.2-sol", { code: 0, stdout: '{"type":"turn.completed"}' }), true);
  assert.equal(probeAnswered("codex", "gpt-6.2-sol", { code: 0, stdout: '{"type":"error","message":"model not found"}' }), false);
  assert.equal(probeAnswered("codex", "gpt-6.2-sol", { code: 0, stdout: '{"type":"thread.started"}' }), false);
  assert.equal(probeAnswered("claude-code", "claude-opus-5-6", { code: 0, stdout: '{"type":"result","is_error":false}' }), true);
  const served = new Set(["gemini-5-neon-medium", "gemini-5-neon-high"]);
  assert.equal(probeAnswered("gemini-cli", "gemini-5-neon", { code: 0, stdout: "" }, served, ["medium"]), true);
  assert.equal(probeAnswered("gemini-cli", "gemini-5-argon", { code: 0, stdout: "" }, served, ["medium"]), false);
  assert.equal(probeCommand("gemini-cli", "x"), null);
  assert.deepEqual(probeCommand("codex", "gpt-6.2-sol", { codex: "/bin/codex" }).slice(0, 1), ["/bin/codex"]);
});

test("the grid, the changelog entry and its place", () => {
  const grid = { codex: { models: ["gpt-6.1-sol"] } };
  assert.deepEqual(addToGrid(grid, "codex", "gpt-6.2-sol").codex.models, ["gpt-6.1-sol", "gpt-6.2-sol"]);
  assert.deepEqual(addToGrid(grid, "codex", "gpt-6.2-sol").codex.models.length, 2);
  const e = changelogEntry({ date: "2026-11-18", title: "GPT-6.2 Sol", model: "gpt-6.2-sol", agent: "codex", cli: "OpenAI Codex", version: "0.170.0", run: "2026-11-18-1830" });
  assert.equal(e.anchor, "2026-11-18--gpt-62-sol-added");
  assert.match(e.text, /^## 2026-11-18 · GPT-6\.2 Sol added\n\n- Added automatically: OpenAI Codex 0\.170\.0 answered `gpt-6\.2-sol`/);
  const log = "# Changelog\n\nIntro.\n\n## 2026-11-17 · Old\n\n- x\n";
  assert.equal(prependEntry(log, "## New\n\n- y\n"), "# Changelog\n\nIntro.\n\n## New\n\n- y\n\n## 2026-11-17 · Old\n\n- x\n");
});
