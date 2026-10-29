#!/usr/bin/env node
// Lab Daily: the Lab votes like a person after a day of chores. Each model in
// grid.json gets the same small chores in a fresh copy of a fixture project;
// what it did becomes one Smart/Meh/Dumb vote per chore. Not a benchmark: no
// ranking, no difficulty ladder; it shows whether a model got dumber.
//   node --env-file=.env bin/lab-daily.mjs [--apply] [--publish] [--kind tuning]
//     [--agent codex] [--model gpt-6.1-sol] [--task rename] [--keep] [--list]
// Every invocation is one run, named <day>-<HHMM> (UTC), and every run is
// kept: --apply stores its votes in DerpMeter's lab_votes table, --publish
// commits its raw results to results/<run>/ on branch results/<run>, merged
// into main. "daily" runs (launchd) make the weekly series; "tuning" runs
// are difficulty experiments. Default is a dry run. Plan: docs/PLAN.md.
import { existsSync } from "node:fs";
import { appendFile, cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import {
  AGENT_IDS,
  REPORT_SCHEMA,
  VERDICT,
  agentCommand,
  buildGrid,
  capSec,
  changedFiles,
  classifyFailure,
  cliErrors,
  cliVersion,
  GRADER_LIBS,
  graderVersion,
  judge,
  modelId,
  parseReport,
  parseUsage,
  permissionDenials,
  claudeQuota,
  promptFor,
  resultPath,
  sanitize,
  taskVersion,
  wrongModel,
} from "../lib/lab.mjs";
import {
  checkContext,
  cliCpu,
  exec,
  forgetRun,
  othersWorked,
  publishResults,
  readPlan,
  readQuota,
  stopAll,
  supabase,
  sweepAgy,
  walk,
} from "../lib/system.mjs";

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"])
  process.on(signal, () => {
    stopAll();
    process.exit(130);
  });

const args = process.argv.slice(2);
const option = (n) => {
  const i = args.indexOf(n);
  return i < 0 ? undefined : args[i + 1];
};
const list = (n) => option(n)?.split(",").filter(Boolean);
const apply = args.includes("--apply");
const publish = args.includes("--publish");
const keep = args.includes("--keep");
const kind = option("--kind") ?? "daily";
if (!["daily", "tuning"].includes(kind)) throw new Error("--kind is daily or tuning.");
const only = { agent: list("--agent"), model: list("--model"), task: list("--task") };
const log = (...a) => console.log(new Date().toISOString(), ...a);
const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const home = homedir();
const started = new Date();
const runnerCommit = (await exec("git", ["rev-parse", "--short", "HEAD"], { cwd: root })).stdout.trim();
const day = started.toISOString().slice(0, 10);
const stamp = started.toISOString().slice(11, 16).replace(":", "");
const run = `${day}-${stamp}`;
const bins = { claude: process.env.CLAUDE_BIN, codex: process.env.CODEX_BIN, agy: process.env.AGY_BIN };
const BIN = { "claude-code": bins.claude || "claude", codex: bins.codex || "codex", "gemini-cli": bins.agy || "agy" };

// Fixtures, tasks, grid. A chore names its fixture (default pantry); its
// version hashes that fixture and the chore file.
const fixtureFiles = new Map();
const graderLibs = await Promise.all(GRADER_LIBS.map((f) => readFile(join(root, f), "utf8")));
const tasks = [];
for (const name of (await readdir(join(root, "tasks"))).sort()) {
  if (!name.endsWith(".mjs")) continue;
  const file = join(root, "tasks", name);
  const task = (await import(file)).default;
  task.fixture ??= "pantry";
  if (!fixtureFiles.has(task.fixture))
    fixtureFiles.set(task.fixture, await walk(join(root, "fixtures", task.fixture)));
  const source = await readFile(file, "utf8");
  task.version = taskVersion(fixtureFiles.get(task.fixture), source);
  task.grader = graderVersion(graderLibs, source);
  tasks.push(task);
}
const grid = JSON.parse(await readFile(join(root, "grid.json"), "utf8"));
let cells = buildGrid(grid).filter(
  (c) => (!only.agent || only.agent.includes(c.agent)) && (!only.model || only.model.includes(c.model)),
);
// --task picks chores; otherwise the daily set in grid.json (all if none).
const runTasks = tasks.filter((t) =>
  only.task ? only.task.includes(t.id) : !grid.tasks || grid.tasks.includes(t.id),
);

if (args.includes("--list")) {
  for (const c of cells) console.log(c.agent, modelId(c));
  console.log(`${cells.length} cells × ${runTasks.length} tasks = ${cells.length * runTasks.length} runs`);
  for (const t of runTasks) console.log(`task ${t.id} (${t.fixture}) v${t.version} grader ${t.grader} budget ${t.budgetSec}s`);
  process.exit(0);
}

// CLI versions and plans; an agent whose CLI is missing is left out today.
const versions = {};
const plans = {};
for (const agent of AGENT_IDS) {
  if (!cells.some((c) => c.agent === agent)) continue;
  const v = await exec(BIN[agent], ["--version"], { timeoutSec: 30 });
  versions[agent] = v.code === 0 ? cliVersion(v.stdout) : null;
  if (!versions[agent]) {
    log(`${agent}: CLI not available (${BIN[agent]}), skipped`);
    cells = cells.filter((c) => c.agent !== agent);
    continue;
  }
  plans[agent] = await readPlan(agent, bins);
}
// Python chores need Python 3.11+ on PATH (the agents use the same PATH).
if (runTasks.some((t) => t.fixture === "pymd")) {
  const py = await exec("python3", ["-c", "import sys; print(sys.version_info >= (3, 11))"], { timeoutSec: 30 });
  if (py.stdout.trim() !== "True") {
    log("python3 on PATH is older than 3.11: pymd chores skipped");
    for (let i = runTasks.length - 1; i >= 0; i--) if (runTasks[i].fixture === "pymd") runTasks.splice(i, 1);
  }
}
// Antigravity lists the model ids it serves to this account.
if (cells.some((c) => c.agent === "gemini-cli")) {
  const m = await exec(BIN["gemini-cli"], ["models"], { timeoutSec: 60 });
  const served = new Set(m.stdout.split("\n").map((l) => l.split(/\s/)[0]));
  cells = cells.filter((c) => {
    const ok = c.agent !== "gemini-cli" || served.has(modelId(c));
    if (!ok) log(`gemini-cli: ${modelId(c)} not served, skipped`);
    return ok;
  });
}
// The user's own logins are used (decided 2026-10-27). Personal settings are
// switched off by CLI flags where the CLI has them; Antigravity has none and
// reads ~/.gemini/GEMINI.md, which is recorded with every run.
const isolated = {
  "claude-code": true,
  codex: true,
  "gemini-cli": !existsSync(join(home, ".gemini/GEMINI.md")),
};

let db = null;
if (apply) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env).");
  db = supabase(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
log(`run ${run} (${kind}): ${cells.length} cells × ${runTasks.length} chores`);

await sweepAgy();
const scratch = await mkdtemp(join(tmpdir(), "derpmeter-lab-"));
const schemaFile = join(scratch, "report.schema.json");
await writeFile(schemaFile, JSON.stringify(REPORT_SCHEMA));

// The last quota reading per agent: the "before" of its next run.
const lastQuota = {};

async function runOne(cell, task) {
  const dir = await mkdtemp(join(scratch, "run-"));
  await cp(join(root, "fixtures", task.fixture), dir, { recursive: true });
  const git = (...a) => exec("git", ["-c", "user.name=lab", "-c", "user.email=lab@localhost", ...a], { cwd: dir });
  // A chore may change its own copy first (a planted bug, an extra file).
  if (task.setup) await task.setup(checkContext(dir, null));
  await git("init", "-q");
  await git("add", "-A");
  await git("commit", "-qm", "fixture");
  const lastFile = join(scratch, `${relative(scratch, dir)}.last.txt`);
  const logFile = join(scratch, `${relative(scratch, dir)}.agent.log`);
  const cap = capSec(task);
  const [cmd, argv] = agentCommand(cell.agent, {
    model: cell.model,
    effort: cell.effort,
    prompt: promptFor(task),
    schemaFile,
    lastFile,
    logFile,
    capSec: cap,
    bins,
  });
  const before = lastQuota[cell.agent] ?? (lastQuota[cell.agent] = await readQuota(cell.agent, bins));
  const cpuBefore = await cliCpu(cell.agent);
  const res = await exec(cmd, argv, { cwd: dir, timeoutSec: cap + 15 });
  // A CLI that stops itself at the cap (agy --print-timeout) was stuck too.
  if (res.ms >= cap * 1000) res.timedOut = true;
  const cpuAfter = await cliCpu(cell.agent);
  const after =
    cell.agent === "claude-code" ? (claudeQuota(res.stdout) ?? null) : await readQuota(cell.agent, bins);
  if (after) lastQuota[cell.agent] = after;
  const last = existsSync(lastFile) ? await readFile(lastFile, "utf8") : "";
  const agentLog = existsSync(logFile) ? (await readFile(logFile, "utf8")).slice(-20_000) : "";
  const report = parseReport(cell.agent, res.stdout, last);
  const usage = parseUsage(cell.agent, res.stdout);
  const changed = changedFiles((await git("status", "--porcelain", "--untracked-files=all")).stdout);
  const diff = (await git("diff", "--no-color")).stdout + (await git("diff", "--no-color", "--cached")).stdout;
  await git("add", "-A");
  const fullDiff = (await git("diff", "--no-color", "--cached", "HEAD")).stdout;
  // Kept with the raw result so a later grader can classify it again.
  const errors = cliErrors(cell.agent, res.stdout, agentLog, promptFor(task));
  const skipped = wrongModel(cell.agent, agentLog, modelId(cell))
    ? "crash"
    : classifyFailure({ code: res.code, output: errors, report, timedOut: res.timedOut });
  const check = skipped ? { ok: false, why: "" } : await task.check(checkContext(dir, report));
  const vote = judge({ skipped, timedOut: res.timedOut, report, check, changed, task, durationMs: res.ms });
  const quotaOk = before && after && !othersWorked(cpuBefore, cpuAfter);
  const row = {
    run,
    kind,
    day,
    agent: cell.agent,
    model: cell.model,
    effort: cell.effort,
    task: task.id,
    task_version: task.version,
    cli_version: versions[cell.agent],
    plan: plans[cell.agent] ?? "",
    score: vote.score,
    reason: vote.reason,
    skipped: vote.skipped ?? null,
    duration_ms: res.ms,
    tokens_input: usage?.input ?? null,
    tokens_output: usage?.output ?? null,
    tokens_cache_read: usage?.cacheRead ?? null,
    tokens_cache_write: usage?.cacheWrite ?? null,
    tokens_reasoning: usage?.reasoning ?? null,
    quota_5h_before: before?.fiveHour ?? null,
    quota_5h_after: after?.fiveHour ?? null,
    quota_week_before: before?.weekly ?? null,
    quota_week_after: after?.weekly ?? null,
    quota_confidence: before && after ? (quotaOk ? "ok" : "low") : null,
    why: String(sanitize(vote.why, { workspace: dir, home })).slice(0, 300),
    grader: task.grader,
  };
  // Raw result for the repository: no local paths, names or addresses.
  const raw = sanitize(
    {
      ...row,
      verdict: VERDICT[vote.score] ?? null,
      why: vote.why,
      model_id: modelId(cell),
      prompt: promptFor(task),
      report,
      check,
      changed,
      diff: (fullDiff || diff).slice(0, 50_000),
      permission_denials: permissionDenials(cell.agent, res.stdout),
      cli_errors: errors,
      exit: res.code,
      timed_out: res.timedOut,
      isolated: isolated[cell.agent],
      runner_started: started.toISOString(),
      runner_commit: runnerCommit,
    },
    { workspace: dir, home },
  );
  const file = join(root, resultPath(row));
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(raw, null, 2)}\n`);
  if (vote.skipped) log(`  output tail: ${sanitize(res.stdout.slice(-300), { workspace: dir, home }).replace(/\s+/g, " ")}`);
  // --keep is for diagnosis: the copy, the agent log and the agent's own
  // session stay on disk (clean up afterwards with a normal run's sweep).
  if (!keep) {
    await forgetRun(cell.agent, { dir, stdout: res.stdout });
    await rm(dir, { recursive: true, force: true });
  } else log(`  kept: ${dir} (agent log ${logFile})`);
  return { row, vote };
}

const label = { 0: "Smart", 50: "Meh", 100: "Dumb" };
const results = [];
// Agents run side by side; each agent's runs go one at a time, so a quota
// reading covers one run.
await Promise.all(
  [...new Set(cells.map((c) => c.agent))].map(async (agent) => {
    for (const cell of cells.filter((c) => c.agent === agent))
      for (const task of runTasks) {
        const { row, vote } = await runOne(cell, task);
        results.push(row);
        log(
          `${agent} ${modelId(cell)} ${task.id}: ${vote.skipped ? `skipped (${vote.skipped})` : label[vote.score]}` +
            `${vote.reason ? ` ${vote.reason}` : ""} — ${vote.why} (${Math.round(row.duration_ms / 1000)}s, quota ${row.quota_confidence ?? "n/a"})`,
        );
        if (db)
          try {
            await db.upsert(row);
          } catch (e) {
            log(`  store failed: ${e.message}`);
          }
        if (vote.skipped === "rate_limit" || vote.skipped === "auth") {
          log(`${agent}: ${vote.skipped}, stopping this agent for today`);
          return;
        }
      }
  }),
);
if (!keep) {
  await sweepAgy();
  await rm(scratch, { recursive: true, force: true });
}

// Day summary for people reading the repository.
const cellsOut = new Map();
for (const r of results) {
  const k = `${r.agent}|${r.model}|${r.effort}`;
  const c = cellsOut.get(k) ?? { n: 0, sum: 0, skipped: 0 };
  if (r.score === null) c.skipped++;
  else {
    c.n++;
    c.sum += r.score;
  }
  cellsOut.set(k, c);
}
const lines = [
  `# Lab Daily run ${run}`,
  "",
  `Kind: ${kind}. Started ${started.toISOString()}, runner ${runnerCommit}. Score = mean of the Lab's votes (Smart 0, Meh 50, Dumb 100).`,
  "",
  "| Agent | Model | Effort | Score | Votes | Skipped |",
  "| --- | --- | --- | --- | --- | --- |",
];
for (const [k, c] of cellsOut) {
  const [agent, model, effort] = k.split("|");
  const score = c.n ? (c.sum / c.n).toFixed(1) : "—";
  log(`${agent} ${model} ${effort || "default"}: ${score} over ${c.n} votes${c.skipped ? `, ${c.skipped} skipped` : ""}`);
  lines.push(`| ${agent} | ${model} | ${effort || "default"} | ${score} | ${c.n} | ${c.skipped} |`);
}
if (results.length) {
  await mkdir(join(root, "results", run), { recursive: true });
  await writeFile(join(root, "results", run, "README.md"), `${lines.join("\n")}\n`);
}
log(`${results.length} runs${apply ? " stored" : " (dry run, nothing stored)"}`);
if (publish && results.length) log(`results published: ${await publishResults(root, run, log)}`);
