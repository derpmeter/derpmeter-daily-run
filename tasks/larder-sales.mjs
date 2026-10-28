// Importing till sales: consumption per dish, idempotent per ticket, all or
// nothing per file, and a variance report against the ledger. Sale stock may
// be booked at the sale time or the import time (the spec leaves it open), so
// the variance check accepts both.
import { LARDER_PRELUDE } from "../lib/larder.mjs";
import { cases, changelogNoted, grade, readmeRoute } from "../lib/grade.mjs";

const task = {
  id: "larder-sales",
  fixture: "larder",
  prompt: [
    "Import sales from the till and report variance.",
    "- `POST /import/sales` takes `{ \"csv\": \"...\" }` with the columns `ticket,soldAt,dishId,qty` (`soldAt` is an ISO instant). Each dish sold uses one portion of its recipe per `qty`: consume the ingredients, with the ledger `ref` `sale:<ticket>`. Answer `{ \"tickets\": <count>, \"dishes\": <count> }` for what was imported.",
    "- A ticket that was already imported is skipped, so importing the same file twice uses stock once.",
    "- If any row is invalid or an item runs out, nothing from that file is imported and the error message names the row (`row 2` is the first data row).",
    "- `GET /reports/variance?from=YYYY-MM-DD&to=YYYY-MM-DD` lists, per item, the theoretical use from sales sold in those days (inclusive) and the actual use (every `consume` movement in those days), with the difference, for items where either is above zero.",
  ].join("\n"),
  budgetSec: 240,
  allowed: ["src/", "tests/", "docs/", "README.md", "CHANGELOG.md"],
  forbidden: ["data/"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `${LARDER_PRELUDE}
      const csv = (rows) => "ticket,soldAt,dishId,qty\\n" + rows.join("\\n") + "\\n";
      const used = (store, itemId) => Math.round(store.data.movements.filter((m) => m.type === "consume" && store.data.batches.find((b) => b.id === m.batchId)?.itemId === itemId).reduce((s, m) => s + m.qty, 0) * 1000) / 1000;
      try {
        { const { handle, store } = mk(); const u0 = used(store, 1);
          const a = await handle({ method: "POST", path: "/import/sales", body: { csv: csv(["T1,2026-10-28T12:00:00Z,1,2", "T2,2026-10-28T12:30:00Z,2,1"]) } });
          out.imports = a.status === 200 && a.body?.tickets === 2 && a.body?.dishes === 3 && Math.round((used(store, 1) - u0) * 1000) / 1000 === 0.6;
          out.ref = store.data.movements.some((m) => m.ref === "sale:T1") && store.data.movements.some((m) => m.ref === "sale:T2");
          const n = store.data.movements.length;
          const again = await handle({ method: "POST", path: "/import/sales", body: { csv: csv(["T1,2026-10-28T12:00:00Z,1,2", "T2,2026-10-28T12:30:00Z,2,1"]) } });
          out.idempotent = again.status === 200 && store.data.movements.length === n && again.body?.tickets === 0;
          const mixed = await handle({ method: "POST", path: "/import/sales", body: { csv: csv(["T2,2026-10-28T12:30:00Z,2,1", "T3,2026-10-28T13:00:00Z,1,1"]) } });
          out.overlap = mixed.status === 200 && mixed.body?.tickets === 1 && Math.round((used(store, 1) - u0) * 1000) / 1000 === 0.9; }
        { const { handle, store } = mk(); const before = JSON.stringify(store.data.movements);
          const bad = await handle({ method: "POST", path: "/import/sales", body: { csv: csv(["T1,2026-10-28T12:00:00Z,1,1", "T2,2026-10-28T12:30:00Z,99,1"]) } });
          out.atomicInvalid = bad.status >= 400 && bad.status < 500 && /row 3/.test(bad.body?.error?.message ?? "") && JSON.stringify(store.data.movements) === before;
          const short = await handle({ method: "POST", path: "/import/sales", body: { csv: csv(["T1,2026-10-28T12:00:00Z,1,1", "T2,2026-10-28T12:30:00Z,2,60"]) } });
          out.atomicStock = short.status >= 400 && short.status < 500 && /row 3/.test(short.body?.error?.message ?? "") && JSON.stringify(store.data.movements) === before;
          const junk = await handle({ method: "POST", path: "/import/sales", body: { csv: csv(["T1,yesterday,1,1"]) } });
          out.validation = junk.status === 400 && /row 2/.test(junk.body?.error?.message ?? "") && (await handle({ method: "POST", path: "/import/sales", body: { csv: csv(["T1,2026-10-28T12:00:00Z,1,0"]) } })).status === 400; }
        { const { handle } = mk();
          await handle({ method: "POST", path: "/import/sales", body: { csv: csv(["T1,2026-10-27T12:00:00Z,1,4", "T9,2026-10-29T12:00:00Z,1,4"]) } });
          await handle({ method: "POST", path: "/recipes/1/cook", body: { portions: 4 } });
          const v = await handle({ path: "/reports/variance?from=2026-10-27&to=2026-10-28" });
          const onion = Array.isArray(v.body) ? v.body.find((x) => x.itemId === 1) : null;
          out.variance = v.status === 200 && !!onion && onion.theoretical === 1.2 && (onion.actual === 2.4 || onion.actual === 3.6) && Math.abs(onion.diff) === Math.round((onion.actual - 1.2) * 1000) / 1000;
          out.varianceItems = Array.isArray(v.body) && !v.body.some((x) => x.itemId === 4) && v.body.some((x) => x.itemId === 6);
          const badRange = await handle({ path: "/reports/variance?from=27-10-2026&to=2026-10-28" });
          out.varianceDates = badRange.status === 400; }
      } catch (e) { out.crash = String(e).slice(0, 120); }
      console.log(JSON.stringify(out));`,
      ["imports", "ref", "idempotent", "overlap", "atomicInvalid", "atomicStock", "validation", "variance", "varianceItems", "varianceDates"],
    );
    r.readme = (await readmeRoute(ctx, "/import/sales")) && (await readmeRoute(ctx, "/reports/variance"));
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    r.lint = (await ctx.run("npm", ["run", "lint"])).code === 0;
    r.changelog = await changelogNoted(ctx, "larder");
    return grade(r, { core: ["imports", "idempotent", "tests"], okWhy: "sales import idempotent and atomic, variance right, docs kept" });
  },
};

export default task;
