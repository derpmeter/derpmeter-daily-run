# Changelog

Every change to the models, the chores and the grading, newest first, with the reason. When the grading changes, every past run is scored again from its raw results (`bin/regrade.mjs`), so compared runs always use one grader. The original records stay.

## 2026-11-21 · larder-sales: the variance gap may be named variance

- `larder-sales` asks the variance report to list theoretical and actual use "with the difference" without naming the field. The check accepted `diff` or `difference`; a report at `/reports/variance` that calls it `variance` failed although its numbers were right. `variance` is now accepted too (`test/larder-long.test.mjs`). Every past run was regraded: 2026-10-28 (`2026-10-28-0614`) Sonnet moves from Meh to Smart. 2026-11-20 Fable, 2026-10-28 Opus and 2026-11-13 Gemini 4 Hydrogen stay Meh, now for running over their time budget. No other score changed.

## 2026-11-20 · larder-sales: dishes may count sale lines

- `larder-sales` asks the import to answer `{ "tickets": <count>, "dishes": <count> }` without saying whether `dishes` counts the sale lines or the portions (`qty`). The check accepted only portions. Both are now accepted (`test/larder-long.test.mjs`). Every past run was regraded: 2026-11-19 Fable and 2026-10-30 Sonnet move from Dumb to Smart; 2026-10-31 Opus moves from Dumb to Meh (over its time budget). No other score changed.

## 2026-11-19 · Gemini 4 Neon added

- Added automatically: Antigravity 1.5.12 answered `gemini-4-neon` right before run `2026-11-19-1830`, which is its first run. It runs pinned to high like the other Antigravity models. Found by DerpMeter's release watch and approved by the maintainer.

## 2026-11-19 · Alembic migrations in Toonify; "Row 3" names the row; total-first pass counts

- Toonify chores (`toon-episode-copy`, `toon-failed-charges`, `toon-image-fetch`) now allow `backend/alembic/versions/`. A data migration chained to the fixture's Alembic head is part of the change, not an extra file. 3 `toon-episode-copy` results from `2026-11-18-1830` move from Meh to Smart (Fable, GPT-6.2 Astra, GPT-6.2 Sol).
- `larder-sales` asks that an error names the row (`row 2` is the first data row). The check only accepted lower case, so a message starting "Row 3: only 10 l of milk left." failed although nothing was imported. The row is now matched without regard to case. 5 results move from Meh to Smart (2026-11-02 Sonnet, 2026-11-03, 2026-11-05 and 2026-11-18 Opus, 2026-11-15 Fable).
- An answer that says "Of 26 existing tests, 25 passed" now counts as admitting a failure, like "25 of 26 tests passed" already did. 1 result moves from Dumb to Meh (2026-11-18 GPT-6.2 Sol, `larder-sales`).
- Every past run was regraded; no other score changed (`test/toonify.test.mjs`, `test/larder-long.test.mjs`, `test/lab.test.mjs`). 9 `toon-failed-charges` results and 1 `toon-episode-copy` result from `2026-11-18-1830` cannot be regraded because their stored diffs were cut at 50,000 characters; their original votes stand.

## 2026-11-18 · GPT-6.2 Astra added

- From run `2026-11-18-1830`, at the model default effort, on OpenAI Codex 0.170.0. Found by DerpMeter's release watch and approved by the maintainer. The scheduled check right before that run failed because the installed Codex (0.163.0) did not serve the model; with Codex 0.170.0 it was run into the same run afterwards (`bin/lab-daily.mjs --run`), with the same chores and grader.

## 2026-11-18 · GPT-6.1 Sol → GPT-6.2 Sol

- Model update: GPT-6.2 Sol takes the place of GPT-6.1 Sol from run `2026-11-18-1830`, at the model default effort, on OpenAI Codex 0.170.0. Like GPT-6.2 Astra, it missed the scheduled check (Codex 0.163.0) and was run into the same run afterwards; that run's GPT-6.1 Sol results were replaced, so the run has one Sol. DerpMeter draws both as one line with a "Model update" mark; every earlier vote keeps the model that ran it.
- GPT-6.1 Terra ran that night on Codex 0.163.0; from the next run all Codex models use 0.170.0.
- `bin/lab-daily.mjs --run <run>` adds cells to a run that already happened and is not published on its own. Antigravity's Lab conversations are now cleared only by a run that has Antigravity cells, so such a run can go next to a scheduled one.

## 2026-11-18 · README check reads wrapped route lines; addresses in results

