# Toonify: rules for coding agents

Toonify is an AI webtoon studio: a FastAPI backend (`backend/`) and a Next.js
frontend (`frontend/`).

- Dependencies are installed and the network is off. Do not add or upgrade
  dependencies.
  - Backend: `cd backend && .venv/bin/python -m pytest -q` runs the tests
    (SQLite and in-memory fakes for MinIO and Gemini; see `tests/lab_env.py`).
  - Frontend: `cd frontend && npx tsc --noEmit` type-checks it. `npm run lint`
    reports old problems too; do not add new ones in files you change.
- Never edit existing files under `backend/tests/` unless the task asks for
  test changes. New behavior gets new tests in `backend/tests/` when the task
  asks for tests.
- Keep changes to what the task asks. Do not reformat or refactor other code.
- Every project, character, episode and cut belongs to a workspace; only that
  workspace's members may read or change it.
- API errors are `AppException`s with an `ErrorCode` from
  `backend/app/core/errors.py`. Every code has a message under `Errors.codes`
  in `frontend/messages/en.json` and `frontend/messages/ko.json`.
- Every text a user can see in the frontend comes from
  `frontend/messages/{en,ko}.json` (next-intl). Both files have the same keys.
- Every user-visible change (feature, fix) gets a `- ` bullet under
  `## Unreleased` in `CHANGELOG.md`.
