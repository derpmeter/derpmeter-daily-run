# Releasing Pantry

Do every step; a release with a step missing is not a release.

1. Set the new version in `package.json`.
2. Set the same version in `src/version.js`.
3. In `CHANGELOG.md`, rename `## Unreleased` to `## <version> - <YYYY-MM-DD>` (today), keep its bullets, add a bullet for this release's change if it is not there, and add a new empty `## Unreleased` above it.
4. Update the "Current version" line in `README.md`.
5. Run `npm test` and `npm run lint`.
