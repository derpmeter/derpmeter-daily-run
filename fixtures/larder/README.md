# Larder

Larder keeps a small kitchen's stock: items, the batches (lots) they arrive
in, purchase orders, recipes, and a ledger of every stock movement.

Current version: 2.3.0.

- `npm start` serves the API on port 4400 (`LARDER_PORT`), data in
  `data/db.json` (`LARDER_DATA`).
- `npm test` runs the tests; `npm run lint` checks `src/`.
- `npm run cli -- migrate data/db.json` upgrades a data file.
- How the code is laid out: `docs/ARCHITECTURE.md`. Data rules:
  `docs/DATA.md`. API, errors and languages: `docs/API.md`.

## Routes

- `GET /items`, `GET /items/:id`: items with stock on hand.
- `GET /batches`, `GET /batches/:id`: batches with their movements.
- `POST /batches/:id/waste`: record waste from a batch.
- `POST /orders`, `GET /orders/:id`, `POST /orders/:id/send`,
  `POST /orders/:id/receive`, `POST /orders/:id/cancel`: purchase orders.
- `POST /recipes/:id/cook`: cook portions of a recipe.
- `GET /reports/stock-value`, `GET /reports/waste?from=&to=`: reports.
- `GET /alerts`: batches expiring soon and items below their minimum.
