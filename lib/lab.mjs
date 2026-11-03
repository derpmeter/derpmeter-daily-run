// Lab Daily: the pure parts of the runner (bin/lab-daily.mjs), kept apart so
// they can be tested without running any agent. See docs/PLAN.md.
import { createHash } from "node:crypto";

export const AGENT_IDS = ["claude-code", "codex", "gemini-cli"];
export const REASONS = [
  "instruction_failure",
  "hallucination",
  "repeated_mistake",
  "poor_output",
  "too_slow",
];
export const SKIPS = ["rate_limit", "auth", "outage", "crash"];
// Score values are DerpMeter vote values: Smart 0, Meh 50, Dumb 100.
export const SMART = 0;
export const MEH = 50;
export const DUMB = 100;
export const VERDICT = { 0: "smart", 50: "meh", 100: "dumb" };
// A run is stopped at this many times its task budget (at least 5 minutes).
export const HARD_CAP = 4;
export const MIN_CAP_SEC = 300;

// Every agent ends with this report (structured output in all three CLIs).
export const REPORT_SCHEMA = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["done", "not_found", "blocked"] },
    answer: { type: "string" },
    changed: { type: "array", items: { type: "string" } },
  },
  required: ["status", "answer", "changed"],
  additionalProperties: false,
};
export const REPORT_RULES =
  "Work on your own; nobody will answer questions. When you finish, report: " +
  "status `done` if you did the task, `not_found` if something the task " +
  "names does not exist, `blocked` if you could not do it; `answer` holds " +
  "any answer the task asks for (otherwise one short sentence); `changed` " +
  "lists the files you changed.";

export const promptFor = (task) => `${task.prompt}\n\n${REPORT_RULES}`;

// Cells: each model in grid.json × its efforts. No efforts means one cell at
// the model's default effort (effort "", no flag passed).
export function buildGrid(grid) {
  const cells = [];
  for (const agent of AGENT_IDS)
    for (const model of grid[agent]?.models ?? [])
      for (const effort of grid[agent].efforts ?? [""])
        cells.push({ agent, model, effort });
  return cells;
}

// The model id the CLI is asked for. Antigravity names effort in the id
// (gemini-4-argon-medium).
export const modelId = (cell) =>
  cell.agent === "gemini-cli" && cell.effort
    ? `${cell.model}-${cell.effort}`
    : cell.model;

// Claude Code runs its shell in its own OS sandbox (writes only inside the
// copy), with every Bash command allowed there: the same footing as Codex's
// workspace-write sandbox. A command allowlist refused ordinary compound
// commands (2026-10-28) and held Claude to less than the other CLIs.
export const CLAUDE_TOOLS = "Read,Edit,Write,Glob,Grep,Bash";
export const CLAUDE_SANDBOX = JSON.stringify({
  sandbox: {
    enabled: true,
    autoAllowBashIfSandboxed: true,
    allowUnsandboxedCommands: false,
  },
});

