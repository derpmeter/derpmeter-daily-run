// The symptom is in the query; the cause is that tags are compared as typed,
// so fixing only the query leaves items added with capitals unfindable.
import { cases, changelogNoted, grade } from "../lib/grade.mjs";

const task = {
  id: "tag-case",
  prompt:
    "Bug report: `findByTag(\"Fridge\")` returns nothing although milk is in the fridge. Tags should match regardless of letter case.",
  budgetSec: 30,
  allowed: ["src/items.js", "src/store.js", "CHANGELOG.md", "tests/items.test.js"],
  forbidden: ["tests/format.test.js", "tests/server.test.js"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `
      const out = {};
      try {
        const { findByTag, addItem } = await import("./src/items.js");
        const names = async (t) => (await findByTag(t)).map((i) => i.name);
        out.query = (await names("Fridge")).includes("milk") && (await names("FRIDGE")).length === 3;
        await addItem({ name: "kimchi", qty: 1, unit: "jar", tags: ["Fridge", "Fermented"] });
        out.stored = (await names("fridge")).includes("kimchi") && (await names("fermented")).includes("kimchi");
        out.exact = (await names("fridge")).length === 4 && (await names("dry")).join() === "rice";
      } catch {}
      console.log(JSON.stringify(out));`,
      ["query", "stored", "exact"],
    );
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    r.changelog = await changelogNoted(ctx);
    return grade(r, { core: ["query", "tests"], okWhy: "tags match in any case, also for new items; fix noted" });
  },
};

export default task;
