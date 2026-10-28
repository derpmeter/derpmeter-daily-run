// Two instructions at once: rename everywhere, and keep the old name working.
const task = {
  id: "rename",
  prompt:
    "Rename the function `fetchItems` to `loadItems` everywhere in the project, including the docs. Keep `fetchItems` working for one more release as a deprecated alias of `loadItems`.",
  budgetSec: 75,
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
    // Tests may keep using the deprecated alias (AGENTS.md: tests are not
    // edited unless asked); source code must not.
    const users = (await ctx.grep("fetchItems", ["src"])).filter((p) => p !== "src/store.js");
    if (users.length) return { ok: false, why: `fetchItems still used in ${users.join(", ")}` };
    const t = await ctx.run("node", ["--test", "tests/items.test.js", "tests/server.test.js"]);
    if (t.code !== 0) return { ok: false, why: "tests broke after rename" };
    // Renamed and working; the second instruction and the docs are the rest.
    const missed = [];
    if (alias.code !== 0) missed.push("fetchItems alias");
    if (!(await ctx.read("README.md")).includes("loadItems")) missed.push("README");
    return missed.length
      ? { ok: false, partial: true, why: `renamed, but missed ${missed.join(" and ")}` }
      : { ok: true, why: "renamed, alias kept, docs updated" };
  },
};

export default task;
