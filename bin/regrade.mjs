#!/usr/bin/env node
// Scores past runs again with the current grader, from their raw results:
// the run's own inputs (fixture and chore setup at the commit it ran with)
// plus the agent's recorded diff, report and duration, judged by today's
// checks. Nothing is run by a model. Originals stay; regrades go to
// lab_regrades. Inputs that differ from today (task_version) are flagged:
// a regrade makes the scoring the same, not the inputs.
//   node --env-file=.env bin/regrade.mjs [--apply] [--run 2026-10-28-0658] [--task pymd-slug]
import { existsSync, readFileSync } from "node:fs";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GRADER_LIBS, capSec, changedFiles, classifyFailure, graderVersion, inputVersion, judge } from "../lib/lab.mjs";
import { checkContext, exec, walk } from "../lib/system.mjs";

const args = process.argv.slice(2);
const option = (n) => {
  const i = args.indexOf(n);
  return i < 0 ? undefined : args[i + 1];
};
const apply = args.includes("--apply");
const onlyRun = option("--run")?.split(",");
const onlyTask = option("--task")?.split(",");
const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const git = (...a) => exec("git", a, { cwd: root, timeoutSec: 120 });

// Today's chores and graders.
const libs = await Promise.all(GRADER_LIBS.map((f) => readFile(join(root, f), "utf8")));
const current = new Map();
const fixtureFiles = new Map();
for (const name of (await readdir(join(root, "tasks"))).sort()) {
  if (!name.endsWith(".mjs")) continue;
  const source = await readFile(join(root, "tasks", name), "utf8");
  const task = (await import(join(root, "tasks", name))).default;
  task.fixture ??= "pantry";
  if (!fixtureFiles.has(task.fixture)) fixtureFiles.set(task.fixture, await walk(join(root, "fixtures", task.fixture)));
  task.grader = graderVersion(libs, source);
  task.input = inputVersion(fixtureFiles.get(task.fixture), task);
  current.set(task.id, task);
}

// The commit a run used: recorded in newer results; otherwise the code the
// results branch was cut from.
async function commitOf(run, raw) {
  if (raw.runner_commit) return raw.runner_commit;
  const stamp = run.slice(11);
  const day = run.slice(0, 10);
  const r = await git("log", "--all", "--format=%H", "-1", "--grep", `results: run ${run}`, "--grep", `results: ${day} ${stamp}`);
  const c = r.stdout.trim();
  return c ? (await git("rev-parse", `${c}^`)).stdout.trim() : null;
}
const trees = new Map();
async function treeAt(commit) {
  if (!trees.has(commit)) {
    const dir = join(tmpdir(), `derpmeter-regrade-${commit.slice(0, 8)}`);
    if (!existsSync(dir)) await git("worktree", "add", "-q", "--detach", dir, commit);
    trees.set(commit, dir);
  }
  return trees.get(commit);
}

// Raw results hide e-mail addresses as <email> (sanitize), so a diff whose
// context holds one no longer applies. Per file, put back the one address the
// project file has (the larder manager's, in src/jobs/nightly.js).
async function restoreEmails(diff, dir) {
  if (!diff.includes("<email>")) return diff;
  return diff
    .split(/(?=^diff --git )/m)
    .map((part) => {
      const file = part.match(/^diff --git a\/(\S+)/)?.[1];
      const path = file && join(dir, file);
      if (!path || !existsSync(path)) return part;
      const found = [
        ...new Set(readFileSync(path, "utf8").match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? []),
      ];
      return found.length === 1 ? part.split("<email>").join(found[0]) : part;
    })
    .join("");
}

