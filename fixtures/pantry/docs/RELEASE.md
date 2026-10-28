# Releasing Pantry

Do every step; a release with a step missing is not a release.

1. Set the new version in `package.json`.
2. Set the same version in `src/version.js`.
3. Add the CHANGELOG entry (format in `AGENTS.md`), dated today.
4. Update the "Current version" line in `README.md`.
5. Run `npm test` and `npm run lint`.