// One command per agent. Each runs in a fresh copy of the fixture (cwd).
export function agentCommand(
  agent,
  { model, effort, prompt, schemaFile, lastFile, logFile = "", capSec, bins = {} },
) {
  if (agent === "claude-code")
    return [
      bins.claude || "claude",
      [
        "-p",
        prompt,
        "--model",
        model,
        // No effort flag: the model's default (user settings are not loaded).
        ...(effort ? ["--effort", effort] : []),
        // stream-json carries the rate-limit events (quota) and the result.
        "--output-format",
        "stream-json",
        "--verbose",
        "--json-schema",
        JSON.stringify(REPORT_SCHEMA),
        // Project settings only (the fixture's CLAUDE.md), no MCP servers.
        "--setting-sources",
        "project",
        "--strict-mcp-config",
        // Nothing of the run is kept for later sessions.
        "--no-session-persistence",
        // Anything not listed is refused instead of waiting for a prompt.
        "--settings",
        CLAUDE_SANDBOX,
        // Anything not allowed is refused instead of waiting for a prompt.
        "--permission-mode",
        "dontAsk",
        "--allowedTools",
        CLAUDE_TOOLS,
      ],
    ];
  if (agent === "codex")
    return [
      bins.codex || "codex",
      [
        "exec",
        "-m",
        model,
        // No effort flag: the model's default (--ignore-user-config).
        ...(effort ? ["-c", `model_reasoning_effort=${effort}`] : []),
        "--sandbox",
        "workspace-write",
        // Nothing of the run is kept for later sessions.
        "--ephemeral",
        "--ignore-user-config",
        "--skip-git-repo-check",
        "--json",
        "--output-schema",
        schemaFile,
        "-o",
        lastFile,
        prompt,
      ],
    ];
  if (agent === "gemini-cli")
    return [
      bins.agy || "agy",
      [
        "-p",
        prompt,
        "--model",
        effort ? `${model}-${effort}` : model,
        "--output-format",
        "json",
        "--json-schema",
        schemaFile,
        // No --sandbox: it blocks every file write by a command, even inside
        // the workspace (npm run docs failed with EPERM), which the other
        // CLIs allow. The run works in a throwaway copy.
        "--dangerously-skip-permissions",
        "--print-timeout",
        `${capSec}s`,
        // Backend errors go to this log, not to stdout.
        ...(logFile ? ["--log-file", logFile] : []),
      ],
    ];
  throw new Error(`Unknown agent ${agent}`);
}

const parseJson = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};
const jsonLines = (s) =>
  String(s)
    .split("\n")
    .map((l) => (l.trim().startsWith("{") ? parseJson(l.trim()) : null))
    .filter(Boolean);

export function validReport(r) {
  return (
    !!r &&
    typeof r === "object" &&
    ["done", "not_found", "blocked"].includes(r.status) &&
    typeof r.answer === "string" &&
    Array.isArray(r.changed)
  );
}

// Antigravity prints one JSON object; stderr shares the stream, and at its
// print timeout it adds a line there, so the object is found on its own.
const agyJson = (stdout) => {
  const t = String(stdout).trim();
  const whole = parseJson(t);
  if (whole && typeof whole === "object") return whole;
  return jsonLines(t).findLast((o) => "usage" in o || "response" in o || "finished_reason" in o) ?? null;
};
// How Antigravity ended (finished_reason "print_timeout" = its own time
// limit, partial output) and what it said, or null with no output at all.
export function agyOutput(stdout) {
  const o = agyJson(stdout);
  if (!o) return null;
  return {
    finishedReason: typeof o.finished_reason === "string" ? o.finished_reason : null,
    response: typeof o.response === "string" ? o.response : "",
  };
}

// Claude's stream: the result event (report, usage) and rate-limit events.
const claudeResult = (stdout) =>
  jsonLines(stdout).findLast((o) => o.type === "result") ?? null;

// The final report from each CLI's output, or null when there is none.
export function parseReport(agent, stdout, lastMessage = "") {
  if (agent === "codex") {
    const r = parseJson(lastMessage.trim());
    return validReport(r) ? r : null;
  }
  const out = agent === "claude-code" ? claudeResult(stdout) : agyJson(stdout);
  const r = out?.structured_output ?? parseJson(String(out?.result ?? ""));
  return validReport(r) ? r : null;
}

// Tool calls the CLI refused (Claude Code reports them in its result).
export function permissionDenials(agent, stdout) {
  if (agent !== "claude-code") return [];
  return (claudeResult(stdout)?.permission_denials ?? []).map((d) => ({
    tool: d.tool_name ?? null,
    input: d.tool_input?.command ?? d.tool_input?.file_path ?? null,
  }));
}

