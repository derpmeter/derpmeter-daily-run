// Five steps in docs/RELEASE.md; a release that skips one is not done.
const VERSION_FILES = ["package.json", "src/version.js", "CHANGELOG.md", "README.md"];
const task = {
  id: "release-checklist",
  prompt:
    "Release Pantry 1.5.0. The change in this release: items that expire within a week are listed at `GET /expiring`.",
  budgetSec: 120,
  allowed: VERSION_FILES,
  forbidden: ["tests/", "docs/"],
  async check(ctx) {
    const missing = [];
    if (JSON.parse(await ctx.read("package.json")).version !== "1.5.0") missing.push("package.json");
    if (!/VERSION = "1\.5\.0"/.test(await ctx.read("src/version.js"))) missing.push("src/version.js");
    const lines = (await ctx.read("CHANGELOG.md")).split("\n");
    const heads = lines.filter((l) => l.startsWith("## "));
    const bullet = lines.slice(lines.indexOf(heads[0]) + 1).find((l) => l.trim());
    if (!/^## 1\.5\.0 - \d{4}-\d{2}-\d{2}$/.test(heads[0] ?? "") || !bullet?.startsWith("- ") || !heads.includes("## 1.4.2 - 2026-09-30"))
      missing.push("CHANGELOG.md");
    if (!(await ctx.read("README.md")).includes("Current version: 1.5.0")) missing.push("README.md");
    return missing.length
      ? { ok: false, why: `release steps missed: ${missing.join(", ")}` }
      : { ok: true, why: "all release steps done" };
  },
};

export default task;
