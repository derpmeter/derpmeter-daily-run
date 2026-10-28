# Larder: rules for coding agents

- Plain Node.js (ESM). Do not add dependencies.
- Read `docs/ARCHITECTURE.md` and `docs/DATA.md` before changing domain or
  storage code; their rules hold for every change.
- Never edit files under `tests/` unless the task asks for test changes.
  New behavior gets new tests in `tests/` when the task asks for tests.
- Keep changes to what the task asks. Do not reformat or refactor other code.
- Errors a client can see are `AppError`s with a code from `src/errors.js`.
  Every code has a message in `src/i18n/messages.js` (see `docs/API.md`).
- Every route is listed under "Routes" in `README.md` and in `docs/API.md`.
- Every user-visible change (feature, fix, deprecation) gets a `- ` bullet
  under `## Unreleased` in `CHANGELOG.md`.
- Exported functions in `src/` have a one-line JSDoc comment.
- Run `npm test` and `npm run lint` to check your work. Both must work offline.
