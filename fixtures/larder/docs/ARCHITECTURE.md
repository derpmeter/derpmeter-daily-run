# Architecture

Three layers; each only calls the one below it.

1. `src/http/`: routing, request checks (`validate.js`) and turning
   `AppError`s into responses (`server.js`). No business rules here.
2. `src/domain/`: the rules. Every function takes the `store` first and gets
   the time from its caller (`at`, `now`, `today`); domain code never reads
   the clock and never imports from `src/http/`.
3. `src/db/`: the store (one JSON document) and schema migrations.

Around the domain: `src/io/` (CSV reading and imports) and `src/jobs/`
(scheduled work such as the nightly checks); both call the domain like the
HTTP layer does.

Shared helpers: `src/dates.js` (UTC calendar dates), `src/money.js` (integer
cents), `src/errors.js` (error codes), `src/i18n/messages.js` (client text).

## Changing data

- Every change to a batch quantity goes through `src/domain/ledger.js`
  (`record`), so the ledger always explains the stock.
- Routes that change data call `store.save()` once, after the domain call
  succeeded.

## Schema changes

- Bump `CURRENT_VERSION` in `src/db/migrations.js` and add a migration from
  the previous version. Migrations must not lose information; old files must
  open (the store migrates on load) and `larder migrate` upgrades a file on
  disk.
- Update `data/seed.json` to the new version and describe the change in
  `docs/DATA.md`.
