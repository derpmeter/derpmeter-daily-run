const task = {
  id: "fix-failing-test",
  prompt:
    "`npm test` has one failing test. Fix the bug in the source code so every test passes.",
  budgetSec: 35,
  allowed: ["src/format.js"],
  forbidden: ["tests/"],
  // The base project is green; this chore plants its bug.
  async setup(ctx) {
    const src = await ctx.read("src/format.js");
    await ctx.write("src/format.js", src.replace("return qty === 1 ? `${qty} ${word}` : `${qty} ${word}s`;", "return `${qty} ${word}s`;"));
  },
  async check(ctx) {
    const t = await ctx.run("npm", ["test"]);
    return t.code === 0
      ? { ok: true, why: "tests pass" }
      : { ok: false, why: "tests still fail" };
  },
};

export default task;