const out = [];
const skipped = [];
for (const run of (await readdir(join(root, "results"))).filter((d) => /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(d)).sort()) {
  if (onlyRun && !onlyRun.includes(run)) continue;
  for (const [file, body] of await walk(join(root, "results", run))) {
    if (!file.endsWith(".json")) continue;
    const raw = JSON.parse(body);
    const task = current.get(raw.task);
    if (onlyTask && !onlyTask.includes(raw.task)) continue;
    if (!task) {
      skipped.push(`${run} ${raw.model} ${raw.task}: chore no longer exists`);
      continue;
    }
    let vote;
    let sameInput = null;
    // Runs since 10-29 keep the CLI's own errors: classify them again. Older
    // runs keep their skip as recorded (a wrong model is always a crash).
    const timedOut = Boolean(raw.timed_out) || raw.duration_ms >= capSec(task) * 1000;
    const skip =
      typeof raw.cli_errors === "string" && raw.skipped !== "crash"
        ? classifyFailure({ code: raw.exit, output: raw.cli_errors, report: raw.report ?? null, timedOut })
        : raw.skipped;
    if (skip) vote = { score: null, reason: null, skipped: skip, why: "not the model" };
    else {
      if (String(raw.diff ?? "").length >= 50_000) {
        skipped.push(`${run} ${raw.model} ${raw.task}: diff was cut at 50k characters`);
        continue;
      }
      const commit = await commitOf(run, raw);
      if (!commit) {
        skipped.push(`${run} ${raw.model} ${raw.task}: runner commit unknown`);
        continue;
      }
      const tree = await treeAt(commit);
      const oldTask = (await import(join(tree, "tasks", `${raw.task}.mjs`))).default;
      sameInput = inputVersion(await walk(join(tree, "fixtures", oldTask.fixture ?? "pantry")), oldTask) === task.input;
      const dir = await mkdtemp(join(tmpdir(), "derpmeter-lab-regrade-"));
      try {
        await cp(join(tree, "fixtures", oldTask.fixture ?? "pantry"), dir, { recursive: true });
        if (oldTask.setup) await oldTask.setup(checkContext(dir, null));
        const g = (...a) => exec("git", ["-c", "user.name=lab", "-c", "user.email=lab@localhost", ...a], { cwd: dir });
        await g("init", "-q");
        await g("add", "-A");
        await g("commit", "-qm", "fixture");
        if (raw.diff) {
          await writeFile(join(dir, ".lab.diff"), await restoreEmails(raw.diff, dir));
          const a = await g("apply", "--whitespace=nowarn", "--exclude=*.pyc", "--exclude=*__pycache__*", ".lab.diff");
          await rm(join(dir, ".lab.diff"));
          if (a.code !== 0) {
            skipped.push(`${run} ${raw.model} ${raw.task}: diff does not apply (${a.stdout.trim().split("\n")[0]})`);
            continue;
          }
        }
        const changed = changedFiles((await g("status", "--porcelain", "--untracked-files=all")).stdout);
        const check = await task.check(checkContext(dir, raw.report ?? null));
        // The CLI answered past the cap (runs since 11-03 keep that).
        const partial =
          timedOut && (raw.tokens_input != null || Boolean(raw.report) || Boolean(raw.finished_reason));
        vote = judge({ skipped: null, timedOut, partial, report: raw.report ?? null, check, changed, task, durationMs: raw.duration_ms });
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    }
    out.push({
      run,
      agent: raw.agent,
      model: raw.model,
      effort: raw.effort ?? "",
      task: raw.task,
      grader: task.grader,
      score: vote.score,
      reason: vote.reason,
      skipped: vote.skipped ?? null,
      why: String(vote.why).slice(0, 300),
      _was: raw.score,
      _sameInput: sameInput !== false,
    });
  }
}
for (const dir of trees.values()) await git("worktree", "remove", "--force", dir);

const word = (s) => (s === null || s === undefined ? "skip" : s === 0 ? "S" : s === 50 ? "M" : "D");
for (const r of out)
  console.log(`${r.run} ${r.model.padEnd(18)} ${r.task.padEnd(20)} ${word(r._was)} → ${word(r.score)}${r._was === r.score ? "" : "  *"}${r._sameInput ? "" : "  (older inputs)"}  ${r.score === 0 ? "" : r.why}`);
for (const s of skipped) console.log(`not regraded: ${s}`);
console.log(`${out.length} regraded, ${out.filter((r) => r._was !== r.score).length} changed, ${skipped.length} not regradable`);

if (apply && out.length) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env).");
  const rows = out.map(({ _was, _sameInput, ...r }) => ({ ...r, same_input: _sameInput }));
  const res = await fetch(`${url}/rest/v1/lab_regrades?on_conflict=run,agent,model,effort,task,grader`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  console.log(res.ok ? `stored ${rows.length} regrades` : `store failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
