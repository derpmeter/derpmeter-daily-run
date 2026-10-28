// The report names one case; docs/DATA.md defines the order (FEFO, no expiry
// last, ties by received date then id). Sorting by received date fixes the
// reported case only.
import { LARDER_PRELUDE } from "../lib/larder.mjs";
import { cases, changelogNoted, grade } from "../lib/grade.mjs";

const task = {
  id: "larder-fefo",
  fixture: "larder",
  prompt:
    "Bug report: cooking bechamel today took the new milk (lot HD-1026) although lot HD-1022 expires tomorrow. Fix it and add a regression test.",
  budgetSec: 120,
  allowed: ["src/domain/batches.js", "src/domain/", "tests/", "CHANGELOG.md"],
  forbidden: ["data/"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `${LARDER_PRELUDE}
      const { consume } = await import("./src/domain/batches.js");
      const at = "2026-10-28T10:00:00Z";
      try {
        { const { handle, store } = mk();
          await handle({ method: "POST", path: "/recipes/2/cook", body: { portions: 1 } });
          out.reported = store.data.batches.find((b) => b.id === 4).qty === 1.8 && store.data.batches.find((b) => b.id === 3).qty === 8; }
        { const d = seed(); d.batches.push({ id: 10, itemId: 6, lot: "HD-1020", qty: 2, receivedOn: "2026-10-20", expires: "2026-12-01", location: "freezer" }); d.seq.batch = 10;
          const { store } = mk(d); out.fefo = consume(store, 6, 1, { at }).map((u) => u.batchId).join() === "10"; }
        { const d = seed(); d.batches.push({ id: 10, itemId: 4, lot: "GF-0901", qty: 5, receivedOn: "2026-09-01", expires: null, location: "dry" }); d.seq.batch = 10;
          const { store } = mk(d); out.noExpiryLast = consume(store, 4, 1, { at }).map((u) => u.batchId).join() === "6"; }
        { const d = seed(); d.batches.push({ id: 10, itemId: 5, lot: "GF-1020", qty: 1, receivedOn: "2026-10-20", expires: "2026-11-01", location: "fridge" }, { id: 11, itemId: 5, lot: "GF-1020B", qty: 1, receivedOn: "2026-10-20", expires: "2026-11-01", location: "fridge" }); d.seq.batch = 11;
          const { store } = mk(d); out.ties = consume(store, 5, 1.5, { at }).map((u) => u.batchId).join() === "10,11"; }
        { const { store } = mk(); const before = JSON.stringify(store.data);
          try { consume(store, 3, 9, { at }); } catch {}
          out.atomic = JSON.stringify(store.data) === before; }
      } catch (e) { out.crash = String(e).slice(0, 80); }
      console.log(JSON.stringify(out));`,
      ["reported", "fefo", "noExpiryLast", "ties", "atomic"],
    );
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    // The new test must fail on the committed code.
    const now = await ctx.read("src/domain/batches.js");
    await ctx.write("src/domain/batches.js", (await ctx.run("git", ["show", "HEAD:src/domain/batches.js"])).stdout);
    r.regressionTest = (await ctx.run("npm", ["test"])).code !== 0;
    await ctx.write("src/domain/batches.js", now);
    r.changelog = await changelogNoted(ctx, "larder");
    return grade(r, { core: ["reported", "tests"], okWhy: "FEFO by the data rules, with a regression test" });
  },
};

export default task;
