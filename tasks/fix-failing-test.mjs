const task = {
  id: "fix-failing-test",
  prompt:
    "`npm test` has one failing test. Fix the bug in the source code so every test passes.",
  budgetSec: 90,
  allowed: ["src/format.js"],
  forbidden: ["tests/"],
  async check(ctx) {
    const t = await ctx.run("npm", ["test"]);
    return t.code === 0
      ? { ok: true, why: "tests pass" }
      : { ok: false, why: "tests still fail" };
  },
};

export default task;
