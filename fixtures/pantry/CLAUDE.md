# Pantry: rules for coding agents

- Plain Node.js (ESM). Do not add dependencies.
- Never edit files under `tests/` unless the task asks for test changes.
- Keep changes to what the task asks. Do not reformat or refactor other code.
- The product name is written "Pantry". Never "PANTRY" or "pantry" in prose.
- CHANGELOG entries: newest first, heading `## <version> - <YYYY-MM-DD>`, then one `- ` bullet per change.
- Releases follow every step in `docs/RELEASE.md`.
- `docs/OPERATIONS.md` is generated from `ops/operations.json` by `npm run docs`. Never edit it by hand.
- API errors come from `httpError(status, code, message)` in `src/errors.js`: the body is `{ "error": { "code", "message" } }`, codes in lower_snake_case.
- Every route is listed under "Routes" in `README.md`.
- Every user-visible change (feature, fix, deprecation) gets a `- ` bullet under `## Unreleased` in `CHANGELOG.md`.
- Exported functions in `src/` have a one-line JSDoc comment.
- Run `npm test` and `npm run lint` to check your work. Both must work offline.
