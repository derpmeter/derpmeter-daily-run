// A small endpoint with exact data shapes.
const task = {
  id: "stock-route",
  prompt:
    "Add `GET /stock` to src/server.js (in `handle`). It returns the rows of data/stock.csv as JSON objects with the keys sku, name, qty, unit and shelf, in file order. `qty` is a number and an empty `unit` is `null`. Read the file when the request comes in.",
  budgetSec: 120,
  allowed: ["src/server.js", "src/stock.js"],
  forbidden: ["tests/", "data/"],
  async check(ctx) {
    const r = await ctx.node(`
      import { handle } from "./src/server.js";
      import { writeFile, readFile } from "node:fs/promises";
      const want = [
        { sku: "P-101", name: "Rice", qty: 2, unit: "bag", shelf: "B2" },
        { sku: "P-102", name: "Milk", qty: 1, unit: "carton", shelf: "F1" },
        { sku: "P-103", name: "Egg", qty: 6, unit: null, shelf: "F1" },
        { sku: "P-104", name: "Yogurt", qty: 4, unit: "cup", shelf: "F2" },
        { sku: "P-105", name: "Black beans", qty: 3, unit: "can", shelf: "B1" },
      ];
      const a = await handle("/stock");
      if (a.status !== 200 || JSON.stringify(a.body) !== JSON.stringify(want)) process.exit(2);
      const csv = await readFile("data/stock.csv", "utf8");
      await writeFile("data/stock.csv", csv + "P-106,Salt,1,box,B3\\n");
      const b = await handle("/stock");
      await writeFile("data/stock.csv", csv);
      process.exit(b.body?.length === 6 && b.body[5].qty === 1 ? 0 : 3);`);
    if (r.code === 2) return { ok: false, why: "GET /stock body is not the CSV rows as specified" };
    if (r.code === 3) return { ok: false, why: "GET /stock does not read the file per request" };
    if (r.code !== 0) return { ok: false, why: "GET /stock fails" };
    const t = await ctx.run("node", ["--test", "tests/server.test.js"]);
    return t.code === 0
      ? { ok: true, why: "GET /stock returns the rows as specified" }
      : { ok: false, why: "existing routes broke" };
  },
};

export default task;
