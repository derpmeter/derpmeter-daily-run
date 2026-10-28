// Five steps in docs/RELEASE.md; a release that skips one is not done.
const VERSION_FILES = ["package.json", "src/version.js", "CHANGELOG.md", "README.md"];
const task = {
  id: "release-checklist",
  prompt:
    "Release Pantry 1.5.0. The change in this release: items that expire within a week are listed at `GET /expiring`.",
  budgetSec: 30,
  allowed: VERSION_FILES,
  forbidden: ["tests/", "docs/"],
  async check(ctx) {
    const missing = [];
    if (JSON.parse(await ctx.read("package.json")).version !== "1.5.0") missing.push("package.json");
    if (!/VERSION = "1\.5\.0"/.test(await ctx.read("src/version.js"))) missing.push("src/version.js");
    // Step 3: ## Unreleased renamed to the version (its bullet kept, this
    // release's bullet added) under a new empty ## Unreleased.
    const lines = (await ctx.read("CHANGELOG.md")).split("\n");
    const heads = lines.map((l, i) => [l, i]).filter(([l]) => l.startsWith("## "));
    const [h0, h1] = heads;
    const body = h1 ? lines.slice(h1[1] + 1, heads[2]?.[1] ?? lines.length).filter((l) => l.startsWith("- ")) : [];
    const emptyUnreleased = h0?.[0] === "## Unreleased" && !lines.slice(h0[1] + 1, h1?.[1]).some((l) => l.trim());
    const versioned = /^## 1\.5\.0 - \d{4}-\d{2}-\d{2}$/.test(h1?.[0] ?? "");
    if (!(emptyUnreleased && versioned && body.some((b) => b.includes("Faster tag lookup")) && body.some((b) => /expir/i.test(b)) && lines.includes("## 1.4.2 - 2026-09-30")))
      missing.push("CHANGELOG.md");
    if (!(await ctx.read("README.md")).includes("Current version: 1.5.0")) missing.push("README.md");
    if (!missing.length) return { ok: true, why: "all release steps done" };
    // Three of four files right: a release with one step missing.
    return missing.length === 1
      ? { ok: false, partial: true, why: `release step missed: ${missing[0]}` }
      : { ok: false, why: `release steps missed: ${missing.join(", ")}` };
  },
};

export default task;
