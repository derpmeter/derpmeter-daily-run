// Toonify chores: shared dependencies, the hidden-check environment and the
// project's conventions (fixtures/toonify/AGENTS.md).
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { exec } from "./system.mjs";

// Checks run slow commands (tsc, pytest) with a long timeout: a slow machine
// must never fail a chore.
const run = (ctx, c, a) => exec(c, a, { cwd: ctx.dir, timeoutSec: 300 });
const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
// Installed once by bin/toonify-deps.sh; every run links them.
export const DEPS = join(homedir(), ".cache/derpmeter-lab/toonify");

export async function linkDeps(ctx) {
  await symlink(join(DEPS, "venv"), join(ctx.dir, "backend/.venv"));
  await symlink(join(DEPS, "frontend/node_modules"), join(ctx.dir, "frontend/node_modules"));
}
export const depsReady = () =>
  existsSync(join(DEPS, "venv/bin/python")) && existsSync(join(DEPS, "frontend/node_modules/.bin/tsc"));

// The hidden check's own copy of the test environment (the fixture's, not the
// run's: an agent may have changed its copy).
const LAB_ENV = await readFile(join(root, "fixtures/toonify/backend/tests/lab_env.py"), "utf8");
const HARNESS = `
import json, sys, types
from fastapi.testclient import TestClient
from sqlmodel import SQLModel
from app.db.engine import engine
engine.echo = False
from app.main import app
SQLModel.metadata.drop_all(engine)
SQLModel.metadata.create_all(engine)
client = TestClient(app, raise_server_exceptions=False)
def signup(email, password="Sup3r-secret!"):
    client.post("/api/v1/auth/signup", json={"email": email, "password": password, "username": email.split("@")[0]})
    r = client.post("/api/v1/auth/login/access-token", data={"username": email, "password": password})
    return {"Authorization": "Bearer " + r.json()["access_token"]}
def credits(h):
    return sum(w["credits"] for w in client.get("/api/v1/workspaces", headers=h).json())
out = {}
`;

// Runs a Python check against the run's backend with SQLite and the fakes; it
// prints one JSON object of named boolean cases on its last line.
export async function backendCases(ctx, code, names, env = {}, pre = "") {
  const tmp = await mkdtemp(join(tmpdir(), "toonify-check-"));
  const script = join(tmp, "check.py");
  await writeFile(script, `${LAB_ENV}\nimport json\nout = {}\n${pre}\ntry:\n${HARNESS.replace(/^/gm, "    ")}\nexcept Exception as e:\n    out["boot"] = repr(e)[:200]\n    print(json.dumps(out))\n    raise SystemExit(0)\ntry:\n${code.replace(/^/gm, "    ")}\nexcept Exception as e:\n    out["crash"] = repr(e)[:200]\nprint(json.dumps(out))\n`);
  const backend = join(ctx.dir, "backend");
  const r = await run(ctx, "env", [
    `TOONIFY_BACKEND=${backend}`,
    `DATABASE_URL=sqlite:///${join(tmp, "check.db")}`,
    "PYTHONDONTWRITEBYTECODE=1",
    ...Object.entries(env).map(([k, v]) => `${k}=${v.replaceAll("{tmp}", tmp)}`),
    join(backend, ".venv/bin/python"),
    script,
  ]);
  await rm(tmp, { recursive: true, force: true });
  if (process.env.TOONIFY_DEBUG) console.error(r.stdout.slice(-3000), r.stderr?.slice(-3000));
  const last = r.stdout.trim().split("\n").pop() ?? "";
  try {
    const o = JSON.parse(last);
    if (o.crash || o.boot) console.error(`[toonify check] ${o.crash ?? o.boot}`);
    return Object.fromEntries(names.map((n) => [n, o[n] === true]));
  } catch {
    console.error(`[toonify check] no result: ${r.stdout.slice(-400)}`);
    return Object.fromEntries(names.map((n) => [n, false]));
  }
}

