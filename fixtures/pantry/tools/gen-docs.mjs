// Writes docs/OPERATIONS.md from ops/operations.json.
import { readFile, writeFile } from "node:fs/promises";

const ops = JSON.parse(await readFile("ops/operations.json", "utf8"));
const doc = `# Operations

<!-- Generated from ops/operations.json by \`npm run docs\`. Do not edit. -->

## Backups

The shelf snapshot is backed up every day at ${ops.backup.timeUtc} UTC. Backups are kept for
${ops.backup.keepDays} days, then deleted. A restore takes about ${ops.backup.restoreMinutes} minutes.

## Alerts

An alert fires when more than ${ops.alerts.sameDayExpiries} items expire on the same day. Alerts go to the
${ops.alerts.channel} channel during business hours (${ops.alerts.hoursKst} KST).

## Ports

The service listens on port ${ops.port}. The health check is \`${ops.health}\`.
`;
await writeFile("docs/OPERATIONS.md", doc);