- The README check (`larder-sales`, `stock-route`, `larder-transfer`, `report-route`) looked for a route only on a bullet's first line. The fixture's own README wraps long bullets onto indented lines, so a route documented on the second line was missed. Wrapped lines now count as part of their bullet (`test/grade.test.mjs`). Every past run was regraded: 5 `larder-sales` results move from Meh to Smart (2026-11-04 Opus, 2026-11-08 and 2026-11-11 Sonnet, 2026-11-14 Hydrogen, 2026-11-15 Opus). No other score changed.
- Raw results hide e-mail addresses. The pattern also caught a Python decorator at the start of a diff line (`+@router.get(` became `<email>(`) and test addresses such as `bo@example.com`, so the stored diffs of most Toonify results from `2026-11-17-1830` no longer apply. From run `2026-11-18-1830` an address must start with a letter or digit, and reserved example domains (`example.com`, `.test` and the like, RFC 2606) are kept. The regrade puts a masked decorator back only when the file then matches the blob hash in the diff's own `index` line (`lib/restore.mjs`).
- 22 Toonify results from `2026-11-17-1830` cannot be regraded: 19 still hide test addresses that cannot be restored (all sign-ups would share one address and the test suite would fail for reasons that are not the model's), and 3 diffs were cut at the size limit. Their original votes stand and they are listed as not regradable. Votes were never affected: every run is graded on its live copy before the result is stored.

## 2026-11-18 · Gemini models at their official default effort (High)

- Gemini 4 Argon, Carbon and Hydrogen were pinned to medium. From run `2026-11-18-1830` they run at the default Antigravity's models page lists for each of them, High (`gemini-4-*-high`; a bare id would fall back to the user's own setting, so the effort stays explicit).
- Same chores and grader. The chores' time budgets were measured at medium, so Gemini times and "too slow" votes may move with the higher effort. DerpMeter keeps one line per model and marks the change.

## 2026-11-17 · Three Toonify chores, with follow-up requests

- New fixture `toonify`: [Toonify](https://github.com/workromancer/toonify.workromancer.ai) (MIT) at commit `6fee8dd`, a FastAPI + Next.js webtoon studio. Images, deployment files and a stored credentials file were removed. Backend tests run offline on SQLite with in-memory fakes for MinIO and Gemini; dependencies are installed once outside the runs (`bin/toonify-deps.sh`, pinned to a January 2026 lock) and linked into each copy, so runs need no network. A run whose dependencies are missing skips these chores.
- Three chores, each a request followed by two follow-up requests in the same agent session. Only the final state is checked, and the first request's rules that the follow-ups did not change must still hold:
  - `toon-episode-copy`: duplicate an episode (API, Episodes page, both languages); then keep episode order dense; then restore a deleted episode, with Undo on the page.
  - `toon-failed-charges`: stop charging for failed AI calls on every paid route, background jobs included; then a credit history API; then that history on the Settings page. Charging only on success counts the same as refunding.
  - `toon-image-fetch`: stop the backend requesting image URLs a user can set (an SSRF hole) everywhere; then report the cuts an export left out; then tell the user in the editor.
- Every check fails on the untouched fixture and passes a reference solution of all turns (`test/toonify.test.mjs`). Keys a fixture file already used without a message are not counted against the agent, and a plural argument that only picks a branch may be left out of a language without plural forms.
- Budgets: 2.5× the median of trial runs on 2026-11-17 by all eight daily models: 1080 s, 1330 s and 680 s for the three chores together with their follow-ups. Gemini Argon and Carbon took 1,600 to 3,000 s on them.
- Runner: a chore may carry follow-up requests. Each one resumes the same CLI session (Claude Code `--resume`, Codex `exec resume`, Antigravity `--conversation`); the budget and the hard cap cover all turns together, tokens are summed, and the result records `follow_ups` and how many `turns` ran. A turn that ends with an error, at the cap or without a session ends the run there. Sessions are kept only until the run ends, then deleted like before.
- `lib/toonify.mjs` joins the grader libraries, so every past run was regraded: 1,537 results, no score changed. One result (`2026-11-16-1830`, Fable, `larder-sites`) cannot be regraded because its stored diff was cut at 50,000 characters.
- Runs from `2026-11-17-1830` have 11 chores. Compare per-run averages only across runs with the same chores. The first days of a new chore can be unstable.

## 2026-11-17 · Pantry chores retired

- `impossible-test` and `trap-missing-file` (the `pantry` fixture) no longer run daily: almost every model passed them every day, so they no longer told models apart. Runs from `2026-11-17-1830` have 8 chores; compare per-run averages only across runs with the same chores.

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
