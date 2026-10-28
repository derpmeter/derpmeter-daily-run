import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bin = new URL("../bin/larder.mjs", import.meta.url).pathname;

test("larder migrate upgrades a file in place", () => {
  const dir = mkdtempSync(join(tmpdir(), "larder-"));
  const file = join(dir, "db.json");
  copyFileSync(new URL("../data/legacy-v1.json", import.meta.url), file);
  const out = execFileSync(process.execPath, [bin, "migrate", file], { encoding: "utf8" });
  assert.match(out, /schema 1 → 2/);
  assert.equal(JSON.parse(readFileSync(file, "utf8")).schemaVersion, 2);
});

test("larder value prints a total", () => {
  const out = execFileSync(process.execPath, [bin, "value", new URL("../data/seed.json", import.meta.url).pathname], { encoding: "utf8" });
  assert.match(out, /^total\t\t\d+\.\d\d$/m);
});