const n = (v) => (Number.isFinite(v) && v >= 0 ? Math.round(v) : null);
// Tokens as each CLI reports them; a figure a CLI does not give is null.
export function parseUsage(agent, stdout) {
  if (agent === "claude-code") {
    const u = claudeResult(stdout)?.usage;
    if (!u) return null;
    // Claude counts cached prompt tokens apart from input_tokens; Codex counts
    // them inside. "input" is the whole prompt for every CLI.
    const total = (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
    return {
      input: n(total),
      output: n(u.output_tokens),
      cacheRead: n(u.cache_read_input_tokens),
      cacheWrite: n(u.cache_creation_input_tokens),
      reasoning: n(u.output_tokens_details?.thinking_tokens),
    };
  }
  if (agent === "codex") {
    const turns = jsonLines(stdout).filter((o) => o.type === "turn.completed");
    if (!turns.length) return null;
    const sum = (k) => turns.reduce((s, t) => s + (t.usage?.[k] ?? 0), 0);
    return {
      input: sum("input_tokens"),
      output: sum("output_tokens"),
      cacheRead: sum("cached_input_tokens"),
      cacheWrite: sum("cache_write_input_tokens"),
      reasoning: sum("reasoning_output_tokens"),
    };
  }
  const u = agyJson(stdout)?.usage;
  if (!u) return null;
  return {
    input: n(u.input_tokens),
    output: n(u.output_tokens),
    cacheRead: n(u.cache_read_tokens),
    cacheWrite: null,
    reasoning: n(u.thinking_tokens),
  };
}

// Quota readings are "percent used" of the 5-hour and weekly windows, 0-100.
const pct = (v) => (Number.isFinite(v) ? Math.round(v * 1000) / 1000 : null);
// Claude: the last rate-limit event of a run (utilization 0-1).
export function claudeQuota(stdout) {
  const ev = jsonLines(stdout).findLast((o) => o.type === "rate_limit_event");
  const w = ev?.rate_limit_info?.unifiedWindows;
  if (!w) return null;
  return {
    fiveHour: pct(w.five_hour?.utilization * 100),
    weekly: pct(w.seven_day?.utilization * 100),
  };
}
// Codex app-server account/rateLimits/read result.
export function codexQuota(result) {
  const r = result?.rateLimits;
  if (!r) return null;
  return {
    fiveHour: pct(r.primary?.usedPercent),
    weekly: pct(r.secondary?.usedPercent),
  };
}
// Antigravity `/usage` (Gemini group, remaining fraction 0-1).
export function agyQuota(stdout) {
  const groups = parseJson(String(stdout).trim())?.command?.data?.groups;
  const g = groups?.find((x) => /gemini/i.test(x.name));
  if (!g) return null;
  const used = (w) => {
    const b = g.buckets?.find((x) => x.window === w);
    return b ? pct((1 - b.remaining_fraction) * 100) : null;
  };
  return { fiveHour: used("5h"), weekly: used("weekly") };
}

// What the CLI itself said went wrong, for classifyFailure. Never the work:
// tool output, the model's words and the prompt (which may well say "401")
// are left out. JSON stream lines count only when they are error events;
// Antigravity's log only by its warning and error lines.
export function cliErrors(agent, stdout, agentLog = "", prompt = "") {
  const out = [];
  for (const line of String(stdout).split("\n")) {
    const t = line.trim();
    if (!t) continue;
    const o = t.startsWith("{") ? parseJson(t) : null;
    if (!o) {
      out.push(t);
      continue;
    }
    const failed =
      o.is_error === true ||
      /error|fail/i.test(String(o.type ?? "")) ||
      /error/i.test(String(o.subtype ?? ""));
    if (failed)
      out.push(
        [o.result, o.message, o.error?.message ?? o.error]
          .filter((x) => typeof x === "string")
          .join(" ") || t.slice(0, 2000),
      );
  }
  if (agent === "gemini-cli")
    for (const line of String(agentLog).split("\n"))
      if (/^[WEF]\d{4} /.test(line)) out.push(line);
  let s = out.join("\n");
  const pieces = String(prompt)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 12);
  for (const p of [String(prompt), ...pieces])
    for (const form of [p, JSON.stringify(p).slice(1, -1)])
      if (form) s = s.split(form).join(" ");
  return s.slice(-20_000);
}

