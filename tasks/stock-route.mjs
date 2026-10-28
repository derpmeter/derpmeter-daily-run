// A small endpoint with exact data shapes; the file has a quoted field.
import { cases, changelogNoted, grade, readmeRoute } from "../lib/grade.mjs";

const QUOTED = 'P-106,"Beans, black",3,can,B1\n';
const task = {
  id: "stock-route",
  prompt:
    "Add `GET /stock` to src/server.js (in `handle`). It returns the rows of data/stock.csv as JSON objects with the keys sku, name, qty, unit and shelf, in file order. `qty` is a number and an empty `unit` is `null`. Parse the file as CSV and read it when the request comes in.",
  budgetSec: 37,
  allowed: ["src/server.js", "src/stock.js", "src/csv.js", "CHANGELOG.md", "README.md"],
  forbidden: ["tests/", "data/"],
  async setup(ctx) {
    await ctx.write("data/stock.csv", (await ctx.read("data/stock.csv")) + QUOTED);
  },
  async check(ctx) {
    const r = await cases(
      ctx,
      `
      import { handle } from "./src/server.js";
      import { writeFile, readFile } from "node:fs/promises";
      const out = {};
      const want = [
        { sku: "P-101", name: "Rice", qty: 2, unit: "bag", shelf: "B2" },
        { sku: "P-102", name: "Milk", qty: 1, unit: "carton", shelf: "F1" },
        { sku: "P-103", name: "Egg", qty: 6, unit: null, shelf: "F1" },
        { sku: "P-104", name: "Yogurt", qty: 4, unit: "cup", shelf: "F2" },
        { sku: "P-105", name: "Black beans", qty: 3, unit: "can", shelf: "B1" },
      ];
      try {
        const a = await handle("/stock");
        out.rows = a.status === 200 && JSON.stringify(a.body?.slice(0, 5)) === JSON.stringify(want);
        out.quoted = JSON.stringify(a.body?.[5]) === JSON.stringify({ sku: "P-106", name: "Beans, black", qty: 3, unit: "can", shelf: "B1" }) && a.body.length === 6;
        const csv = await readFile("data/stock.csv", "utf8");
        await writeFile("data/stock.csv", csv + "P-107,Salt,1,box,B3\\n");
        const b = await handle("/stock");
        await writeFile("data/stock.csv", csv);
        out.perRequest = b.body?.length === 7 && b.body[6].qty === 1;
        out.otherRoutes = (await handle("/items")).status === 200 && (await handle("/nope")).status === 404;
      } catch {}
      console.log(JSON.stringify(out));`,
      ["rows", "quoted", "perRequest", "otherRoutes"],
    );
    r.changelog = await changelogNoted(ctx);
    r.readme = await readmeRoute(ctx, "/stock");
    return grade(r, { core: ["rows", "otherRoutes"], okWhy: "GET /stock as specified, conventions kept" });
  },
};

export default task;
