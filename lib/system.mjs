// Lab Daily: everything that touches the machine — processes, CLI quota and
// plan readers, per-run cleanup, Supabase (REST, no dependencies) and the
// daily results branch.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join, relative } from "node:path";
import { agyQuota, claudeQuota, codexQuota } from "./lab.mjs";

// Children run in their own process groups; stopAll ends them when the
// runner itself is stopped, so no agent keeps working after it.
const running = new Set();
export function stopAll() {
  for (const pid of running)
    try {
      process.kill(-pid, "SIGKILL");
    } catch {}
}
export const ownGroups = () => new Set(running);

// Runs a command; output is capped, the process group is killed at the time limit.
export function exec(cmd, argv, { cwd, env, timeoutSec = 60, input } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    let out = "";
    let timedOut = false;
    const full = { ...process.env, ...env };
    // A nested `node --test` would report to an outer test runner instead of failing.
    delete full.NODE_TEST_CONTEXT;
    const child = spawn(cmd, argv, { cwd, env: full, detached: true });
    if (child.pid) running.add(child.pid);
    const keepTail = (d) => {
      out += d;
      if (out.length > 4_000_000) out = out.slice(-2_000_000);
    };
    child.stdout.on("data", keepTail);
    child.stderr.on("data", keepTail);
    child.stdin.end(input);
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {}
    }, timeoutSec * 1000);
    const done = (code) => {
      clearTimeout(timer);
      running.delete(child.pid);
      resolve({ code, stdout: out, timedOut, ms: Date.now() - started });
    };
    child.on("error", (e) => done(`${e.code || "spawn"}`));
    child.on("close", (code) => done(code ?? -1));
  });
}

export async function walk(dir, base = dir) {
  const files = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p, base)));
    else files.push([relative(base, p), await readFile(p, "utf8")]);
  }
  return files;
}

// What a task's check may use, all inside the run's copy of the fixture.
export function checkContext(dir, report) {
  return {
    dir,
    report,
    run: (c, a) => exec(c, a, { cwd: dir, timeoutSec: 60 }),
    node: (code) =>
      exec(process.execPath, ["--input-type=module", "-e", code], {
        cwd: dir,
        timeoutSec: 30,
      }),
    read: (p) => readFile(join(dir, p), "utf8"),
    write: (p, body) => writeFile(join(dir, p), body),
    exists: async (p) => existsSync(join(dir, p)),
    grep: async (word, dirs) => {
      const hits = [];
      for (const d of dirs)
        for (const [p, body] of existsSync(join(dir, d))
          ? await walk(join(dir, d), dir)
          : [])
          if (body.includes(word)) hits.push(p);
      return hits;
    },
  };
}

const parseJson = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

// Codex app-server: one JSON-RPC call, no model use.
async function codexRpc(bin, method) {
  return new Promise((resolve) => {
    const child = spawn(bin, ["app-server"], { stdio: ["pipe", "pipe", "ignore"] });
    let buf = "";
    const timer = setTimeout(() => finish(null), 30_000);
    const finish = (v) => {
      clearTimeout(timer);
      child.kill("SIGKILL");
      resolve(v);
    };
    child.stdout.on("data", (d) => {
      buf += d;
      for (const line of buf.split("\n").slice(0, -1)) {
        const o = parseJson(line);
        if (o?.id === 2) finish(o.result ?? null);
      }
      buf = buf.split("\n").pop();
    });
    child.on("error", () => finish(null));
    const send = (o) => child.stdin.write(`${JSON.stringify(o)}\n`);
    send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { clientInfo: { name: "derpmeter-lab", version: "1.0.0" } } });
    send({ jsonrpc: "2.0", method: "initialized", params: {} });
    send({ jsonrpc: "2.0", id: 2, method, params: {} });
  });
}

// The subscription plan each CLI reports ("" when it does not say).
export async function readPlan(agent, bins) {
  if (agent === "claude-code") {
    const r = await exec(bins.claude || "claude", ["auth", "status"], { timeoutSec: 30 });
    return String(parseJson(r.stdout.trim())?.subscriptionType ?? "").slice(0, 40);
  }
  if (agent === "codex") {
    const r = await codexRpc(bins.codex || "codex", "account/read");
    return String(r?.account?.planType ?? "").slice(0, 40);
  }
  return "";
}