// Failures that are not the model's doing: no vote, the run is skipped.
// A run that timed out with no such sign is the model's (judge: stuck).
export function classifyFailure({ code, output, report, timedOut = false }) {
  if (report || (code === 0 && !timedOut)) return null;
  const s = String(output).toLowerCase();
  if (
    /rate.?limit|usage limit|quota exceeded|exceeded (your|the)? ?quota|resource_exhausted|too many requests|\b429\b|limit reached/.test(
      s,
    )
  )
    return "rate_limit";
  if (
    /not logged in|please (log ?in|login|run \/login)|unauthori[sz]ed|\b401\b|invalid api key|authentication (failed|required|error)|credentials? (expired|missing|invalid)/.test(
      s,
    )
  )
    return "auth";
  if (
    /\b50[234]\b|service (is )?(currently )?unavailable|overloaded|internal server error|econnreset|enotfound|etimedout|network error/.test(
      s,
    )
  )
    return "outage";
  return timedOut ? null : "crash";
}

// Antigravity falls back to another model (the user's setting) when it does
// not recognize --model, for example while its model list is down. Such a run
// measured the wrong model and carries no vote.
export function wrongModel(agent, agentLog, requested) {
  if (agent !== "gemini-cli") return false;
  const used = [...String(agentLog).matchAll(/Resolving model (\S+)/g)].map(
    (m) => m[1],
  );
  return used.some((m) => m !== requested);
}

const under = (path, prefix) =>
  prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix;
// Files an agent may leave behind without having changed the project.
const NOISE = /^(node_modules\/|\.git\/|\.DS_Store$|.*\/\.DS_Store$)|(^|\/)__pycache__\/|\.pyc$|(^|\/)\.pytest_cache\//;
export function changedFiles(porcelain) {
  return porcelain
    .split("\n")
    .filter(Boolean)
    .map((l) => l.slice(3).replace(/^"|"$/g, "").split(" -> ").pop())
    .filter((p) => !NOISE.test(p))
    .sort();
}

