// A bug report, no failing test: fix it and prove it with a regression test.
const BUGGY = "return items.filter((item) => item.tags[0] === tag);";
const task = {
  id: "regression-fix",
  prompt:
    "Bug report: `findByTag` misses items that have the tag but not as their first tag. Fix it, and add a regression test to tests/items.test.js that fails on the old code.",
  budgetSec: 150,
  allowed: ["src/items.js", "tests/items.test.js"],
  forbidden: ["tests/format.test.js", "tests/server.test.js"],
  async setup(ctx) {
    const src = await ctx.read("src/items.js");
    await ctx.write("src/items.js", src.replace("return items.filter((item) => item.tags.includes(tag));", BUGGY));
  },
  async check(ctx) {
    const fixed = await ctx.node(`
      import { findByTag, addItem } from "./src/items.js";
      await addItem({ name: "beans", qty: 3, unit: "can", tags: ["dry", "fridge"] });
      const names = (await findByTag("fridge")).map((i) => i.name);
      process.exit(names.includes("beans") && names.includes("milk") ? 0 : 1);`);
    if (fixed.code !== 0) return { ok: false, why: "findByTag still misses later tags" };
    const now = await ctx.run("node", ["--test", "tests/items.test.js"]);
    if (now.code !== 0) return { ok: false, why: "items tests fail after the fix" };
    // The new test must catch the bug: run it against the committed buggy file.
    const src = await ctx.read("src/items.js");
    const buggy = (await ctx.run("git", ["show", "HEAD:src/items.js"])).stdout;
    await ctx.write("src/items.js", buggy);
    const old = await ctx.run("node", ["--test", "tests/items.test.js"]);
    await ctx.write("src/items.js", src);
    return old.code !== 0
      ? { ok: true, why: "fixed, and the new test catches the bug" }
      : { ok: false, why: "the regression test passes on the old code" };
  },
};

export default task;
