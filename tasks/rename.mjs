// Two instructions at once: rename everywhere, and keep the old name working.
const task = {
  id: "rename",
  prompt:
    "Rename the function `fetchItems` to `loadItems` everywhere in the project, including the docs. Keep `fetchItems` working for one more release as a deprecated alias of `loadItems`.",
  budgetSec: 120,
  allowed: ["src/store.js", "src/items.js", "src/server.js", "tests/items.test.js", "README.md"],
  forbidden: [],
  async check(ctx) {
    const store = await ctx.read("src/store.js");
    if (!/export (async )?function loadItems|export const loadItems/.test(store))
      return { ok: false, why: "store does not export loadItems" };
    const alias = await ctx.node(`
      import * as s from "./src/store.js";
      const a = await s.loadItems(), b = await s.fetchItems?.();
      process.exit(Array.isArray(b) && JSON.stringify(a) === JSON.stringify(b) ? 0 : 1);`);
    if (alias.code !== 0) return { ok: false, why: "fetchItems alias missing or different" };
    const users = (await ctx.grep("fetchItems", ["src", "tests"])).filter((p) => p !== "src/store.js");
    if (users.length) return { ok: false, why: `fetchItems still used in ${users.join(", ")}` };
    if (!(await ctx.read("README.md")).includes("loadItems"))
      return { ok: false, why: "README not updated to loadItems" };
    const t = await ctx.run("node", ["--test", "tests/items.test.js", "tests/server.test.js"]);
    return t.code === 0
      ? { ok: true, why: "renamed, alias kept, docs updated" }
      : { ok: false, why: "tests broke after rename" };
  },
};

export default task;
