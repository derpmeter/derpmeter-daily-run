// Pagination with validation: easy to get mostly right.
import { cases, grade } from "../lib/grade.mjs";

const task = {
  id: "paginate-items",
  prompt:
    "Add pagination to `GET /items`: `?limit=N&offset=M`. Without them it returns every item as today. `limit` is a whole number from 1 to 50 and `offset` a whole number from 0; anything else answers status 400 with a JSON `error`. The body stays an array of items. `handle(path, now)` receives the path with its query string.",
  budgetSec: 60,
  allowed: ["src/server.js", "src/items.js"],
  forbidden: ["tests/"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `
      const out = {};
      try {
        const { handle } = await import("./src/server.js");
        const ids = async (p) => { const b = (await handle(p)).body; return Array.isArray(b) ? b.map((i) => i.id).join(",") : "!"; };
        out.unchanged = (await ids("/items")) === "1,2,3,4";
        out.page = (await ids("/items?limit=2")) === "1,2" && (await ids("/items?limit=2&offset=1")) === "2,3";
        out.offsetOnly = (await ids("/items?offset=3")) === "4" && (await ids("/items?offset=9")) === "";
        const bad = async (q) => { const r = await handle("/items?" + q); return r.status === 400 && typeof r.body?.error === "string"; };
        out.validation = (await bad("limit=0")) && (await bad("limit=51")) && (await bad("limit=x")) && (await bad("offset=-1")) && (await bad("limit=1.5"));
        out.otherRoutes = (await handle("/nope")).status === 404 && (await handle("/expiring", Date.parse("2026-10-30T00:00:00Z"))).status === 200;
      } catch {}
      console.log(JSON.stringify(out));`,
      ["unchanged", "page", "offsetOnly", "validation", "otherRoutes"],
    );
    const t = await ctx.run("npm", ["test"]);
    r.tests = t.code === 0;
    return grade(r, { core: ["unchanged", "page", "tests"], okWhy: "pagination and validation all right" });
  },
};

export default task;
