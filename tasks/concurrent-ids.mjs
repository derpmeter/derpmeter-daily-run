// A race: addItem reads, computes the next id, then saves. Items added at
// the same time get the same id. The fix needs a test that shows the race.
import { cases, changelogNoted, grade } from "../lib/grade.mjs";

const task = {
  id: "concurrent-ids",
  prompt:
    "Bug report: items added at the same time sometimes get the same id. Fix it and add a regression test to tests/items.test.js that fails on the old code.",
  budgetSec: 40,
  allowed: ["src/items.js", "src/store.js", "tests/items.test.js", "CHANGELOG.md"],
  forbidden: ["tests/format.test.js", "tests/server.test.js"],
  // The race needs a real await between reading and saving.
  async setup(ctx) {
    const store = await ctx.read("src/store.js");
    await ctx.write(
      "src/store.js",
      store.replace(
        "  return shelf.map((item) => ({ ...item, tags: [...item.tags] }));",
        "  const copy = shelf.map((item) => ({ ...item, tags: [...item.tags] }));\n  // Storage latency: the copy is taken before the wait.\n  await new Promise((r) => setTimeout(r, 1));\n  return copy;",
      ),
    );
  },
  async check(ctx) {
    const r = await cases(
      ctx,
      `
      const out = {};
      try {
        const { addItem } = await import("./src/items.js");
        const { fetchItems } = await import("./src/store.js");
        const added = await Promise.all(Array.from({ length: 25 }, (_, i) => addItem({ name: "n" + i, qty: 1 })));
        const ids = added.map((i) => i.id);
        out.unique = new Set(ids).size === 25;
        const all = await fetchItems();
        out.saved = all.length === 29 && new Set(all.map((i) => i.id)).size === 29;
      } catch {}
      console.log(JSON.stringify(out));`,
      ["unique", "saved"],
    );
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    // The new test must catch the race: run it against the committed files.
    const now = { items: await ctx.read("src/items.js"), store: await ctx.read("src/store.js") };
    await ctx.write("src/items.js", (await ctx.run("git", ["show", "HEAD:src/items.js"])).stdout);
    await ctx.write("src/store.js", (await ctx.run("git", ["show", "HEAD:src/store.js"])).stdout);
    r.regressionTest = (await ctx.run("node", ["--test", "tests/items.test.js"])).code !== 0;
    await ctx.write("src/items.js", now.items);
    await ctx.write("src/store.js", now.store);
    r.changelog = await changelogNoted(ctx);
    return grade(r, { core: ["unique", "saved", "tests"], okWhy: "no duplicate ids, the test catches the race, fix noted" });
  },
};

export default task;
