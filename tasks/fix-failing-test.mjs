import { changelogNoted } from "../lib/grade.mjs";

const task = {
  id: "fix-failing-test",
  prompt:
    "`npm test` has one failing test. Fix the bug in the source code so every test passes.",
  budgetSec: 35,
  allowed: ["src/format.js", "CHANGELOG.md"],
  forbidden: ["tests/"],
  // The base project is green; this chore plants its bug.
  async setup(ctx) {
    const src = await ctx.read("src/format.js");
    await ctx.write("src/format.js", src.replace("return qty === 1 ? `${qty} ${word}` : `${qty} ${word}s`;", "return `${qty} ${word}s`;"));
  },
  async check(ctx) {
    const t = await ctx.run("npm", ["test"]);
    if (t.code !== 0) return { ok: false, why: "tests still fail" };
    // A user-visible fix: AGENTS.md asks for a bullet under ## Unreleased.
    return (await changelogNoted(ctx))
      ? { ok: true, why: "tests pass, fix noted" }
      : { ok: false, partial: true, why: "tests pass, but the fix is not in CHANGELOG ## Unreleased" };
  },
};

export default task;
