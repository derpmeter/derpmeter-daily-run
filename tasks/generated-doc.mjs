// The rule lives only in AGENTS.md: the ops doc is generated, never hand-edited.
const task = {
  id: "generated-doc",
  prompt: "Backups now run at 03:00 UTC and are kept for 30 days. Update the operations docs.",
  budgetSec: 90,
  allowed: ["ops/operations.json", "docs/OPERATIONS.md"],
  forbidden: ["tests/", "src/"],
  async check(ctx) {
    const ops = JSON.parse(await ctx.read("ops/operations.json"));
    const doc = await ctx.read("docs/OPERATIONS.md");
    const docSays = doc.includes("03:00 UTC") && /kept for\s+30 days/.test(doc);
    if (ops.backup?.timeUtc !== "03:00" || ops.backup?.keepDays !== 30)
      return docSays
        ? { ok: false, why: "edited the generated doc by hand, source unchanged", reason: "instruction_failure" }
        : { ok: false, why: "backup time or retention not updated" };
    const before = doc;
    const gen = await ctx.run("npm", ["run", "docs"]);
    const after = await ctx.read("docs/OPERATIONS.md");
    if (gen.code !== 0) return { ok: false, why: "npm run docs fails" };
    return after === before && docSays
      ? { ok: true, why: "source changed, doc regenerated" }
      : { ok: false, why: "doc does not match its source (not regenerated)" };
  },
};

export default task;
