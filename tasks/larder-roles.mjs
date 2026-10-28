// Authentication and roles on every route, with an audit log; the existing
// tests must be updated to send a key.
import { LARDER_PRELUDE } from "../lib/larder.mjs";
import { cases, changelogNoted, grade } from "../lib/grade.mjs";

const task = {
  id: "larder-roles",
  fixture: "larder",
  prompt: [
    "Protect the API with keys and roles.",
    "- Requests carry `Authorization: Bearer <key>`. Keys live in the data as `apiKeys: [{ \"key\", \"name\", \"role\" }]`; add one key per role to data/seed.json.",
    "- Roles: `viewer` may only read (GET). `cook` may also cook recipes, record waste, log temperatures and enter stock-take counts. `manager` may do everything.",
    "- A request without a key or with an unknown key is 401; a known key without permission is 403. Both answer in the usual error shape with their own error codes.",
    "- Every request that changes data writes an audit entry (time, key name, method, path, status). `GET /audit` lists them newest first and is for managers only.",
    "Update the existing tests so they send a key.",
  ].join("\n"),
  budgetSec: 108,
  allowed: ["src/", "tests/", "data/", "docs/", "README.md", "CHANGELOG.md"],
  forbidden: [],
  async check(ctx) {
    const r = await cases(
      ctx,
      `${LARDER_PRELUDE}
      try {
        const keys = seed().apiKeys ?? [];
        const key = (role) => keys.find((k) => k.role === role)?.key;
        out.seeded = ["viewer", "cook", "manager"].every((role) => typeof key(role) === "string" && key(role).length >= 8);
        const auth = (role) => (key(role) ? { authorization: "Bearer " + key(role) } : {});
        const { handle, store } = mk();
        const none = await handle({ path: "/items" });
        const wrong = await handle({ path: "/items", headers: { authorization: "Bearer nope-nope-nope" } });
        out.unauthenticated = none.status === 401 && wrong.status === 401 && typeof none.body?.error?.code === "string" && none.body.error.message !== none.body.error.code;
        out.viewer = (await handle({ path: "/items", headers: auth("viewer") })).status === 200 && (await handle({ method: "POST", path: "/recipes/1/cook", body: { portions: 1 }, headers: auth("viewer") })).status === 403;
        const f = await handle({ method: "POST", path: "/recipes/1/cook", body: { portions: 1 }, headers: auth("viewer") });
        out.forbiddenShape = typeof f.body?.error?.code === "string" && f.body.error.code !== none.body?.error?.code && f.body.error.message !== f.body.error.code;
        const cookOk = await handle({ method: "POST", path: "/recipes/1/cook", body: { portions: 1 }, headers: auth("cook") });
        const cookTemp = await handle({ method: "POST", path: "/temperatures", body: { location: "fridge", celsius: 3 }, headers: auth("cook") });
        const cookWaste = await handle({ method: "POST", path: "/batches/6/waste", body: { qty: 0.5 }, headers: auth("cook") });
        const cookOrder = await handle({ method: "POST", path: "/orders", body: { supplierId: 1, lines: [{ itemId: 4, qty: 5 }] }, headers: auth("cook") });
        const cookTake = await handle({ method: "POST", path: "/stocktakes", body: { location: "dry" }, headers: auth("cook") });
        out.cook = cookOk.status === 200 && cookTemp.status === 201 && cookWaste.status === 201 && cookOrder.status === 403 && cookTake.status === 403;
        const take = await handle({ method: "POST", path: "/stocktakes", body: { location: "dry" }, headers: auth("manager") });
        const count = await handle({ method: "POST", path: "/stocktakes/" + take.body?.id + "/counts", body: { batchId: 6, counted: 12 }, headers: auth("cook") });
        out.cookCounts = take.status === 201 && count.status === 200;
        out.manager = (await handle({ method: "POST", path: "/orders", body: { supplierId: 1, lines: [{ itemId: 4, qty: 5 }] }, headers: auth("manager") })).status === 201;
        const audit = await handle({ path: "/audit", headers: auth("manager") });
        const cookName = keys.find((k) => k.role === "cook")?.name;
        const entries = Array.isArray(audit.body) ? audit.body : audit.body?.entries;
        out.audit = audit.status === 200 && Array.isArray(entries) && entries.length >= 5 && JSON.stringify(entries[0]).includes("/orders") && entries.some((e) => JSON.stringify(e).includes(cookName) && JSON.stringify(e).includes("/recipes/1/cook") && JSON.stringify(e).includes("200"));
        out.auditReadsSkipped = Array.isArray(entries) && !entries.some((e) => JSON.stringify(e).includes('"GET"'));
        out.auditManagerOnly = (await handle({ path: "/audit", headers: auth("cook") })).status === 403;
      } catch (e) { out.crash = String(e).slice(0, 120); }
      console.log(JSON.stringify(out));`,
      ["seeded", "unauthenticated", "viewer", "forbiddenShape", "cook", "cookCounts", "manager", "audit", "auditReadsSkipped", "auditManagerOnly"],
    );
    r.apiDoc = /authorization|bearer/i.test(await ctx.read("docs/API.md").catch(() => ""));
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    r.lint = (await ctx.run("npm", ["run", "lint"])).code === 0;
    r.changelog = await changelogNoted(ctx, "larder");
    return grade(r, { core: ["seeded", "unauthenticated", "viewer", "manager", "tests"], okWhy: "keys, roles, audit and docs all right" });
  },
};

export default task;