// Quota "percent used" now, read without a model call where the CLI allows.
// Claude has no such call: its reading comes from each run's own stream
// (claudeQuota), and from one tiny Haiku call before the day's first run.
export async function readQuota(agent, bins) {
  if (agent === "codex")
    return codexQuota(await codexRpc(bins.codex || "codex", "account/rateLimits/read"));
  if (agent === "gemini-cli") {
    const dir = await mkdtemp(join(tmpdir(), "derpmeter-lab-q-"));
    const r = await exec(bins.agy || "agy", ["-p", "/usage", "--output-format", "json", "--print-timeout", "60s"], { cwd: dir, timeoutSec: 90 });
    await rm(dir, { recursive: true, force: true });
    return agyQuota(r.stdout);
  }
  const dir = await mkdtemp(join(tmpdir(), "derpmeter-lab-q-"));
  const r = await exec(
    bins.claude || "claude",
    ["-p", "Reply with: ok", "--model", "claude-haiku-5-5", "--output-format", "stream-json", "--verbose", "--setting-sources", "project", "--strict-mcp-config", "--no-session-persistence", "--tools", ""],
    { cwd: dir, timeoutSec: 90 },
  );
  await rm(dir, { recursive: true, force: true });
  await forgetClaudeProject(dir);
  return claudeQuota(r.stdout);
}

// CPU seconds of every other process of the same CLI (not the Lab's own
// runs). If any of them worked during a run, that run's quota reading also
// counts someone else's use and is marked low confidence.
const CLI_PATTERN = {
  "claude-code": /(^|\/)claude(\s|$)/,
  codex: /(^|\/)codex(\s|$)|CodexCLI/,
  "gemini-cli": /(^|\/)agy(\s|$)/,
};
// ps TIME: [days-][hours:]minutes:seconds[.hundredths]
export function cpuSeconds(t) {
  const [d, rest] = t.includes("-") ? t.split("-") : ["0", t];
  const parts = rest.split(":").map(Number);
  const secs = parts.reduce((s, x) => s * 60 + x, 0);
  return Number(d) * 86400 + secs;
}
export async function cliCpu(agent) {
  const r = await exec("ps", ["-A", "-o", "pid=,pgid=,time=,args="], { timeoutSec: 10 });
  const mine = ownGroups();
  const out = new Map();
  for (const line of r.stdout.split("\n")) {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/);
    if (!m || mine.has(Number(m[2])) || Number(m[1]) === process.pid) continue;
    if (CLI_PATTERN[agent].test(m[4])) out.set(m[1], cpuSeconds(m[3]));
  }
  return out;
}
export function othersWorked(before, after, thresholdSec = 2) {
  for (const [pid, t] of after) if (t - (before.get(pid) ?? 0) > thresholdSec) return true;
  return false;
}

// Reset: nothing a run leaves behind may reach a later run.
const claudeProjectDir = (dir) =>
  join(homedir(), ".claude/projects", dir.replace(/[^A-Za-z0-9]/g, "-"));
