// A cross-cutting change: a new dimension (site) through storage, every
// stock read, cooking, alerts, reports, stock-takes, docs and tests.
import { LARDER_PRELUDE } from "../lib/larder.mjs";
import { cases, changelogNoted, grade } from "../lib/grade.mjs";

const task = {
  id: "larder-sites",
  fixture: "larder",
  prompt: [
    "Larder now serves two kitchens. Add sites as schema 3:",
    "- Every location belongs to a site (`site` on each location) and the data has a `sites` list. Existing locations belong to site `main`. Add a second site `annex` (\"Annex kitchen\") with one location `annex-fridge` (\"Annex fridge\", 4 °C) to data/seed.json.",
    "- A request names its site in the `X-Larder-Site` header; without it the site is `main`. An unknown site is a 400 error with its own error code.",
    "- Batches, stock on hand, cooking, alerts, the stock value report and stock-takes only see the request's site. Items, suppliers, recipes and dishes are shared.",
    "Older data files must still open. Update the tests that assume the old schema.",
  ].join("\n"),
  budgetSec: 152,
  allowed: ["src/", "tests/", "data/", "bin/", "docs/", "README.md", "CHANGELOG.md"],
  forbidden: [],
  async check(ctx) {
    await ctx.write(".lab-seed-v2.json", (await ctx.run("git", ["show", "HEAD:data/seed.json"])).stdout);
    const r = await cases(
      ctx,
      `${LARDER_PRELUDE}
      const { migrate } = await import("./src/db/migrations.js");
      const old = () => JSON.parse(readFileSync(".lab-seed-v2.json", "utf8"));
      const H = (site) => (site ? { "x-larder-site": site } : {});
      const withAnnexMilk = () => {
        const d = seed();
        const loc = d.locations.find((l) => l.id === "annex-fridge") ? "annex-fridge" : null;
        if (loc) { d.batches.push({ id: 50, itemId: 2, lot: "AX-1", qty: 5, receivedOn: "2026-10-27", expires: "2026-10-30", location: loc }); d.seq.batch = Math.max(d.seq.batch, 50); }
        return d;
      };
      try {
        const m = migrate(old());
        out.migrate = m.locations.every((l) => l.site === "main") && Array.isArray(m.sites) && m.sites.some((s) => s.id === "main") && m.batches.length === 9;
        const legacy = migrate(JSON.parse(readFileSync("data/legacy-v1.json", "utf8")));
        out.chain = legacy.locations.every((l) => l.site === "main") && legacy.batches.length === 1;
        const s = seed();
        out.seeded = s.sites?.some((x) => x.id === "annex") && s.locations.some((l) => l.id === "annex-fridge" && l.site === "annex");
        const { handle } = mk(withAnnexMilk());
        const onHand = async (site, id) => (await handle({ path: "/items", headers: H(site) })).body.find((i) => i.id === id)?.onHand;
        out.defaultMain = (await onHand(null, 1)) === 10 && (await onHand("main", 2)) === 10;
        out.scopedStock = (await onHand("annex", 2)) === 5 && (await onHand("annex", 1)) === 0;
        const batches = (await handle({ path: "/batches", headers: H("annex") })).body;
        out.scopedBatches = Array.isArray(batches) && batches.length === 1 && batches[0].lot === "AX-1";
        { const { handle: h2, store } = mk(withAnnexMilk());
          const a = await h2({ method: "POST", path: "/recipes/2/cook", body: { portions: 1 }, headers: H("annex") });
          const b = await h2({ method: "POST", path: "/recipes/2/cook", body: { portions: 1 }, headers: H("main") });
          out.scopedCooking = a.status === 409 && b.status === 200 && store.data.batches.find((x) => x.lot === "AX-1").qty === 5; }
        const alerts = (await handle({ path: "/alerts", headers: H("annex") })).body;
        out.scopedAlerts = alerts.expiring?.length === 1 && alerts.expiring[0].lot === "AX-1" && alerts.lowStock?.some((l) => l.itemId === 1 && l.qty === 0);
        const value = (await handle({ path: "/reports/stock-value", headers: H("annex") })).body;
        out.scopedValue = value.totalCents === 645;
        const st = await handle({ method: "POST", path: "/stocktakes", body: { location: "annex-fridge" }, headers: H("main") });
        out.scopedStocktake = st.status === 400;
        const bad = await handle({ path: "/items", headers: H("moon") });
        out.unknownSite = bad.status === 400 && typeof bad.body?.error?.code === "string" && bad.body.error.code !== "bad_request" && bad.body.error.message !== bad.body.error.code;
      } catch (e) { out.crash = String(e).slice(0, 120); }
      console.log(JSON.stringify(out));`,
      ["migrate", "chain", "seeded", "defaultMain", "scopedStock", "scopedBatches", "scopedCooking", "scopedAlerts", "scopedValue", "scopedStocktake", "unknownSite"],
    );
    await ctx.write("tmp-legacy.json", await ctx.read("data/legacy-v1.json"));
    r.cli = /schema 1 → 3/.test((await ctx.run("node", ["bin/larder.mjs", "migrate", "tmp-legacy.json"])).stdout);
    r.dataDoc = /site/i.test(await ctx.read("docs/DATA.md").catch(() => ""));
    r.apiDoc = /x-larder-site/i.test(await ctx.read("docs/API.md").catch(() => ""));
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    r.lint = (await ctx.run("npm", ["run", "lint"])).code === 0;
    r.changelog = await changelogNoted(ctx, "larder");
    return grade(r, { core: ["migrate", "defaultMain", "scopedStock", "tests"], okWhy: "sites through storage, stock, cooking, alerts, reports, stock-takes and docs" });
  },
};

export default task;
