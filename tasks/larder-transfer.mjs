// A feature across the layers: route, domain, ledger, errors, docs.
import { LARDER_PRELUDE } from "../lib/larder.mjs";
import { cases, changelogNoted, grade, readmeRoute } from "../lib/grade.mjs";

const task = {
  id: "larder-transfer",
  fixture: "larder",
  prompt:
    "Add `POST /batches/:id/transfer` with the body `{ \"to\": <location id>, \"qty\": <number> }`. It moves `qty` of the batch to location `to`. Moving the whole batch changes its location; moving part of it splits it: a new batch of the same item, lot, expiry and received date holds the moved part at `to`.",
  budgetSec: 150,
  allowed: ["src/", "README.md", "docs/API.md", "docs/DATA.md", "CHANGELOG.md"],
  forbidden: ["tests/", "data/"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `${LARDER_PRELUDE}
      try {
        { const { store, handle } = mk();
          const r = await handle({ method: "POST", path: "/batches/6/transfer", body: { to: "fridge", qty: 12.5 } });
          const b = store.data.batches.find((b) => b.id === 6);
          out.whole = r.status >= 200 && r.status < 300 && b.location === "fridge" && b.qty === 12.5 && store.data.batches.length === 9; }
        { const { store, handle } = mk(); const m0 = store.data.movements.length;
          const r = await handle({ method: "POST", path: "/batches/2/transfer", body: { to: "fridge", qty: 2.5 } });
          const src = store.data.batches.find((b) => b.id === 2);
          const nb = store.data.batches.find((b) => b.id !== 2 && b.lot === "GF-1025");
          out.split = r.status >= 200 && r.status < 300 && src.qty === 3.5 && src.location === "dry" && !!nb && nb.qty === 2.5 && nb.location === "fridge" && nb.itemId === 1 && nb.expires === "2026-11-22" && nb.receivedOn === "2026-10-25";
          out.newId = nb?.id === 10 && store.data.seq.batch === 10;
          const ms = store.data.movements.slice(m0);
          out.ledger = ms.length === 2 && ms.some((m) => m.batchId === 2 && m.qty === 2.5) && ms.some((m) => m.batchId === nb?.id && m.qty === 2.5) && ms.every((m) => typeof m.type === "string" && typeof m.at === "string");
          out.onHand = store.data.batches.filter((b) => b.itemId === 1).reduce((s, b) => s + b.qty, 0) === 10; }
        { const { store, handle } = mk(); const before = JSON.stringify(store.data);
          const a = await handle({ method: "POST", path: "/batches/2/transfer", body: { to: "attic", qty: 1 } });
          const b = await handle({ method: "POST", path: "/batches/2/transfer", body: { to: "fridge", qty: 7 } });
          const c = await handle({ method: "POST", path: "/batches/2/transfer", body: { to: "fridge", qty: 0 } });
          const d = await handle({ method: "POST", path: "/batches/99/transfer", body: { to: "fridge", qty: 1 } });
          out.validation = a.status === 400 && a.body?.error?.code === "unknown_location" && b.status >= 400 && b.status < 500 && c.status === 400 && c.body?.error?.code === "invalid_qty" && d.status === 404 && d.body?.error?.code === "unknown_batch";
          out.unchanged = JSON.stringify(store.data) === before;
          out.messages = [a, b, c, d].every((x) => typeof x.body?.error?.message === "string" && x.body.error.message.length > 3 && x.body.error.message !== x.body.error.code); }
      } catch (e) { out.crash = String(e).slice(0, 80); }
      console.log(JSON.stringify(out));`,
      ["whole", "split", "newId", "ledger", "onHand", "validation", "unchanged", "messages"],
    );
    const domain = (await ctx.grep("transfer", ["src/domain"])).length > 0;
    r.layered = domain;
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    r.lint = (await ctx.run("npm", ["run", "lint"])).code === 0;
    r.readme = await readmeRoute(ctx, "/transfer");
    r.apiDoc = /transfer/.test(await ctx.read("docs/API.md").catch(() => ""));
    r.changelog = await changelogNoted(ctx, "larder");
    return grade(r, { core: ["whole", "split", "tests"], okWhy: "transfer works with ledger, validation, ids and docs" });
  },
};

export default task;
