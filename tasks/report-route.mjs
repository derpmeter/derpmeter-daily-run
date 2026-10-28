// A feature with many small rules; each is easy, all of them is the job.
import { cases, changelogNoted, grade, jsdoc, readmeRoute } from "../lib/grade.mjs";

const task = {
  id: "report-route",
  prompt: [
    "Add `GET /report`, built by an exported `buildReport(items, now)` in a new src/report.js. The body is an object:",
    "- `generatedAt`: `now` as an ISO 8601 string.",
    "- `total`: the number of items that have not expired; `units`: the sum of their `qty`.",
    "- `byTag`: for items that have not expired, tag → number of items, with the keys in alphabetical order.",
    "- `expiringSoon`: names of items that have not expired and have at most 3 days left, sorted by expiry date, then by name.",
    "- `expired`: names of expired items, sorted by name.",
    "Use `daysLeft` and `isExpired` from src/expiry.js.",
  ].join("\n"),
  budgetSec: 45,
  allowed: ["src/report.js", "src/server.js", "README.md", "CHANGELOG.md"],
  forbidden: ["tests/"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `
      const out = {};
      try {
        const { buildReport } = await import("./src/report.js");
        const { handle } = await import("./src/server.js");
        const now = Date.parse("2026-10-30T09:00:00Z");
        const items = [
          { id: 1, name: "rice", qty: 2, tags: ["dry"], expires: "2027-03-01" },
          { id: 2, name: "milk", qty: 1, tags: ["fridge"], expires: "2026-11-02" },
          { id: 3, name: "egg", qty: 6, tags: ["fridge", "protein"], expires: "2026-11-01" },
          { id: 4, name: "yogurt", qty: 4, tags: ["fridge"], expires: "2026-10-20" },
          { id: 5, name: "bread", qty: 1, tags: ["bakery"], expires: "2026-11-01" },
          { id: 6, name: "apple", qty: 3, tags: [], expires: "2026-10-01" },
        ];
        const rep = buildReport(items, now);
        out.generatedAt = rep.generatedAt === "2026-10-30T09:00:00.000Z";
        out.total = rep.total === 4 && rep.units === 10;
        out.byTag = JSON.stringify(rep.byTag) === JSON.stringify({ bakery: 1, dry: 1, fridge: 2, protein: 1 });
        out.expiringSoon = JSON.stringify(rep.expiringSoon) === JSON.stringify(["bread", "egg", "milk"]);
        out.expired = JSON.stringify(rep.expired) === JSON.stringify(["apple", "yogurt"]);
        const res = await handle("/report", now);
        out.route = res.status === 200 && typeof res.body?.total === "number" && Array.isArray(res.body?.expired);
      } catch {}
      console.log(JSON.stringify(out));`,
      ["generatedAt", "total", "byTag", "expiringSoon", "expired", "route"],
    );
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    r.readme = await readmeRoute(ctx, "/report");
    r.changelog = await changelogNoted(ctx);
    r.jsdoc = await jsdoc(ctx, "src/report.js", "buildReport");
    return grade(r, { core: ["route", "total", "tests"], okWhy: "every report rule right, conventions kept" });
  },
};

export default task;