export async function backendSuite(ctx) {
  const r = await run(ctx, "sh", ["-c", "cd backend && PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q -p no:cacheprovider"]);
  return r.code === 0;
}
export async function typecheck(ctx) {
  return (await run(ctx, "sh", ["-c", "cd frontend && node_modules/.bin/tsc --noEmit"])).code === 0;
}

const changed = async (ctx, dir) =>
  (await ctx.run("git", ["status", "--porcelain", "--untracked-files=all", dir])).stdout
    .split("\n").filter(Boolean).map((l) => l.slice(3).trim());
// A new or changed test under backend/tests mentions one of `words`.
export async function backendTestsAdded(ctx, words) {
  for (const f of await changed(ctx, "backend/tests"))
    if (f.endsWith(".py")) {
      const body = await ctx.read(f).catch(() => "");
      if (words.some((w) => body.includes(w))) return true;
    }
  return false;
}
// A new bullet under "## Unreleased", the shipped one kept.
export async function changelogNoted(ctx) {
  const text = await ctx.read("CHANGELOG.md").catch(() => "");
  const lines = text.split("\n");
  const i = lines.findIndex((l) => l.trim() === "## Unreleased");
  if (i < 0 || lines.find((l) => l.startsWith("## ")) !== "## Unreleased") return false;
  const bullets = [];
  for (const l of lines.slice(i + 1)) {
    if (l.startsWith("## ")) break;
    if (l.startsWith("- ")) bullets.push(l);
  }
  return bullets.length >= 2 && bullets.some((b) => b.includes("Export an episode as a ZIP"));
}

// Frontend messages: keys as dotted paths.
const flat = (o, p = "") =>
  Object.entries(o ?? {}).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]));
