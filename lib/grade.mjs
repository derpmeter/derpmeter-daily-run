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
