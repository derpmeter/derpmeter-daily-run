// The long Larder chores: each check fails untouched and passes a reference
// solution; a solution with one part missing is partly done.
import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkContext, exec } from "../lib/system.mjs";

const FIXTURE = new URL("../fixtures/larder", import.meta.url).pathname;
const done = { status: "done", answer: "ok", changed: [] };
async function check(id, ...edits) {
  const task = (await import(`../tasks/${id}.mjs`)).default;
  const dir = await mkdtemp(join(tmpdir(), "larder-long-"));
  try {
    await cp(FIXTURE, dir, { recursive: true });
    const git = (...a) => exec("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: dir });
    await git("init", "-q");
    await git("add", "-A");
    await git("commit", "-qm", "fixture");
    for (const e of edits) await e(dir);
    return await task.check(checkContext(dir, done));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
const edit = (file, from, to) => async (dir) => {
  const p = join(dir, file);
  const s = await readFile(p, "utf8");
  if (from instanceof RegExp ? !from.test(s) : !s.includes(from)) throw new Error(`edit: ${file} lacks ${String(from).slice(0, 60)}`);
  await writeFile(p, s.replace(from, to));
};
const put = (file, body) => async (dir) => writeFile(join(dir, file), body);
const append = (file, body) => async (dir) => {
  const p = join(dir, file);
  await writeFile(p, `${await readFile(p, "utf8")}${body}`);
};
const json = (file, fn) => async (dir) => {
  const p = join(dir, file);
  const d = JSON.parse(await readFile(p, "utf8"));
  fn(d);
  await writeFile(p, `${JSON.stringify(d, null, 2)}\n`);
};
const noted = edit("CHANGELOG.md", "- Show stock on hand in `GET /items`.\n", "- Show stock on hand in `GET /items`.\n- The change.\n");
const code = (name, status, message) => [
  edit("src/errors.js", "  order_state: 409,\n", `  order_state: 409,\n  ${name}: ${status},\n`),
  edit("src/i18n/messages.js", '    order_state: "Order {id} is {state}; it cannot be {action}.",\n', `    order_state: "Order {id} is {state}; it cannot be {action}.",\n    ${name}: "${message}",\n`),
];

test("long chores fail untouched", async () => {
  for (const id of ["larder-sites", "larder-sales", "larder-roles"]) {
    const r = await check(id);
    assert.equal(r.ok, false, id);
    assert.equal(r.partial, undefined, id);
  }
});

test("larder-sites: reference solution; without docs it is partly done", async () => {
  const migration = [
    edit("src/db/migrations.js", "export const CURRENT_VERSION = 2;", "export const CURRENT_VERSION = 3;"),
    edit(
      "src/db/migrations.js",
      "];\n\n/** Upgrades `data` to CURRENT_VERSION. */",
      `  {
    from: 2,
    // v3: locations belong to sites; existing ones to "main".
    up(data) {
      return {
        ...data,
        schemaVersion: 3,
        sites: data.sites ?? [{ id: "main", name: "Main kitchen" }],
        locations: data.locations.map((l) => ({ ...l, site: l.site ?? "main" })),
      };
    },
  },
];

/** Upgrades \`data\` to CURRENT_VERSION. */`,
    ),
  ];
  const seed = json("data/seed.json", (d) => {
    d.schemaVersion = 3;
    d.sites = [{ id: "main", name: "Main kitchen" }, { id: "annex", name: "Annex kitchen" }];
    d.locations = d.locations.map((l) => ({ ...l, site: "main" })).concat({ id: "annex-fridge", name: "Annex fridge", tempC: 4, site: "annex" });
  });
  const server = [
    edit(
      "src/http/server.js",
      "/** Builds the request handler over a store. `clock` returns now (ms). */",
      `/** A view of the store limited to one site's locations and batches. */
export function siteView(store, site) {
  const ids = new Set(store.data.locations.filter((l) => l.site === site).map((l) => l.id));
  const data = new Proxy(store.data, {
    get(target, key) {
      if (key === "locations") return target.locations.filter((l) => ids.has(l.id));
      if (key === "batches") {
        const live = target.batches.filter((b) => ids.has(b.location));
        live.push = (...xs) => {
          target.batches.push(...xs);
          return Array.prototype.push.apply(live, xs);
        };
        return live;
      }
      return target[key];
    },
  });
  return { data, nextId: (k) => store.nextId(k), save: () => store.save() };
}

/** Builds the request handler over a store. \`clock\` returns now (ms). */`,
    ),
    edit(
      "src/http/server.js",
      "      const found = match(method, url.pathname);",
      `      const siteId = String(headers["x-larder-site"] ?? "main");
      if (!(store.data.sites ?? []).some((s) => s.id === siteId)) throw new AppError("unknown_site", { id: siteId });
      const found = match(method, url.pathname);`,
    ),
    edit("src/http/server.js", "      return await found.handler({\n        store,", "      return await found.handler({\n        store: siteView(store, siteId),"),
  ];
  const tests = [edit("tests/cli.test.js", "schema 1 → 2", "schema 1 → 3"), edit("tests/cli.test.js", "schemaVersion, 2);", "schemaVersion, 3);")];
  const docs = [
    append("docs/DATA.md", "\n## Sites\n\n- Every location belongs to a site; batches are at a site through their location.\n"),
    append("docs/API.md", "\n## Sites\n\nSend `X-Larder-Site` (default `main`).\n"),
    noted,
  ];
  const all = [...migration, seed, ...server, ...code("unknown_site", 400, "There is no site {id}."), ...tests];
  const full = await check("larder-sites", ...all, ...docs);
  assert.equal(full.ok, true, full.why);
  const bare = await check("larder-sites", ...all);
  assert.equal(bare.partial, true);
  assert.match(bare.why, /dataDoc|apiDoc|changelog/);
});

const SALES = `// Till sales: import (idempotent per ticket, all or nothing) and variance.
import { AppError } from "../errors.js";
import { dayOf, isDate } from "../dates.js";
import { parseCsvObjects } from "../io/csv.js";
import { consume } from "./batches.js";
import { onHand } from "./items.js";
import { getDish } from "./menu.js";
import { getRecipe, scaled } from "./recipes.js";

const round = (n) => Math.round(n * 1000) / 1000;

/** Imports sales CSV; returns { tickets, dishes } imported. */
export function importSales(store, text) {
  store.data.sales ??= [];
  const known = new Set(store.data.sales.map((s) => s.ticket));
  const rows = parseCsvObjects(text).map((r, i) => {
    const where = \`row \${i + 2}\`;
    const qty = Number(r.qty);
    const dishId = Number(r.dishId);
    if (!r.ticket) throw new AppError("bad_request", { reason: \`\${where}: ticket is required\` });
    if (!/^\\d{4}-\\d{2}-\\d{2}T/.test(r.soldAt) || Number.isNaN(Date.parse(r.soldAt))) throw new AppError("bad_request", { reason: \`\${where}: soldAt must be an ISO instant\` });
    if (!Number.isInteger(qty) || qty < 1) throw new AppError("bad_request", { reason: \`\${where}: qty must be a whole number above zero\` });
    let dish;
    try {
      dish = getDish(store, dishId);
    } catch {
      throw new AppError("bad_request", { reason: \`\${where}: unknown dish\` });
    }
    return { where, ticket: r.ticket, soldAt: r.soldAt, dishId: dish.id, qty, recipe: getRecipe(store, dish.recipeId) };
  });
  const fresh = rows.filter((r) => !known.has(r.ticket));
  const need = new Map();
  for (const r of fresh)
    for (const n of scaled(r.recipe, r.qty)) {
      const total = round((need.get(n.itemId) ?? 0) + n.qty);
      if (total > onHand(store, n.itemId)) throw new AppError("bad_request", { reason: \`\${r.where}: not enough stock\` });
      need.set(n.itemId, total);
    }
  for (const r of fresh) {
    for (const n of scaled(r.recipe, r.qty)) consume(store, n.itemId, n.qty, { at: r.soldAt, ref: \`sale:\${r.ticket}\` });
    store.data.sales.push({ ticket: r.ticket, soldAt: r.soldAt, dishId: r.dishId, qty: r.qty });
  }
  return { tickets: new Set(fresh.map((r) => r.ticket)).size, dishes: fresh.reduce((s, r) => s + r.qty, 0) };
}

/** Theoretical (from sales) and actual (ledger) use per item between two days. */
export function variance(store, from, to) {
  if (!isDate(from) || !isDate(to)) throw new AppError("invalid_date");
  const theo = new Map();
  for (const s of store.data.sales ?? []) {
    const day = dayOf(s.soldAt);
    if (day < from || day > to) continue;
    const recipe = getRecipe(store, getDish(store, s.dishId).recipeId);
    for (const n of scaled(recipe, s.qty)) theo.set(n.itemId, round((theo.get(n.itemId) ?? 0) + n.qty));
  }
  const batchItem = new Map(store.data.batches.map((b) => [b.id, b.itemId]));
  const actual = new Map();
  for (const m of store.data.movements) {
    if (m.type !== "consume") continue;
    const day = dayOf(m.at);
    if (day < from || day > to) continue;
    const item = batchItem.get(m.batchId);
    actual.set(item, round((actual.get(item) ?? 0) + m.qty));
  }
  const ids = [...new Set([...theo.keys(), ...actual.keys()])].sort((a, b) => a - b);
  return ids.map((itemId) => {
    const t = theo.get(itemId) ?? 0;
    const a = actual.get(itemId) ?? 0;
    return { itemId, theoretical: t, actual: a, diff: round(a - t) };
  }).filter((x) => x.theoretical > 0 || x.actual > 0);
}
`;
test("larder-sales: reference solution; without the variance docs it is partly done", async () => {
  const routes = [
    put("src/domain/sales.js", SALES),
    edit("src/http/routes/planning.js", 'import { importItems } from "../../io/items-import.js";', 'import { importItems } from "../../io/items-import.js";\nimport { importSales, variance } from "../../domain/sales.js";'),
    edit(
      "src/http/routes/planning.js",
      '  ["POST", "/jobs/nightly",',
      `  ["POST", "/import/sales", ({ store, body }) => {
    const b = objectBody(body);
    if (typeof b.csv !== "string") throw new AppError("bad_request", { reason: "csv must be text" });
    const result = importSales(store, b.csv);
    store.save();
    return { status: 200, body: result };
  }],
  ["GET", "/reports/variance", ({ store, query }) => ({ status: 200, body: variance(store, query.from, query.to) })],
  ["POST", "/jobs/nightly",`,
    ),
  ];
  const docs = [
    edit("README.md", "- `POST /import/items`: import items from CSV.\n", "- `POST /import/items`: import items from CSV.\n- `POST /import/sales`: import till sales.\n- `GET /reports/variance?from=&to=`: theoretical against actual use.\n"),
    noted,
  ];
  const full = await check("larder-sales", ...routes, ...docs);
  assert.equal(full.ok, true, full.why);
  // "with the difference": the field may be called difference.
  const named = edit("src/domain/sales.js", "return { itemId, theoretical: t, actual: a, diff: round(a - t) };", "return { itemId, theoretical: t, actual: a, difference: round(a - t) };");
  assert.equal((await check("larder-sales", ...routes, named, ...docs)).ok, true);
  const bare = await check("larder-sales", ...routes);
  assert.equal(bare.partial, true);
  assert.match(bare.why, /readme|changelog/);
});

test("larder-roles: reference solution; without the audit it is partly done", async () => {
  const keys = json("data/seed.json", (d) => {
    d.apiKeys = [
      { key: "view-7f3a9c21", name: "front desk", role: "viewer" },
      { key: "cook-2b8e4d90", name: "line cook", role: "cook" },
      { key: "mgr-91c4e7a2", name: "kitchen manager", role: "manager" },
    ];
    d.audit = [];
  });
  const router = edit(
    "src/http/router.js",
    "    return { method, re, keys, handler };",
    "    return { method, re, keys, handler, pattern };",
  );
  const router2 = edit(
    "src/http/router.js",
    "      if (m) return { handler: r.handler, params:",
    "      if (m) return { pattern: r.pattern, handler: r.handler, params:",
  );
  const auth = (withAudit) => [
    edit(
      "src/http/server.js",
      "/** Builds the request handler over a store. `clock` returns now (ms). */",
      `const COOK = new Set(["POST /recipes/:id/cook", "POST /batches/:id/waste", "POST /temperatures", "POST /stocktakes/:id/counts"]);

/** Whether a role may call a route ("METHOD /pattern"). */
export function allowed(role, route) {
  if (role === "manager") return true;
  if (route === "GET /audit") return false;
  if (route.startsWith("GET ")) return role === "viewer" || role === "cook";
  return role === "cook" && COOK.has(route);
}

/** Builds the request handler over a store. \`clock\` returns now (ms). */`,
    ),
    edit(
      "src/http/server.js",
      "      const found = match(method, url.pathname);\n      if (!found) throw new AppError(\"not_found\");",
      `      const token = /^bearer\\s+(\\S+)$/i.exec(String(headers.authorization ?? ""))?.[1];
      const caller = (store.data.apiKeys ?? []).find((k) => k.key === token);
      if (!caller) throw new AppError("unauthorized");
      if (method === "GET" && url.pathname === "/audit") {
        if (caller.role !== "manager") throw new AppError("forbidden");
        return { status: 200, body: [...(store.data.audit ?? [])].reverse() };
      }
      const found = match(method, url.pathname);
      if (!found) throw new AppError("not_found");
      if (!allowed(caller.role, \`\${method} \${found.pattern}\`)) throw new AppError("forbidden");
      if (method !== "GET") {
        const res = await found.handler({ store, params: found.params, query: Object.fromEntries(url.searchParams), body, headers, now: clock() });
        ${withAudit ? "store.data.audit ??= [];\n        store.data.audit.push({ at: new Date(clock()).toISOString(), key: caller.name, method, path: url.pathname, status: res.status });\n        store.save();" : ""}
        return res;
      }`,
    ),
    ...code("unauthorized", 401, "Send a valid API key."),
    edit("src/errors.js", "  unauthorized: 401,\n", "  unauthorized: 401,\n  forbidden: 403,\n"),
    edit("src/i18n/messages.js", '    unauthorized: "Send a valid API key.",\n', '    unauthorized: "Send a valid API key.",\n    forbidden: "This key may not do that.",\n'),
  ];
  const tests = edit(
    "tests/helpers.js",
    "export const app = (store = fresh()) => ({ store, handle: createApp(store, { clock: () => NOW }) });",
    `export const app = (store = fresh()) => {
  store.data.apiKeys ??= [{ key: "test-manager-key", name: "tests", role: "manager" }];
  const handle = createApp(store, { clock: () => NOW });
  return { store, handle: (req) => handle({ ...req, headers: { authorization: \`Bearer \${store.data.apiKeys.find((k) => k.role === "manager").key}\`, ...(req.headers ?? {}) } }) };
};`,
  );
  const docs = [append("docs/API.md", "\n## Keys\n\nSend `Authorization: Bearer <key>`; roles viewer, cook, manager.\n"), noted];
  const full = await check("larder-roles", keys, router, router2, ...auth(true), tests, ...docs);
  assert.equal(full.ok, true, full.why);
  const noAudit = await check("larder-roles", keys, router, router2, ...auth(false), tests, ...docs);
  assert.equal(noAudit.partial, true);
  assert.match(noAudit.why, /audit/);
});
