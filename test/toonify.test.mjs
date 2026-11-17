// Toonify chores: each check fails untouched on the request and its
// follow-ups, and passes a reference solution of all turns (test/toonify/<chore>,
// copied over the fixture). Reference solutions add no tests or changelog,
// so they come out partly done on exactly those extra cases.
import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkContext, exec } from "../lib/system.mjs";
import { depsReady, samePlaceholders } from "../lib/toonify.mjs";

const FIXTURE = new URL("../fixtures/toonify", import.meta.url).pathname;
const REFS = new URL("./toonify", import.meta.url).pathname;
const done = { status: "done", answer: "ok", changed: [] };
const skip = depsReady() ? false : "Toonify dependencies missing (sh bin/toonify-deps.sh)";

async function check(id, ref = false) {
  const task = (await import(`../tasks/${id}.mjs`)).default;
  const dir = await mkdtemp(join(tmpdir(), "toonify-test-"));
  try {
    await cp(FIXTURE, dir, { recursive: true });
    await task.setup(checkContext(dir, null));
    const git = (...a) => exec("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: dir });
    await git("init", "-q");
    await git("add", "-A");
    await git("commit", "-qm", "fixture");
    if (ref) await cp(join(REFS, id), dir, { recursive: true });
    return await task.check(checkContext(dir, done));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const UNTOUCHED = {
  "toon-episode-copy": "failed: created, listed, cuts, independent, again, order, restore, restoreLive, ui, undo",
  "toon-failed-charges": "failed: reported, background, sync, history, ui",
  "toon-image-fetch": "failed: reported, webtoonSafe, modify, style, previous, missingZip, missingWebtoon, ui",
};
const REFERENCE = {
  "toon-episode-copy": "missed tests, changelog",
  "toon-failed-charges": "missed tests, historyTests, changelog",
  "toon-image-fetch": "missed tests, missingTests, changelog",
};

for (const id of Object.keys(UNTOUCHED))
  test(`${id}: fails untouched, passes a reference of every turn`, { skip, timeout: 600_000 }, async () => {
    const before = await check(id);
    assert.deepEqual([before.ok, before.why], [false, UNTOUCHED[id]]);
    const after = await check(id, true);
    assert.deepEqual([after.ok, after.partial, after.why], [false, true, REFERENCE[id]]);
  });

test("placeholders: values shown must match; plural selectors may differ", () => {
  const same = (en, ko) => samePlaceholders({ en: new Map([["a", en]]), ko: new Map([["a", ko]]) });
  assert.equal(same("{count, plural, one {Scene {cuts} left} other {Scenes: {cuts}.}}", "장면: {cuts}"), true);
  assert.equal(same("{count, plural, one {# cut} other {# cuts}}", "{count}컷"), true);
  assert.equal(same("{n, number} items", "{n}개"), true);
  assert.equal(same("Hi {name}", "안녕"), false);
  assert.equal(same("{cuts}", "{cut}"), false);
  assert.equal(same("{count, plural, one {# cut} other {# cuts}}", "컷"), false);
});
