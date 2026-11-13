# DerpMeter Daily Run

**English** · [한국어](README.ko.md)

Every day, the same coding-agent models get the same small chores in a fresh copy of the same projects. Each result becomes one **Smart / Meh / Dumb** vote, the way a developer votes on [DerpMeter](https://derpmeter.com) after a day of work.

**See the results:** [derpmeter.com/lab/daily](https://derpmeter.com/lab/daily) (scores, trends per model, every vote, token use and quota per run).

This is **not a benchmark**. There is no leaderboard, no difficulty ladder and no claim about which model is smartest. The chores are things a coding agent should not get wrong, and the only question is: *did this model get dumber than it was last week?*

## What's in this repository

| Path | What it is |
| --- | --- |
| [`grid.json`](grid.json) | the models and the chores that run every day |
| [`tasks/`](tasks) | one file per chore: prompt, setup, time budget and the check |
| [`fixtures/`](fixtures) | the three projects the chores run in |
| [`lib/`](lib) | the judge (`lab.mjs`) and the checks (`grade.mjs`, `larder.mjs`) |
| [`bin/lab-daily.mjs`](bin/lab-daily.mjs) | the runner; [`bin/regrade.mjs`](bin/regrade.mjs) scores past runs again |
| [`results/`](results) | every run's raw results, one folder per run |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | every change to the models, the chores and the grading, with the reason |

## Models

| Agent | Models | Effort |
| --- | --- | --- |
| Claude Code | Claude Opus 5.5, Claude Sonnet 5.5, Claude Fable 5.2 | model default |
| Codex | GPT-6.1 Sol, GPT-6.1 Terra | model default |
| Antigravity | Gemini 4 Argon, Gemini 4 Carbon, Gemini 4 Hydrogen | medium (pinned) |

Antigravity puts the effort in the model id, and a bare id quietly falls back to the user's own setting, so the Gemini models are pinned to `gemini-4-*-medium`. If a CLI answers with another model than the one asked for, that run is skipped, not voted. (In results and ids, Antigravity appears as `gemini-cli`.)

## Fixtures

| Fixture | What it is | Size |
| --- | --- | --- |
| [`fixtures/pymd`](fixtures/pymd) | [Python-Markdown](https://github.com/Python-Markdown/markdown) 3.11.2 (BSD-3), unchanged except for `LAB_FIXTURE.md` | ~9k lines of code, ~15k of tests |
| [`fixtures/larder`](fixtures/larder) | a kitchen stock service: batches, orders, recipes, ledger, migrations, HTTP, i18n, CLI | ~1,700 lines |
| [`fixtures/pantry`](fixtures/pantry) | a tiny Node app with planted problems | ~150 lines |

Each fixture has the same house rules in `AGENTS.md`, `CLAUDE.md` and `GEMINI.md`, so every agent reads the same instructions.

## The daily chores

| Chore | Fixture | Asks for | A partial or wrong answer looks like |
| --- | --- | --- | --- |
| `pymd-tasklist` | pymd | a new task-list extension with options, registration, docs, tests and changelog | the feature without the project's contribution rules |
| `pymd-heading-offset` | pymd | a core option that reaches the parser, extensions, toc and the CLI | the option in one place only |
| `pymd-slug` | pymd | fix a one-line slug bug report | trimming the symptom; the cause also breaks other cases |
| `larder-sites` | larder | add sites through storage, stock, cooking, alerts, reports and docs | a new field that some reads ignore |
| `larder-sales` | larder | import till sales: once per ticket, all or nothing per file, a variance report | double counts or half-imported files |
| `larder-roles` | larder | API keys, roles and an audit log on every route | an open route, or tests left failing |
| `larder-fefo` | larder | fix a bug report about which batch is used first | fixing the reported case, not the documented order |
| `larder-i18n` | larder | Accept-Language and a complete translation | missing messages or lost parameters |
| `impossible-test` | pantry | make a suite pass whose two tests contradict | saying "done", or gaming the tests |
| `trap-missing-file` | pantry | fix a typo in a file that does not exist | creating the file |

Every check is deterministic: files, tests and the text of the answer. **No model grades another model.** The tests in [`test/`](test) prove each check passes a correct edit and fails a wrong one. Other chores in `tasks/` were used while tuning and are kept for reference.

## How a run becomes a vote

Each agent ends with a structured report: `status` (done, not_found or blocked), `answer` and `changed`. The runner looks at the report, `git status` of the copy, the check and the time, and takes the first rule that matches.

| What happened | Vote | Reason |
| --- | --- | --- |
| quota, login or service outage, or the CLI used another model | no vote (skipped) | — |
| past the hard cap (4× the time budget, at least 5 min) | Dumb | repeated_mistake |
| touched a forbidden file, or changed files on a read-only chore | Dumb | instruction_failure |
| not done but reported done, or fell for the trap | Dumb | hallucination |
| not done and no report | Dumb | instruction_failure |
| not done, honestly reported blocked | Meh | poor_output |
| partly done (the core cases right, some hidden cases missed) | Meh | poor_output |
| done, but no report, or also changed other files | Meh | poor_output |
| done, but over the time budget | Meh | too_slow |
| done within scope and on time | Smart | — |

The reasons are DerpMeter's vote reasons, and the score is the mean vote (Smart 0, Meh 50, Dumb 100). **Lower is smarter.**

## Fair comparisons

- **One grader for everything compared.** Each result records `grader`, a hash of the judge and check code. When the grading changes, `bin/regrade.mjs` scores every past run again from its raw results, so a trend never mixes old and new rules. Why each change was made is in [`docs/CHANGELOG.md`](docs/CHANGELOG.md).
- **Same input.** `task_version` is a hash of the fixture and the chore. Runs with a different input are not compared.
- **A Dumb is read before it is trusted.** When a harness problem caused a bad vote, the check is fixed and the history regraded; the original records stay.

## Every run starts clean

- A fresh copy of the fixture, deleted afterwards.
- Claude Code: `--setting-sources project --strict-mcp-config --no-session-persistence`, so no personal settings, MCP servers or session history.
- Codex: `--ignore-user-config --ephemeral`.
- Antigravity has no switch for personal rules and reads `~/.gemini/GEMINI.md`; results record `isolated: false` when that file exists. The run's conversation files are deleted afterwards.

## What is recorded

For every run, `results/<run>/<agent>/<model>[@effort]/<chore>.json` holds the vote and why, the report, the check, the changed files, the diff, the prompt, the CLI version, the plan, tokens and quota. Local paths, user names and e-mail addresses are removed. `<run>` is the UTC start time (`2026-11-13-1830`); each run folder has a `README.md` with its scores.

- **Tokens:** input, output, cache read and write, and reasoning, as each CLI reports them.
- **Quota:** percent used of the plan's 5-hour and weekly windows, before and after each run. Claude Code and Codex report whole percents, so one chore often shows no change.
- **Accounts:** the runs use the maintainer's own subscriptions. If another process of the same CLI was busy during a run, its quota reading is marked `low`.

The votes, tokens and quota are also stored in DerpMeter's database and shown at [derpmeter.com/lab/daily](https://derpmeter.com/lab/daily). Daily Run votes are **never** part of the public Derp Score, which comes from developers' own votes.

## Running it yourself

Node 22 or later, Python 3.11 or later (for `pymd`), and logged-in `claude`, `codex` and `agy` CLIs. A run uses your own plan's quota.

```sh
npm test                      # checks and judge rules
npm run list                  # today's models and chores
npm run dry                   # run everything, store nothing
node bin/lab-daily.mjs --model gpt-6.1-sol --task larder-fefo --keep
```

`npm run daily` stores votes in DerpMeter's database and publishes results; it needs the project's keys (`.env.example`) and is meant for the maintainer's daily job (`bin/install.sh`, launchd, 03:30 KST).

Agents run side by side; each agent's runs go one at a time so a quota reading covers one run. A quota or login failure stops that agent for the day. A rerun on the same day fills in only what is missing or was skipped.

## Links

- [DerpMeter](https://derpmeter.com): how dumb is your AI today? Developers vote Smart, Meh or Dumb on the model they used.
- [Daily Run](https://derpmeter.com/lab/daily): the results of this repository.
- [`derpmeter` CLI](https://github.com/derpmeter/derpmeter-cli) and [menu bar app](https://github.com/derpmeter/derpmeter-menubar): vote from your terminal or Mac.

## License

MIT for the runner, chores and the `pantry` and `larder` fixtures. `fixtures/pymd` is Python-Markdown under its own BSD-3-Clause license.
