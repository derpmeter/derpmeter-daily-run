# Pantry

Pantry tracks what is on the shelf and what expires soon.

Current version: 1.4.2.

- `npm start` serves the routes below on port 4300.
- Items come from `fetchItems()` in `src/store.js`.
- `npm test` runs the tests. `npm run lint` checks `src/`.
- Operations notes live in `docs/OPERATIONS.md`.

## Routes

- `GET /items`: every item.
- `GET /expiring`: items that expire within a week.
