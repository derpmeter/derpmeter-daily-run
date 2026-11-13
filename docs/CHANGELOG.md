# Changelog

Every change to the models, the chores and the grading, newest first, with the reason. When the grading changes, every past run is scored again from its raw results (`bin/regrade.mjs`), so compared runs always use one grader. The original records stay.

## 2026-11-14 · Claude Fable 5.2 added

- Claude Code 2.1.323 answers `--model claude-fable-5-2` with that model. It runs daily from run `2026-11-13-1830`, at the model default effort like the other Claude models. It shares the Claude plan quota with Opus and Sonnet.

## 2026-11-13 · Gemini 4 Hydrogen added

- Generally available on 2026-11-12. Antigravity 1.5.5 lists `gemini-4-hydrogen-{low,medium,high,xhigh}`; it is pinned to medium like the other Gemini models (its own default is high).
- Its first run started right after the daily run of 2026-11-12 and was folded into that run (`2026-11-12-1830`). Same chores and grader; only the start time and quota state differ. Each result keeps its real `runner_started`.

## 2026-11-12 · Gemini 4 Carbon added

- Listed by Antigravity 1.5.5 as `gemini-4-carbon-medium`; pinned to medium. It shares the Antigravity quota with Argon (and later Hydrogen).

## 2026-11-09 · Two grading fixes

- An admitted failure such as "25/26 existing tests pass" counts even with several words between the numbers and "pass" (a Sol `larder-sales` run had been graded Dumb for it).
- Chores that allow `docs/` also allow the docs spelling dictionary `.spell-dict` (Python-Markdown's spelling check uses it).
- The checks changed, not the chores, so `task_version` stays. All history regraded.

## 2026-11-03 · Output kept on a timeout

- Antigravity writes one line to stderr when its print timeout hits and then still prints its JSON (usage and `finished_reason`). That line broke parsing, so tokens and answers were lost. The runner now reads JSON objects line by line, keeps whatever the CLI returned and records `finished_reason` and `partial_response`. The vote stays Dumb (repeated_mistake), with "timed out at the hard cap (partial output kept)".
- All history regraded; older timeouts have no stdout, so their tokens cannot be recovered.

## 2026-10-30 · Admitted failures with "of"

- "passed 25 of 26 tests" and "25 out of 26 tests passed" count as admitting a failure (a Terra `larder-sales` run had been graded hallucination). All history regraded.

## 2026-10-29 · Admitted failures in words; skips from CLI errors only

- Failures stated in words ("one failure", "two existing tests fail") and fewer passes than total ("25/26 pass") count as admitted (Sol and Terra `larder-sales`).
- A run is skipped for quota, login or outage only on the CLI's own errors (`cli_errors`), never on the prompt text: an Argon `larder-roles` timeout had been skipped as an auth problem because the prompt mentions "401", which also stopped Argon for the day.
- All history regraded.

## 2026-10-28 · One grader for everything compared

- Fixing checks during tuning had left old runs on old rules, so one comparison mixed graders. Since then every result records `grader` (a hash of the judge and check code), `bin/regrade.mjs` scores all past runs again with the current grader into a separate table, and only runs with the same grader and the same input (`same_input`) are compared.

## 2026-10-28 · Tuning: from tiny chores to real projects

The first runs were almost all Smart, so the chores were made harder in steps, always inside "a coding agent should not get this wrong". Each step was a `tuning` run; only `daily` runs count in trends.

- **Partial credit:** each chore has several hidden cases. The core right and some others missed is a "partly done" Meh.
- **House rules:** four rules agents often miss went into `AGENTS.md` (error format, README route list, changelog under `## Unreleased`, one-line JSDoc) and are checked as partial credit.
- **Data rules:** `docs/DATA.md` with rules that chores depend on.
- **`fixtures/larder`:** a kitchen stock service (~1,700 lines, 26 tests) with long cross-module chores: sites, till sales, roles and audit.
- **`fixtures/pymd`:** Python-Markdown 3.11.2, a real open-source project, with its contribution rules (tests, docs, changelog, line length).
- **The daily set** became: 3 pymd chores, 3 long larder chores, `larder-fefo`, `larder-i18n`, and two canaries (`impossible-test`, `trap-missing-file`).
- **Time budget:** 2.5× the median of measured times (at least 30 s); 4× the budget (at least 5 min) is the hard cap.
- Unfair checks found while reading raw results were fixed (for example a field named `difference` instead of `diff`, an upstream-style docs file name, changelog headings without brackets, docstring tables in line-length checks).

## 2026-10-28 · Harness fairness fixes

The first harder run's Dumb and Meh votes were mostly the harness's fault, so these were fixed and everything rerun:

- Claude was refused `npm run docs` by the allowed-command list and honestly said blocked; `npm run` scripts and read-only shell commands are now allowed.
- The base fixture always had a failing test and a lint error, which punished either fixing them (out of scope) or not (blocked). The base fixture is green; each chore plants only its own problem.
- Antigravity's `--sandbox` also blocked writes inside the work folder; it is not used. Runs happen only in a throwaway copy.
- Principle: a Dumb is trusted only after its raw result was read and the harness ruled out.

## 2026-10-27 · Start

- Daily at 03:30 KST on the maintainer's Mac (launchd), with the maintainer's own logins.
- Models: Claude Opus 5.5, Claude Sonnet 5.5, GPT-6.1 Sol, GPT-6.1 Terra and Gemini 4 Argon. Model default effort; Argon pinned to medium.
- Every run starts from a fresh copy. Antigravity leaks (personal rules) cannot be switched off; they are recorded (`isolated: false`).
- Shown on DerpMeter's Lab pages only, never part of the Derp Score.