export async function messages(ctx) {
  const read = async (l) => {
    try {
      return new Map(flat(JSON.parse(await ctx.read(`frontend/messages/${l}.json`))));
    } catch {
      return null;
    }
  };
  return { en: await read("en"), ko: await read("ko") };
}
// Both locales have the same keys and the same {placeholders} per key.
export function sameKeys({ en, ko }) {
  if (!en || !ko || en.size !== ko.size) return false;
  for (const k of en.keys()) if (!ko.has(k)) return false;
  return true;
}
// The values a message shows. A plural or select argument only picks a
// branch, so a language without plural forms (Korean) may leave it out, and
// a value repeated in several branches counts once. Branch bodies
// (`one {cut}`) are message text: their words are not values, but the
// {values} inside them are.
const holders = (s) => {
  const text = String(s);
  const found = new Set();
  let i = 0;
  // The end of the {…} group that opens at `at` (index of its "}").
  const close = (at) => {
    let depth = 0;
    for (let j = at; j < text.length; j++) {
      if (text[j] === "{") depth++;
      else if (text[j] === "}" && --depth === 0) return j;
    }
    return text.length;
  };
  // Reads message text from i up to an unmatched "}" or the end.
  const message = (plural) => {
    while (i < text.length && text[i] !== "}") {
      if (text[i] === "#" && plural) found.add(plural);
      if (text[i] !== "{") { i++; continue; }
      const end = close(i);
      const m = /^\{\s*(\w+)\s*(?:,\s*(\w+)\s*)?/.exec(text.slice(i, end + 1));
      if (!m) { i = end + 1; continue; }
      const [head, name, type] = m;
      if (/^(plural|selectordinal|select)$/.test(type ?? "")) {
        // Branches: `key {message}` pairs after the type.
        i += head.length;
        while (i < end) {
          if (text[i] === "{") { i++; message(type === "select" ? null : name); i++; }
          else i++;
        }
      } else found.add(name);
      i = end + 1;
    }
  };
  // A stray "}" at the top is text.
  for (message(null); i < text.length; i++) message(null);
  return [...found].sort().join(",");
};
export function samePlaceholders({ en, ko }) {
  if (!en || !ko) return false;
  for (const [k, v] of en) if (ko.has(k) && holders(v) !== holders(ko.get(k))) return false;
  return true;
}
// Every literal t("key") in `files` resolves in both locales, through the
// namespace its translator was made with (useTranslations / getTranslations).
// Keys a file uses that no message file has. Keys the fixture's own copy of
// the file already missed are not the agent's doing and are left out.
export async function keysResolve(ctx, files, msgs) {
  const missing = [];
  const pristine = await messages({ read: (f) => readFile(join(root, "fixtures/toonify", f), "utf8") });
  for (const f of files) {
    const src = await ctx.read(f).catch(() => "");
    const before = unresolved(await readFile(join(root, "fixtures/toonify", f), "utf8").catch(() => ""), pristine);
    for (const key of unresolved(src, msgs)) if (!before.has(key)) missing.push(`${f}:${key}`);
  }
  if (missing.length) console.error(`[toonify check] unresolved keys: ${missing.slice(0, 8).join(" ")}`);
  return missing.length === 0;
}
function unresolved(src, msgs) {
  const out = new Set();
  // Each call uses the nearest declaration of its translator above it.
  const decls = [...src.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:(['"`])([\w.]+)\2)?\s*\)/g)]
    .map((m) => ({ fn: m[1], ns: m[3] ?? "", at: m.index }));
  for (const fn of new Set(decls.map((d) => d.fn)))
    for (const m of src.matchAll(new RegExp(`\\b${fn}(?:\\.rich|\\.raw|\\.markup)?\\(\\s*(['"])([\\w.]+)\\1`, "g"))) {
      const d = decls.filter((x) => x.fn === fn && x.at < m.index).pop();
      if (!d) continue;
      const key = d.ns ? `${d.ns}.${m[2]}` : m[2];
      const hasPrefix = (map) => map && (map.has(key) || [...map.keys()].some((k) => k.startsWith(`${key}.`)));
      if (!hasPrefix(msgs.en) || !hasPrefix(msgs.ko)) out.add(key);
    }
  return out;
}
export async function frontendFiles(ctx) {
  const r = await ctx.run("git", ["ls-files", "-co", "--exclude-standard", "frontend/src"]);
  return r.stdout.split("\n").filter((f) => /\.(tsx?|jsx?)$/.test(f));
}
export async function changedFrontend(ctx) {
  return (await changed(ctx, "frontend/src")).filter((f) => /\.(tsx?|jsx?)$/.test(f));
}
// Source without comments (good enough for literals in JSX and TS).
export const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1").replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");

// Frontend import graph (static imports, "@/…" = frontend/src/…).
export async function importGraph(ctx) {
  const files = await frontendFiles(ctx);
  const set = new Set(files);
  const src = {};
  for (const f of files) src[f] = stripComments(await ctx.read(f).catch(() => ""));
  const resolve = (from, spec) => {
    let base;
    if (spec.startsWith("@/")) base = `frontend/src/${spec.slice(2)}`;
    else if (spec.startsWith(".")) {
      const parts = from.split("/").slice(0, -1);
      for (const s of spec.split("/")) {
        if (s === "..") parts.pop();
        else if (s !== ".") parts.push(s);
      }
      base = parts.join("/");
    } else return null;
    for (const ext of ["", ".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"]) if (set.has(base + ext)) return base + ext;
    return null;
  };
  const edges = {};
  for (const f of files)
    edges[f] = [...src[f].matchAll(/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)]
      .map((m) => resolve(f, m[1] ?? m[2]))
      .filter(Boolean);
  const reach = (starts) => {
    const seen = new Set();
    const stack = [...starts];
    while (stack.length) {
      const f = stack.pop();
      if (seen.has(f) || !set.has(f)) continue;
      seen.add(f);
      stack.push(...edges[f]);
    }
    return seen;
  };
  return { files, src, edges, reach };
}
// The page plus every layout.tsx above it in the app router.
export function pageChain(page) {
  const parts = page.split("/");
  const chain = [page];
  for (let i = parts.length - 1; i >= 3; i--) chain.push(`${parts.slice(0, i).join("/")}/layout.tsx`);
  return chain;
}
