// Graded checks: a chore lists hidden cases; "core" cases must all pass for
// any credit. All cases pass = Smart; core passes but some others miss =
// partly done (Meh); core misses = not done.
export function grade(results, { core, okWhy, partWhy = "missed" }) {
  const failed = Object.entries(results).filter(([, v]) => !v).map(([k]) => k);
  const coreFailed = failed.filter((k) => core.includes(k));
  if (!failed.length) return { ok: true, why: okWhy };
  if (coreFailed.length) return { ok: false, why: `failed: ${coreFailed.join(", ")}` };
  return { ok: false, partial: true, why: `${partWhy} ${failed.join(", ")}` };
}

// Runs a module script in the copy that prints one JSON object of named
// boolean cases on its last line; a crash counts every case as failed.
export async function cases(ctx, code, names) {
  const r = await ctx.node(code);
  const last = r.stdout.trim().split("\n").pop() ?? "";
  try {
    const o = JSON.parse(last);
    return Object.fromEntries(names.map((n) => [n, o[n] === true]));
  } catch {
    return Object.fromEntries(names.map((n) => [n, false]));
  }
}

// Project conventions from the fixture's AGENTS.md, checked as extra cases.
const section = (text, heading) => {
  const lines = text.split("\n");
  const i = lines.findIndex((l) => l.trim() === heading);
  if (i < 0) return [];
  const out = [];
  for (const l of lines.slice(i + 1)) {
    if (l.startsWith("## ")) break;
    out.push(l);
  }
  return out;
};
// A new bullet under "## Unreleased", the existing one kept.
const readOr = async (ctx, file) => {
  try {
    return await ctx.read(file);
  } catch {
    return "";
  }
};
// `kept` is the bullet each fixture ships under Unreleased.
const KEPT = { pantry: "Faster tag lookup", larder: "Show stock on hand" };
export async function changelogNoted(ctx, fixture = "pantry") {
  const text = await readOr(ctx, "CHANGELOG.md");
  const first = text.split("\n").find((l) => l.startsWith("## "));
  const bullets = section(text, "## Unreleased").filter((l) => l.startsWith("- "));
  return first === "## Unreleased" && bullets.length >= 2 && bullets.some((b) => b.includes(KEPT[fixture]));
}
// The route listed under "## Routes" in README.md.
export async function readmeRoute(ctx, route) {
  return section(await readOr(ctx, "README.md"), "## Routes").some((l) => l.startsWith("- ") && l.includes(route));
}
// A one-line JSDoc right above the exported function.
export async function jsdoc(ctx, file, name) {
  const src = await readOr(ctx, file);
  return new RegExp(`/\\*\\*[^\\n]*\\*/\\s*\\nexport (async )?function ${name}\\b`).test(src) ||
    new RegExp(`/\\*\\*[\\s\\S]{0,300}?\\*/\\s*\\nexport (async )?function ${name}\\b`).test(src);
}
// Hidden-script snippet: an API error in the house shape.
export const ERROR_SHAPE =
  'const houseError = (r) => r?.body?.error && typeof r.body.error.code === "string" && /^[a-z][a-z0-9_]*$/.test(r.body.error.code) && typeof r.body.error.message === "string";';