async function forgetClaudeProject(dir) {
  for (const d of [dir, dir.replace(/^\/private/, ""), `/private${dir}`])
    await rm(claudeProjectDir(d), { recursive: true, force: true });
}
const AGY = join(homedir(), ".gemini/antigravity-cli");
async function forgetAgyConversation(id) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  for (const p of [
    `conversations/${id}.db`,
    `conversations/${id}.db-wal`,
    `conversations/${id}.db-shm`,
    `brain/${id}`,
    `annotations/${id}.pbtxt`,
    `presence/${id}.lock`,
    `implicit/${id}.pb`,
  ])
    await rm(join(AGY, p), { recursive: true, force: true });
  if (existsSync(join(AGY, "conversation_summaries.db")))
    await exec("sqlite3", [join(AGY, "conversation_summaries.db"), `delete from conversation_summaries where conversation_id='${id}'`], { timeoutSec: 30 });
}
// Antigravity keeps a second copy of the summaries (a protobuf of repeated
// field 1, one record per conversation) and rebuilds the table from it on
// start. Records that name a Lab copy are dropped; the rest is kept byte for
// byte. A backup of the first version is kept next to it.
function varint(b, i) {
  let r = 0;
  let s = 0;
  for (;;) {
    const c = b[i++];
    r += (c & 0x7f) * 2 ** s;
    s += 7;
    if (c < 0x80) return [r, i];
  }
}
export function dropRecords(buf, marker) {
  const keep = [];
  let i = 0;
  let dropped = 0;
  while (i < buf.length) {
    const start = i;
    const [key, a] = varint(buf, i);
    if ((key & 7) !== 2) return null; // not the layout we know: leave it alone
    const [len, b] = varint(buf, a);
    i = b + len;
    if (i > buf.length) return null;
    if (buf.subarray(b, i).includes(marker)) dropped++;
    else keep.push(buf.subarray(start, i));
  }
  return { buf: Buffer.concat(keep), dropped };
}
async function pruneAgySummaries(prefix) {
  const file = join(AGY, "jetbox_summaries_proto.pb");
  if (!existsSync(file)) return;
  const buf = await readFile(file);
  const out = dropRecords(buf, Buffer.from(prefix));
  if (!out || !out.dropped) return;
  if (!existsSync(`${file}.lab-backup`)) await writeFile(`${file}.lab-backup`, buf);
  await writeFile(`${file}.tmp`, out.buf);
  await rename(`${file}.tmp`, file);
}
// Antigravity: every conversation whose workspace is a Lab copy, plus the
// recent-workspace entries for those copies.
export async function sweepAgy(prefix = "derpmeter-lab-") {
  await pruneAgySummaries(prefix);
  const db = join(AGY, "conversation_summaries.db");
  if (existsSync(db)) {
    const r = await exec("sqlite3", [db, `select conversation_id from conversation_summaries where workspace_uris like '%${prefix}%'`], { timeoutSec: 30 });
    for (const id of r.stdout.split("\n").map((s) => s.trim()).filter(Boolean)) await forgetAgyConversation(id);
  }
  const last = join(AGY, "cache/last_conversations.json");
  const list = existsSync(last) ? parseJson(await readFile(last, "utf8")) : null;
  if (list && typeof list === "object") {
    const keep = Object.fromEntries(Object.entries(list).filter(([k]) => !k.includes(prefix)));
    if (Object.keys(keep).length !== Object.keys(list).length) await writeFile(last, JSON.stringify(keep, null, 2));
  }
}
export async function forgetRun(agent, { dir, stdout }) {
  if (agent === "claude-code") await forgetClaudeProject(dir);
  if (agent === "gemini-cli") {
    const id = parseJson(String(stdout).trim())?.conversation_id;
    if (id) await forgetAgyConversation(id);
  }
}

// Supabase over REST (service role).
export function supabase(url, key) {
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  return {
    async select(query) {
      const r = await fetch(`${url}/rest/v1/lab_votes?${query}`, { headers });
      if (!r.ok) throw new Error(`lab_votes select ${r.status}: ${(await r.text()).slice(0, 200)}`);
      return r.json();
    },
    async upsert(row) {
      const r = await fetch(`${url}/rest/v1/lab_votes?on_conflict=day,agent,model,effort,task`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(row),
      });
      if (!r.ok) throw new Error(`lab_votes upsert ${r.status}: ${(await r.text()).slice(0, 200)}`);
    },
  };
}

// Raw results: one branch per run (results/<day>-<HHMM>), merged into main.
export async function publishResults(root, day, stamp, log) {
  const git = (...a) => exec("git", a, { cwd: root, timeoutSec: 120 });
  const branch = `results/${day}-${stamp}`;
  const steps = [
    ["checkout", "-q", "main"],
    ["pull", "-q", "--ff-only", "origin", "main"],
    ["checkout", "-q", "-b", branch],
    ["add", `results/${day}`],
    ["commit", "-q", "-m", `results: ${day} ${stamp} UTC`],
    ["push", "-q", "-u", "origin", branch],
    ["checkout", "-q", "main"],
    ["merge", "-q", "--no-ff", branch, "-m", `Merge ${branch}`],
    ["push", "-q", "origin", "main"],
  ];
  for (const s of steps) {
    const r = await git(...s);
    if (r.code !== 0) {
      log(`git ${s.join(" ")} failed: ${r.stdout.slice(-300)}`);
      await git("checkout", "-q", "main");
      return false;
    }
  }
  return true;
}
