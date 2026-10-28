// A schema change done the way docs/ARCHITECTURE.md asks: version, migration
// chain, seed, docs, CLI, and the tests that assume the old version.
import { LARDER_PRELUDE } from "../lib/larder.mjs";
import { cases, changelogNoted, grade } from "../lib/grade.mjs";

const task = {
  id: "larder-schema3",
  fixture: "larder",
  prompt:
    "Batches need their own cost. Add `costCents` (integer cents per unit) to every batch as schema 3: batches from a received order take the order line's `priceCents`; batches that already exist take their item's current `priceCents`. The stock value report must use the batch costs. Update the tests that assume schema 2.",
  budgetSec: 180,
  allowed: ["src/", "tests/", "data/", "bin/", "docs/", "README.md", "CHANGELOG.md"],
  forbidden: [],
  async check(ctx) {
    const v2 = (await ctx.run("git", ["show", "HEAD:data/seed.json"])).stdout;
    await ctx.write(".lab-seed-v2.json", v2);
    const r = await cases(
      ctx,
      `${LARDER_PRELUDE}
      const { CURRENT_VERSION, migrate } = await import("./src/db/migrations.js");
      const { stockValue } = await import("./src/domain/reports.js");
      const { receiveOrder } = await import("./src/domain/orders.js");
      try {
        out.version = CURRENT_VERSION === 3;
        const old = JSON.parse(readFileSync(".lab-seed-v2.json", "utf8"));
        const m = migrate(old);
        const price = Object.fromEntries(old.items.map((i) => [i.id, i.priceCents]));
        out.migrates = m.schemaVersion === 3 && m.batches.length === 9 && m.batches.every((b) => b.costCents === price[b.itemId] && b.qty === old.batches.find((o) => o.id === b.id).qty);
        const legacy = migrate(JSON.parse(readFileSync("data/legacy-v1.json", "utf8")));
        out.chain = legacy.schemaVersion === 3 && legacy.batches.length === 1 && legacy.batches[0].costCents === 175;
        const s = memoryStore(old);
        const made = receiveOrder(s, 2, [{ lot: "HD-1030", expires: "2026-11-06", location: "fridge" }, { lot: "HD-1030B", expires: "2026-12-30", location: "fridge" }], { at: "2026-10-30T07:00:00Z" });
        out.receive = made.map((b) => b.costCents).join() === "129,945";
        const s2 = memoryStore(old);
        s2.data.batches.find((b) => b.id === 5).costCents = 1000;
        const total = stockValue(s2).totalCents;
        out.value = total === 9372 || total === 9371;
        const cur = JSON.parse(readFileSync("data/seed.json", "utf8"));
        out.seed = cur.schemaVersion === 3 && cur.batches.every((b) => Number.isInteger(b.costCents));
      } catch (e) { out.crash = String(e).slice(0, 80); }
      console.log(JSON.stringify(out));`,
      ["version", "migrates", "chain", "receive", "value", "seed"],
    );
    await ctx.write("tmp-legacy.json", await ctx.read("data/legacy-v1.json"));
    r.cli = /schema 1 → 3/.test((await ctx.run("node", ["bin/larder.mjs", "migrate", "tmp-legacy.json"])).stdout);
    r.dataDoc = /costCents/.test(await ctx.read("docs/DATA.md").catch(() => ""));
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    r.lint = (await ctx.run("npm", ["run", "lint"])).code === 0;
    r.changelog = await changelogNoted(ctx, "larder");
    return grade(r, { core: ["version", "migrates", "tests"], okWhy: "schema 3 with migration chain, seed, CLI, docs and value" });
  },
};

export default task;
