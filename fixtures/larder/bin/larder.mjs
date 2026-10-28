#!/usr/bin/env node
// Larder command line.
//   larder migrate <file>      upgrade a data file to the current schema (in place)
//   larder value <file>        print the stock value report
//   larder batches <file>      print batches as CSV
import { readFileSync, writeFileSync } from "node:fs";
import { migrate } from "../src/db/migrations.js";
import { memoryStore } from "../src/db/store.js";
import { stockValue } from "../src/domain/reports.js";
import { formatCents } from "../src/money.js";

const [cmd, file] = process.argv.slice(2);
if (!cmd || !file) {
  console.error("usage: larder <migrate|value|batches> <file>");
  process.exit(2);
}
const raw = JSON.parse(readFileSync(file, "utf8"));

if (cmd === "migrate") {
  const before = raw.schemaVersion ?? 1;
  const data = migrate(raw);
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${file}: schema ${before} → ${data.schemaVersion}`);
} else if (cmd === "value") {
  const report = stockValue(memoryStore(raw));
  for (const l of report.lines) console.log(`${l.name}\t${l.qty}\t${formatCents(l.valueCents)}`);
  console.log(`total\t\t${formatCents(report.totalCents)}`);
} else if (cmd === "batches") {
  const store = memoryStore(raw);
  console.log("id,item,lot,qty,expires,location");
  for (const b of store.data.batches) console.log([b.id, b.itemId, b.lot, b.qty, b.expires ?? "", b.location].join(","));
} else {
  console.error(`unknown command ${cmd}`);
  process.exit(2);
}
