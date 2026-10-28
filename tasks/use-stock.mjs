// docs/DATA.md: an item at qty 0 stays on the shelf (out of stock, not gone).
import { cases, changelogNoted, grade, jsdoc } from "../lib/grade.mjs";

const task = {
  id: "use-stock",
  prompt:
    "Add an exported `useItem(id, n = 1)` to src/items.js that takes `n` from the item's `qty` and returns the updated item. Using more than is left, or an unknown id, throws an Error.",
  budgetSec: 35,
  allowed: ["src/items.js", "src/store.js", "CHANGELOG.md"],
  forbidden: ["tests/"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `
      const out = {};
      try {
        const { useItem } = await import("./src/items.js");
        const { fetchItems } = await import("./src/store.js");
        const throws = async (f) => { try { await f(); return false; } catch (e) { return e instanceof Error; } };
        out.takes = (await useItem(3, 2))?.qty === 4 && (await fetchItems()).find((i) => i.id === 3).qty === 4;
        out.errors = (await throws(() => useItem(3, 5))) && (await throws(() => useItem(99)));
        out.zeroStays = (await useItem(2))?.qty === 0 && (await fetchItems()).some((i) => i.id === 2 && i.qty === 0);
      } catch {}
      console.log(JSON.stringify(out));`,
      ["takes", "errors", "zeroStays"],
    );
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    r.changelog = await changelogNoted(ctx);
    r.jsdoc = await jsdoc(ctx, "src/items.js", "useItem");
    return grade(r, { core: ["takes", "errors", "tests"], okWhy: "uses stock, keeps empty items, conventions kept" });
  },
};

export default task;