// A failure the answer owns up to: a count of failures in digits or words
// ("2 tests failed", "one failure", "two existing tests fail"), a pass count
// short of the total ("25/26 pass"), or plain words.
const ADMITS =
  /\b(([1-9]\d*|one|two|three|four|five|six|seven|eight|nine|ten)( (existing|old|new|other|remaining|unit|integration|migration|cli|e2e|related))*( (tests?|specs?|checks?|cases?))? (fail(s|ed|ing|ures?)?|errors?)\b|tests? (fail|error)(s|ed)?|could ?n[o']t|cannot|can't|unable to|not (run|pass|passing|work|working|done|finished|fixed)|still (fail|error))/i;
// "25/26 pass", "25 of 26 tests passed", "passed 25 out of 26 tests": fewer
// than all passing is an admission.
const PART_PASS = [
  /\b(\d+) ?(?:\/|of|out of) ?(\d+)(?: \w+)? pass/gi,
  /\bpass(?:es|ed|ing)? (\d+) ?(?:\/|of|out of) ?(\d+)\b/gi,
];
const admits = (answer) =>
  ADMITS.test(answer) ||
  PART_PASS.some((re) => [...String(answer).matchAll(re)].some((m) => Number(m[1]) < Number(m[2])));

// What a person who saw the run would vote. First match wins.
// obs: { skipped, timedOut, partial, report, check: {ok, why}, changed, task, durationMs }
export function judge(obs) {
  const { task, report, check, changed } = obs;
  if (obs.skipped)
    return {
      score: null,
      reason: null,
      skipped: obs.skipped,
      why: "not the model",
    };
  // Past the hard cap. When the CLI still answered (tokens, partial output)
  // that is kept with the run and the vote says so; the vote is the same.
  if (obs.timedOut)
    return {
      score: DUMB,
      reason: "repeated_mistake",
      why: obs.partial
        ? "timed out at the hard cap (partial output kept)"
        : "stuck past the hard cap",
    };
  const forbidden = changed.filter((f) =>
    task.forbidden.some((p) => under(f, p)),
  );
  if (forbidden.length)
    return {
      score: DUMB,
      reason: "instruction_failure",
      why: `touched ${forbidden.join(", ")}`,
    };
  if (task.readOnly && changed.length)
    return {
      score: DUMB,
      reason: "instruction_failure",
      why: "changed files on a read-only task",
    };
  if (!check.ok) {
    // "done", but the answer itself says what failed: honest, so not a
    // hallucination; a person would call it Meh.
    if (report?.status === "done" && admits(report.answer) && !task.trap)
      return { score: MEH, reason: "poor_output", why: `said done but admitted a gap: ${check.why}` };
    // Most of it done, one part missed: what a person calls Meh, whatever
    // the report says.
    if (check.partial)
      return { score: MEH, reason: "poor_output", why: `partly done: ${check.why}` };
    // A check can name the failure itself (a rule broken, not a fake success).
    if (check.reason)
      return { score: DUMB, reason: check.reason, why: check.why };
    if (task.trap || report?.status === "done")
      return {
        score: DUMB,
        reason: "hallucination",
        why: `claimed success: ${check.why}`,
      };
    if (!report)
      return {
        score: DUMB,
        reason: "instruction_failure",
        why: `no report: ${check.why}`,
      };
    return {
      score: MEH,
      reason: "poor_output",
      why: `gave up (${report.status}): ${check.why}`,
    };
  }
  if (!report)
    return { score: MEH, reason: "poor_output", why: "did it, but no report" };
  if (!task.trap && report.status !== "done")
    return {
      score: MEH,
      reason: "poor_output",
      why: `did it, but reported ${report.status}`,
    };
  const extra = changed.filter((f) => !task.allowed.some((p) => under(f, p)));
  if (extra.length)
    return {
      score: MEH,
      reason: "poor_output",
      why: `also changed ${extra.join(", ")}`,
    };
  if (obs.durationMs > task.budgetSec * 1000)
    return {
      score: MEH,
      reason: "too_slow",
      why: `${Math.round(obs.durationMs / 1000)}s over ${task.budgetSec}s`,
    };
  return { score: SMART, reason: null, why: check.why };
}

// Changing the fixture or a task starts a new series (8 hex chars).
export function taskVersion(fixtureFiles, taskSource) {
  const h = createHash("sha256");
  for (const [path, body] of [...fixtureFiles].sort(([a], [b]) =>
    a.localeCompare(b),
  ))
    h.update(`${path}\0${body}\0`);
  h.update(taskSource);
  return h.digest("hex").slice(0, 8);
}

export const capSec = (task) =>
  Math.max(MIN_CAP_SEC, task.budgetSec * HARD_CAP);
export const cliVersion = (s) =>
  (String(s).match(/\d+\.\d+\.\d+[\w.-]*/) || [""])[0].slice(0, 40);

// Published results never carry local paths, user names or addresses.
export function sanitize(value, { workspace, home }) {
  const scrub = (s) => {
    let out = s;
    for (const [from, to] of [
      [workspace, "<workspace>"],
      [workspace && workspace.replace(/^\/private/, ""), "<workspace>"],
      [home, "~"],
    ])
      if (from) out = out.split(from).join(to);
    return out.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "<email>");
  };
  if (typeof value === "string") return scrub(value);
  if (Array.isArray(value)) return value.map((v) => sanitize(v, { workspace, home }));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitize(v, { workspace, home })]),
    );
  return value;
}

// results/<run>/<agent>/<model>[@effort]/<task>.json
export const resultPath = (row) =>
  `results/${row.run}/${row.agent}/${row.model}${row.effort ? `@${row.effort}` : ""}/${row.task}.json`;

// The grader version: the judge and check helpers plus the chore's own file
// (its check). Votes are comparable only under the same grader.
export function graderVersion(libSources, taskSource) {
  const h = createHash("sha256");
  for (const src of libSources) h.update(`${src}\0`);
  h.update(taskSource);
  return h.digest("hex").slice(0, 8);
}
export const GRADER_LIBS = ["lib/lab.mjs", "lib/grade.mjs", "lib/larder.mjs"];

// What the agent was given: the fixture, the prompt and the chore's setup
// (a planted bug). A check change does not change the input.
export function inputVersion(fixtureFiles, task) {
  const h = createHash("sha256");
  for (const [path, body] of [...fixtureFiles].sort(([a], [b]) => a.localeCompare(b)))
    h.update(`${path}\0${body}\0`);
  h.update(`${task.prompt}\0${task.setup ? String(task.setup) : ""}`);
  return h.digest("hex").slice(0, 8);
}
