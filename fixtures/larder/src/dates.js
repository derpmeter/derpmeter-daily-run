// Calendar dates are "YYYY-MM-DD" strings in UTC. Instants are ISO strings.
const DAY = 86400000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date written YYYY-MM-DD. */
export function isDate(s) {
  if (typeof s !== "string" || !DATE.test(s)) return false;
  return new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
}

/** The UTC calendar date of an instant (ms or ISO string). */
export function dayOf(instant) {
  return new Date(instant).toISOString().slice(0, 10);
}

/** Whole calendar days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}

/** `day` plus `n` calendar days. */
export function addDays(day, n) {
  return dayOf(Date.parse(`${day}T00:00:00Z`) + n * DAY);
}
