// A feature across two files with a default that must not change.
const task = {
  id: "expiring-days",
  prompt:
    "Add and export `isExpiringSoon(item, now, days = 3)` in src/expiry.js: true when the item has not expired and expires within `days` days (use `daysLeft`). Then make `GET /expiring` use it and accept `?days=N` (default 7, so the current behavior stays). `handle(path, now)` receives the path with its query string.",
  budgetSec: 150,
  allowed: ["src/expiry.js", "src/server.js"],
  forbidden: ["tests/"],
  async check(ctx) {
    const r = await ctx.node(`
      import { isExpiringSoon } from "./src/expiry.js";
      import { handle } from "./src/server.js";
      const now = Date.parse("2026-11-01T00:00:00Z");
      const at = (d) => ({ id: 9, expires: d });
      const unit = isExpiringSoon(at("2026-11-03"), now) === true &&
        isExpiringSoon(at("2026-11-04"), now) === true &&
        isExpiringSoon(at("2026-11-06"), now) === false &&
        isExpiringSoon(at("2026-10-30"), now) === false &&
        isExpiringSoon(at("2026-11-06"), now, 7) === true;
      if (!unit) process.exit(2);
      const NOW = Date.parse("2026-10-30T00:00:00Z");
      const names = async (p) => { const b = (await handle(p, NOW)).body; return Array.isArray(b) ? b.map((i) => i.name).join(",") : "!"; };
      const ok = (await names("/expiring")) === "milk" &&
        (await names("/expiring?days=10")) === "milk,egg" &&
        (await names("/expiring?days=1")) === "";
      process.exit(ok ? 0 : 3);`);
    if (r.code === 2) return { ok: false, why: "isExpiringSoon missing or wrong" };
    if (r.code === 3) return { ok: false, why: "GET /expiring ignores ?days or changed its default" };
    if (r.code !== 0) return { ok: false, why: "isExpiringSoon or /expiring fails" };
    const t = await ctx.run("node", ["--test", "tests/server.test.js"]);
    if (t.code !== 0) return { ok: false, why: "existing server tests broke" };
    const lint = await ctx.run("npm", ["run", "lint"]);
    const problems = lint.stdout.split("\n").filter((l) => /^src\//.test(l));
    return problems.length > 0
      ? { ok: false, why: "new lint problems" }
      : { ok: true, why: "works for the hidden cases, default kept" };
  },
};

export default task;
