# DerpMeter Daily Run fixture

[Toonify](https://github.com/workromancer/toonify.workromancer.ai) at commit
`6fee8dd` (MIT, see `LICENSE`), with these changes for offline chores:

- Removed: images and media, deployment and cloud setup scripts,
  `.agent/` (an Antigravity-only rules folder, including a test account),
  Dockerfiles and `docker-compose.yml`.
- Added: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` (the same rules),
  `CHANGELOG.md`, this file, lab entries in `.gitignore`,
  `backend/requirements.lock` (`requirements.txt` resolved as of 2026-01-08,
  plus pytest and httpx) and `backend/tests/` (an offline test setup and smoke
  tests; the original has no tests).
- Each run links `backend/.venv` and `frontend/node_modules` to shared
  installs of those dependencies.
