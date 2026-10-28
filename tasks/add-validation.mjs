// Validation plus the storage rules in docs/DATA.md (normalized names and
// tags, qty 0 allowed).
import { cases, changelogNoted, grade } from "../lib/grade.mjs";

const task = {
  id: "add-validation",
  prompt: "Make `addItem` reject invalid items by throwing an Error, and store valid ones.",
  budgetSec: 40,
  allowed: ["src/items.js", "src/store.js", "CHANGELOG.md"],
  forbidden: ["tests/"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `
      const out = {};
      try {
        const { addItem } = await import("./src/items.js");
        const throws = async (item) => { try { await addItem(item); return false; } catch (e) { return e instanceof Error; } };
        out.rejects = (await throws({ name: "x", qty: -1 })) && (await throws({ name: "x", qty: 1.5 })) && (await throws({ name: "   ", qty: 1 })) && (await throws({ name: "x", qty: 1, expires: "next week" }));
        const ok = await addItem({ name: "  Black Beans ", qty: 3, unit: "can", tags: ["Dry", "canned", "dry"], expires: "2027-01-31" });
        out.accepts = typeof ok?.id === "number";
        out.name = ok?.name === "black beans";
        out.tags = JSON.stringify(ok?.tags) === JSON.stringify(["canned", "dry"]);
        out.zero = typeof (await addItem({ name: "salt", qty: 0 }))?.id === "number";
      } catch {}
      console.log(JSON.stringify(out));`,
      ["rejects", "accepts", "name", "tags", "zero"],
    );
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    r.changelog = await changelogNoted(ctx);
    return grade(r, { core: ["rejects", "accepts", "tests"], okWhy: "rejects bad items, stores good ones by the data rules" });
  },
};

export default task;
