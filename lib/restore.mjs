// Raw results stored before 2026-11-18 masked anything shaped like an e-mail
// address, including a column-0 Python decorator on a diff line:
// "+@router.get(" became "<email>(", marker and all, so the diff no longer
// applies. This puts such lines back, but only when the file's result matches
// the post-image blob hash on the diff's own "index" line.
import { createHash } from "node:crypto";

const EMAIL = /[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];
const MAX_TRIES = 200_000;

const blob = (t) => createHash("sha1").update(`blob ${Buffer.byteLength(t)}\0`).update(t).digest("hex");

// Names a masked "@name" may have been: decorators seen in the sources and
// the diff, plus every HTTP method on each decorated object.
function names(texts) {
  const out = new Set();
  for (const t of texts)
    for (const m of t.matchAll(/^[ +-]?\s*@([A-Za-z_][\w.]*\.[A-Za-z]{2,})/gm)) {
      out.add(m[1]);
      const obj = m[1].slice(0, m[1].lastIndexOf("."));
      for (const v of METHODS) out.add(`${obj}.${v}`);
    }
  return [...out].filter((n) => `x@${n}`.replace(EMAIL, "") === "");
}

// The post-image of one file's hunks over its old text; null when they do not fit.
function apply(old, lines) {
  const src = old ? old.replace(/\n$/, "").split("\n") : [];
  const out = [];
  let i = 0;
  for (const l of lines) {
    const h = l.match(/^@@ -(\d+)(?:,(\d+))? \+\d+(?:,\d+)? @@/);
    if (h) {
      const start = Number(h[2] === "0" ? h[1] : h[1] - 1);
      if (start < i || start > src.length) return null;
      out.push(...src.slice(i, start));
      i = start;
    } else if (l.startsWith("+")) out.push(l.slice(1));
    else if (l.startsWith("-") || l.startsWith(" ")) {
      if (src[i] !== l.slice(1)) return null;
      if (l.startsWith(" ")) out.push(src[i]);
      i++;
    } else if (!l.startsWith("\\") && l !== "") return null;
  }
  out.push(...src.slice(i));
  return out.join("\n");
}

function restorePart(part, sources, cands) {
  const file = part.match(/^diff --git a\/(\S+)/)?.[1];
  const index = part.match(/^index [0-9a-f]+\.\.([0-9a-f]{7,})/m)?.[1];
  const lines = part.split("\n");
  const at = lines.map((l, k) => (l.startsWith("<email>") ? k : -1)).filter((k) => k >= 0);
  if (!file || !index || !at.length) return part;
  const head = lines.findIndex((l) => l.startsWith("@@"));
  if (head < 0) return part;
  const old = /^new file mode/m.test(part) ? "" : sources.get(file);
  if (old === undefined) return part;
  const options = at.map((k) => {
    const rest = lines[k].slice("<email>".length);
    return ["+", "-"].flatMap((m) => cands.map((n) => `${m}@${n}${rest}`)).filter((c) => c.replace(EMAIL, "<email>") === lines[k] || mask(c) === lines[k]);
  });
  let tries = 0;
  const pick = new Array(at.length).fill(0);
  if (options.some((o) => !o.length) || options.reduce((n, o) => n * o.length, 1) > MAX_TRIES) return part;
  for (;;) {
    const body = lines.slice(head);
    at.forEach((k, j) => (body[k - head] = options[j][pick[j]]));
    const post = apply(old, body);
    if (post !== null && [post, `${post}\n`].some((t) => blob(t).startsWith(index))) {
      const out = [...lines];
      at.forEach((k, j) => (out[k] = options[j][pick[j]]));
      return out.join("\n");
    }
    if (++tries > MAX_TRIES) return part;
    let j = 0;
    while (j < pick.length && ++pick[j] === options[j].length) pick[j++] = 0;
    if (j === pick.length) return part;
  }
}
const mask = (s) => s.replace(EMAIL, "<email>");

// sources: Map of fixture path → text (the run's own fixture).
export function restoreDecorators(diff, sources) {
  if (!/^<email>/m.test(diff)) return diff;
  const cands = names([...sources.values(), diff]);
  return diff
    .split(/(?=^diff --git )/m)
    .map((part) => restorePart(part, sources, cands))
    .join("");
}
