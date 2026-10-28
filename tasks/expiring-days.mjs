// A feature across two files: a helper, a query parameter, a kept default
// and input validation.
import { cases, grade } from "../lib/grade.mjs";

const task = {
  id: "expiring-days",
  prompt:
    "Add and export `isExpiringSoon(item, now, days = 3)` in src/expiry.js: true when the item has not expired and expires within `days` days (use `daysLeft`). Then make `GET /expiring` use it and accept `?days=N` (default 7, so the current behavior stays). `days` must be a whole number from 0 to 365; anything else answers status 400 with a JSON `error`. `handle(path, now)` receives the path with its query string.",
  budgetSec: 70,
  allowed: ["src/expiry.js", "src/server.js"],
  forbidden: ["tests/"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `
      const out = {};
      try {
        const { isExpiringSoon } = await import("./src/expiry.js");
        const now = Date.parse("2026-11-01T00:00:00Z");
        const at = (d) => ({ id: 9, expires: d });
        out.helper = isExpiringSoon(at("2026-11-03"), now) === true &&
          isExpiringSoon(at("2026-11-04"), now) === true &&
          isExpiringSoon(at("2026-11-06"), now) === false &&
          isExpiringSoon(at("2026-10-30"), now) === false &&
          isExpiringSoon(at("2026-11-06"), now, 7) === true;
      } catch {}
      try {
        const { handle } = await import("./src/server.js");
        const NOW = Date.parse("2026-10-30T00:00:00Z");
        const names = async (p) => { const b = (await handle(p, NOW)).body; return Array.isArray(b) ? b.map((i) => i.name).join(",") : "!"; };
        out.default = (await names("/expiring")) === "milk";
        out.days = (await names("/expiring?days=10")) === "milk,egg" && (await names("/expiring?days=1")) === "";
        const bad = async (q) => { const r = await handle("/expiring?days=" + q, NOW); return r.status === 400 && typeof r.body?.error === "string"; };
        out.validation = (await bad("abc")) && (await bad("-1")) && (await bad("2.5")) && (await bad("366"));
        out.edges = (await names("/expiring?days=0")) === "" && (await handle("/expiring?days=365", NOW)).status === 200;
      } catch {}
      console.log(JSON.stringify(out));`,
      ["helper", "default", "days", "validation", "edges"],
    );
    const t = await ctx.run("node", ["--test", "tests/server.test.js"]);
    r.serverTests = t.code === 0;
    const lint = await ctx.run("npm", ["run", "lint"]);
    r.lint = lint.code === 0;
    return grade(r, { core: ["helper", "default", "serverTests"], okWhy: "helper, ?days, default and validation all right" });
  },
};

export default task;
