// The obvious next id (max + 1) reuses the removed item's id; docs/DATA.md
// says ids are never reused.
import { cases, changelogNoted, grade, jsdoc } from "../lib/grade.mjs";

const task = {
  id: "remove-item",
  prompt:
    "Add an exported `removeItem(id)` to src/items.js. It takes the item off the shelf and returns `true`, or returns `false` when there is no item with that id.",
  budgetSec: 35,
  allowed: ["src/items.js", "src/store.js", "CHANGELOG.md"],
  forbidden: ["tests/"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `
      const out = {};
      try {
        const { removeItem, addItem } = await import("./src/items.js");
        const { fetchItems } = await import("./src/store.js");
        out.removes = (await removeItem(4)) === true && !(await fetchItems()).some((i) => i.id === 4);
        out.missing = (await removeItem(99)) === false && (await fetchItems()).length === 3;
        const next = await addItem({ name: "flour", qty: 1, unit: "bag" });
        out.noReuse = next.id !== 4 && next.id > 4;
      } catch {}
      console.log(JSON.stringify(out));`,
      ["removes", "missing", "noReuse"],
    );
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    r.changelog = await changelogNoted(ctx);
    r.jsdoc = await jsdoc(ctx, "src/items.js", "removeItem");
    return grade(r, { core: ["removes", "missing", "tests"], okWhy: "removes, never reuses ids, conventions kept" });
  },
};

export default task;
