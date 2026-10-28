// Larder chores: each check fails on the untouched copy, passes a correct
// solution, and gives partial credit to a typical shortcut.
import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkContext, exec } from "../lib/system.mjs";

const FIXTURE = new URL("../fixtures/larder", import.meta.url).pathname;
const load = async (id) => (await import(`../tasks/${id}.mjs`)).default;
const done = { status: "done", answer: "ok", changed: [] };

async function check(id, ...edits) {
  const task = await load(id);
  const dir = await mkdtemp(join(tmpdir(), "larder-test-"));
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
const noted = edit("CHANGELOG.md", "- Show stock on hand in `GET /items`.\n", "- Show stock on hand in `GET /items`.\n- The change.\n");

test("larder base: green, and every chore fails untouched", async () => {
  for (const id of ["larder-transfer", "larder-fefo", "larder-cents", "larder-schema3", "larder-i18n"]) {
    const r = await check(id);
    assert.equal(r.ok, false, id);
    assert.equal(r.partial, undefined, id);
  }
});

test("larder-transfer: full solution, and one without docs and ledger", async () => {
  const domain = append(
    "src/domain/batches.js",
    `
/** Moves qty of a batch to a location; part of a batch becomes a new batch. */
export function transferBatch(store, batchId, to, qty, { at }) {
  const batch = getBatch(store, batchId);
  if (!store.data.locations.some((l) => l.id === to)) throw new AppError("unknown_location", { id: to });
  if (!(qty > 0) || qty > batch.qty) throw new AppError("invalid_qty");
  if (qty === batch.qty) {
    batch.location = to;
    return batch;
  }
  const moved = { ...batch, id: store.nextId("batch"), qty, location: to };
  batch.qty = Math.round((batch.qty - qty) * 1000) / 1000;
  store.data.batches.push(moved);
  record(store, { type: "adjust", batchId: batch.id, qty, at, ref: \`transfer:\${moved.id}\` });
  record(store, { type: "adjust", batchId: moved.id, qty, at, ref: \`transfer:\${batch.id}\` });
  return moved;
}
`,
  );
  const route = edit(
    "src/http/routes/batches.js",
    '  ["POST", "/batches/:id/waste",',
    `  ["POST", "/batches/:id/transfer", ({ store, params, body, now }) => {
    const b = objectBody(body);
    if (typeof b.qty !== "number" || !(b.qty > 0)) throw new AppError("invalid_qty");
    const batch = transferBatch(store, idParam(params.id), String(b.to ?? ""), b.qty, { at: new Date(now).toISOString() });
    store.save();
    return { status: 200, body: batch };
  }],
  ["POST", "/batches/:id/waste",`,
  );
  const imports = edit(
    "src/http/routes/batches.js",
    'import { getBatch, listBatches, waste } from "../../domain/batches.js";',
    'import { getBatch, listBatches, transferBatch, waste } from "../../domain/batches.js";\nimport { AppError } from "../../errors.js";',
  );
  const docs = [
    edit("README.md", "- `POST /batches/:id/waste`: record waste from a batch.", "- `POST /batches/:id/waste`: record waste from a batch.\n- `POST /batches/:id/transfer`: move all or part of a batch to another location."),
    append("docs/API.md", "\n## Transfers\n\n`POST /batches/:id/transfer` moves stock between locations.\n"),
    noted,
  ];
  const full = await check("larder-transfer", domain, route, imports, ...docs);
  assert.equal(full.ok, true, full.why);
  // "adjust" has no direction, so a negative source movement is fine too.
  const signed = edit("src/domain/batches.js", "record(store, { type: \"adjust\", batchId: batch.id, qty, at,", "record(store, { type: \"adjust\", batchId: batch.id, qty: -qty, at,");
  assert.equal((await check("larder-transfer", domain, signed, route, imports, ...docs)).ok, true);
  const bare = await check("larder-transfer", domain, route, imports);
  assert.equal(bare.partial, true);
  assert.match(bare.why, /readme|apiDoc|changelog/);
});

const FEFO = `function consumptionOrder(batches) {
  return [...batches].sort(
    (a, b) =>
      (a.expires === null) - (b.expires === null) ||
      (a.expires ?? "").localeCompare(b.expires ?? "") ||
      a.receivedOn.localeCompare(b.receivedOn) ||
      a.id - b.id,
  );
}`;
const FIFO = `function consumptionOrder(batches) {
  return [...batches].sort((a, b) => a.receivedOn.localeCompare(b.receivedOn));
}`;
const OLD_ORDER = `function consumptionOrder(batches) {
  return [...batches].sort((a, b) => b.receivedOn.localeCompare(a.receivedOn));
}`;
const fefoTest = put(
  "tests/fefo.test.js",
  `import test from "node:test";
import assert from "node:assert/strict";
import { consume } from "../src/domain/batches.js";
import { fresh } from "./helpers.js";

test("milk that expires first is used first", () => {
  const store = fresh();
  assert.equal(consume(store, 2, 1, { at: "2026-10-28T10:00:00Z" })[0].batchId, 4);
});
`,
);

test("larder-fefo: FEFO by the rules; FIFO fixes the report only", async () => {
  const full = await check("larder-fefo", edit("src/domain/batches.js", OLD_ORDER, FEFO), fefoTest, noted);
  assert.equal(full.ok, true, full.why);
  const fifo = await check("larder-fefo", edit("src/domain/batches.js", OLD_ORDER, FIFO), fefoTest, noted);
  assert.equal(fifo.partial, true);
  assert.match(fifo.why, /fefo|noExpiryLast/);
  const noTest = await check("larder-fefo", edit("src/domain/batches.js", OLD_ORDER, FEFO), noted);
  assert.equal(noTest.partial, true);
  assert.match(noTest.why, /regressionTest/);
});

const CENTS = `export function stockValue(store) {
  const lines = listItems(store).map((item) => {
    const qty = Math.round(
      store.data.batches.filter((b) => b.itemId === item.id).reduce((s, b) => s + b.qty, 0) * 1000,
    ) / 1000;
    return { itemId: item.id, name: item.name, qty, valueCents: lineCents(qty, item.priceCents) };
  });
  return { totalCents: lines.reduce((s, l) => s + l.valueCents, 0), lines };
}`;
const centsTest = put(
  "tests/value.test.js",
  `import test from "node:test";
import assert from "node:assert/strict";
import { stockValue } from "../src/domain/reports.js";
import { fresh } from "./helpers.js";

test("the total is the sum of the rounded lines", () => {
  const r = stockValue(fresh());
  assert.equal(r.totalCents, r.lines.reduce((s, l) => s + l.valueCents, 0));
});
`,
);
test("larder-cents: rounded lines summed; a total-only patch is partial", async () => {
  const replaceValue = (body) =>
    edit("src/domain/reports.js", /export function stockValue\(store\) \{[\s\S]*?\n\}\n/, `${body}\n`);
  const imp = edit("src/domain/reports.js", 'import { listItems } from "./items.js";', 'import { listItems } from "./items.js";\nimport { lineCents } from "../money.js";');
  const full = await check("larder-cents", replaceValue(CENTS), imp, centsTest, noted);
  assert.equal(full.ok, true, full.why);
  // Summing the already rounded lines is a valid fix too.
  const totalOnly = edit("src/domain/reports.js", "    totalCents: Math.round(total),", "    totalCents: lines.reduce((s, l) => s + Math.round(l.valueCents), 0),");
  assert.equal((await check("larder-cents", totalOnly, centsTest, noted)).ok, true);
  const noTest = await check("larder-cents", totalOnly, noted);
  assert.equal(noTest.partial, true);
  assert.match(noTest.why, /regressionTest/);
});

test("larder-schema3: the whole schema change, and one without seed and docs", async () => {
  const migration = edit(
    "src/db/migrations.js",
    "export const CURRENT_VERSION = 2;",
    "export const CURRENT_VERSION = 3;",
  );
  const step = edit(
    "src/db/migrations.js",
    "];\n\n/** Upgrades `data` to CURRENT_VERSION. */",
    `  {
    from: 2,
    // v3: every batch carries its own cost; existing ones take the item price.
    up(data) {
      const price = Object.fromEntries(data.items.map((i) => [i.id, i.priceCents]));
      return { ...data, schemaVersion: 3, batches: data.batches.map((b) => ({ ...b, costCents: b.costCents ?? price[b.itemId] ?? 0 })) };
    },
  },
];

/** Upgrades \`data\` to CURRENT_VERSION. */`,
  );
  const receive = edit("src/domain/orders.js", "      location: lots[i].location,\n    };", "      location: lots[i].location,\n      costCents: line.priceCents,\n    };");
  const value = edit(
    "src/domain/reports.js",
    "    const qty = store.data.batches\n      .filter((b) => b.itemId === item.id)\n      .reduce((s, b) => s + b.qty, 0);\n    return { itemId: item.id, name: item.name, qty, valueCents: qty * item.priceCents };",
    "    const own = store.data.batches.filter((b) => b.itemId === item.id);\n    const qty = own.reduce((s, b) => s + b.qty, 0);\n    return { itemId: item.id, name: item.name, qty, valueCents: own.reduce((s, b) => s + Math.round(b.qty * (b.costCents ?? item.priceCents)), 0) };",
  );
  const tests = [
    edit("tests/cli.test.js", "schema 1 → 2", "schema 1 → 3"),
    edit("tests/cli.test.js", "schemaVersion, 2);", "schemaVersion, 3);"),
  ];
  const seed = async (dir) => {
    const p = join(dir, "data/seed.json");
    const d = JSON.parse(await readFile(p, "utf8"));
    const price = Object.fromEntries(d.items.map((i) => [i.id, i.priceCents]));
    d.schemaVersion = 3;
    d.batches = d.batches.map((b) => ({ ...b, costCents: price[b.itemId] }));
    await writeFile(p, `${JSON.stringify(d, null, 2)}\n`);
  };
  const docs = [append("docs/DATA.md", "\n## Cost\n\n- Every batch has `costCents`, its cost per unit (schema 3).\n"), noted];
  const full = await check("larder-schema3", migration, step, receive, value, ...tests, seed, ...docs);
  assert.equal(full.ok, true, full.why);
  const bare = await check("larder-schema3", migration, step, receive, value, ...tests);
  assert.equal(bare.partial, true);
  assert.match(bare.why, /seed|dataDoc/);
});

test("larder-i18n: negotiation and every Korean message; a naive header read is partial", async () => {
  const ko = edit(
    "src/i18n/messages.js",
    '  ko: {\n    not_found: "없는 경로입니다.",\n    unknown_item: "{id}번 품목이 없습니다.",\n  },',
    `  ko: {
    not_found: "없는 경로입니다.",
    bad_request: "요청이 올바르지 않습니다: {reason}.",
    invalid_qty: "수량은 0보다 큰 숫자여야 합니다.",
    invalid_date: "날짜는 YYYY-MM-DD로 씁니다.",
    unknown_item: "{id}번 품목이 없습니다.",
    unknown_batch: "{id}번 배치가 없습니다.",
    unknown_location: "{id} 위치가 없습니다.",
    unknown_supplier: "{id}번 공급처가 없습니다.",
    not_enough_stock: "{item}은(는) {available}{unit}만 남았습니다.",
    order_state: "{id}번 주문은 {state} 상태라 {action} 수 없습니다.",
  },`,
  );
  const negotiate = (smart) =>
    edit(
      "src/http/server.js",
      "    const lang = config.defaultLanguage;",
      smart
        ? `    const lang = pickLanguage(headers["accept-language"]);`
        : `    const lang = String(headers["accept-language"] ?? "").startsWith("ko") ? "ko" : config.defaultLanguage;`,
    );
  const picker = append(
    "src/http/server.js",
    `
/** The best supported language for an Accept-Language header. */
export function pickLanguage(header) {
  const ranked = String(header ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = Number(params.find((p) => p.trim().startsWith("q="))?.trim().slice(2) ?? 1);
      return { lang: tag.trim().toLowerCase().split("-")[0], q: Number.isFinite(q) ? q : 0 };
    })
    .filter((x) => x.lang && x.q > 0 && ["en", "ko"].includes(x.lang))
    .sort((a, b) => b.q - a.q);
  return ranked[0]?.lang ?? config.defaultLanguage;
}
`,
  );
  const doc = append("docs/API.md", "\nThe language comes from the `Accept-Language` header (q-values honored), else `LARDER_LANG`.\n");
  const full = await check("larder-i18n", ko, negotiate(true), picker, doc, noted);
  assert.equal(full.ok, true, full.why);
  const naive = await check("larder-i18n", ko, negotiate(false), doc, noted);
  assert.equal(naive.partial, true);
  assert.match(naive.why, /qValues/);
});
