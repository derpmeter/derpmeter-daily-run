# Operations

<!-- Generated from ops/operations.json by `npm run docs`. Do not edit. -->

## Backups

The shelf snapshot is backed up every day at 02:15 UTC. Backups are kept for
14 days, then deleted. A restore takes about 10 minutes.

## Alerts

An alert fires when more than 3 items expire on the same day. Alerts go to the
#pantry-ops channel during business hours (09:00 to 18:00 KST).

## Ports

The service listens on port 4300. The health check is `GET /items`.
