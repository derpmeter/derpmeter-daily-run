import { test } from "node:test";
import assert from "node:assert/strict";
import { readmeRoute } from "../lib/grade.mjs";

const ctx = (readme) => ({ read: async () => readme });

test("readmeRoute finds a route on a wrapped bullet's continuation line", async () => {
  const readme = [
    "# Larder",
    "## Routes",
    "- `GET /reports/stock-value`, `GET /reports/waste?from=&to=`,",
    "  `GET /reports/variance?from=&to=`: reports.",
    "- `POST /import/items`: import items from CSV.",
    "",
    "Mentions /orphan outside any bullet.",
    "## Other",
    "- `GET /elsewhere`",
  ].join("\n");
  assert.equal(await readmeRoute(ctx(readme), "/reports/variance"), true);
  assert.equal(await readmeRoute(ctx(readme), "/import/items"), true);
  assert.equal(await readmeRoute(ctx(readme), "/orphan"), false);
  assert.equal(await readmeRoute(ctx(readme), "/elsewhere"), false);
  assert.equal(await readmeRoute(ctx(readme), "/import/sales"), false);
});
