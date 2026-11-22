// Which grid cells run today. grid.json "schedule" can pause an agent or a
// model through a date, or run it every N days from an anchor date. Dates
// are KST calendar days (the daily run starts 03:30 KST). Not a grader lib:
// it decides what runs, never how a run is scored.
const DAY = 86_400_000;

// KST calendar day (YYYY-MM-DD) of a Date.
export const kstDay = (date) => new Date(date.getTime() + 9 * 3_600_000).toISOString().slice(0, 10);

const matches = (rule, cell) =>
  rule.agent === cell.agent && (!rule.models || rule.models.includes(cell.model));

// Why a cell does not run on `day` (KST YYYY-MM-DD), or null when it runs.
export function scheduledOut(schedule, cell, day) {
  for (const rule of schedule ?? []) {
    if (!matches(rule, cell)) continue;
    if (rule.pausedThrough && day <= rule.pausedThrough) return `paused through ${rule.pausedThrough}`;
    if (rule.everyDays > 1) {
      const n = Math.round((Date.parse(day) - Date.parse(rule.anchor)) / DAY);
      if (((n % rule.everyDays) + rule.everyDays) % rule.everyDays !== 0)
        return `runs every ${rule.everyDays} days (next from ${rule.anchor})`;
    }
  }
  return null;
}
