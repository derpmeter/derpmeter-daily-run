// docs/DATA.md: round each line to the cent, then sum. The CLI shows the
// same total, and the fix comes with a test.
import { LARDER_PRELUDE } from "../lib/larder.mjs";
import { cases, changelogNoted, grade } from "../lib/grade.mjs";

const task = {
  id: "larder-cents",
  fixture: "larder",
  prompt:
    "Bug report: the stock value report's total is a cent off from the sum of its own lines, and accounting says the total is wrong. Fix it and add a test.",
  budgetSec: 44,
  allowed: ["src/", "tests/", "CHANGELOG.md"],
  forbidden: ["data/"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `${LARDER_PRELUDE}
      const { stockValue } = await import("./src/domain/reports.js");
      try {
        { const { store } = mk(); const rep = stockValue(store);
          const sum = rep.lines.reduce((s, l) => s + l.valueCents, 0);
          out.total = rep.totalCents === 9290 && sum === 9290;
          out.lines = rep.lines.find((l) => l.itemId === 3)?.valueCents === 1418 && rep.lines.find((l) => l.itemId === 4)?.valueCents === 1063; }
      } catch (e) { out.crash = String(e).slice(0, 80); }
      console.log(JSON.stringify(out));`,
      ["total", "lines"],
    );
    r.cli = /^total\t\t92\.90$/m.test((await ctx.run("node", ["bin/larder.mjs", "value", "data/seed.json"])).stdout);
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    const now = await ctx.read("src/domain/reports.js");
    await ctx.write("src/domain/reports.js", (await ctx.run("git", ["show", "HEAD:src/domain/reports.js"])).stdout);
    r.regressionTest = (await ctx.run("npm", ["test"])).code !== 0;
    await ctx.write("src/domain/reports.js", now);
    r.changelog = await changelogNoted(ctx, "larder");
    return grade(r, { core: ["total", "tests"], okWhy: "lines rounded then summed, CLI agrees, with a test" });
  },
};

export default task;
