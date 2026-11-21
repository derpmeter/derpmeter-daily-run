import assert from "node:assert/strict";
import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DIFF_CAP, loadDiff, storeDiff } from "../lib/diffs.mjs";

const long = `diff --git a/x b/x\n${"+line\n".repeat(DIFF_CAP / 5)}`;

test("a long Toonify diff is kept whole, compressed next to the result", async () => {
  const dir = await mkdtemp(join(tmpdir(), "lab-diffs-"));
  const file = join(dir, "toon-episode-copy.json");
  const raw = await storeDiff({ diff: long }, file, "toonify");
  assert.equal(raw.diff.length, DIFF_CAP);
  assert.equal(raw.diff_file, "toon-episode-copy.diff.gz");
  assert.deepEqual((await readdir(dir)).sort(), ["toon-episode-copy.diff.gz"]);
  assert.equal(await loadDiff(raw, file), long);
});

test("other fixtures are only cut; a cut diff without its file cannot be regraded", async () => {
  const dir = await mkdtemp(join(tmpdir(), "lab-diffs-"));
  const file = join(dir, "larder-sales.json");
  const raw = await storeDiff({ diff: long }, file, "larder");
  assert.equal(raw.diff.length, DIFF_CAP);
  assert.equal(raw.diff_file, undefined);
  assert.deepEqual(await readdir(dir), []);
  assert.equal(await loadDiff(raw, file), null);
});

test("a short diff stays inline", async () => {
  const dir = await mkdtemp(join(tmpdir(), "lab-diffs-"));
  const file = join(dir, "toon-image-fetch.json");
  const raw = await storeDiff({ diff: "small" }, file, "toonify");
  assert.equal(raw.diff, "small");
  assert.deepEqual(await readdir(dir), []);
  assert.equal(await loadDiff(raw, file), "small");
  assert.equal(await loadDiff({ diff: "" }, file), "");
});
