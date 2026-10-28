// Temperature logs (food safety): readings per location, checked against the
// location's limits. Fridges must stay at or below 5 °C, freezers at or below
// -15 °C; dry stores have no limit.
import { AppError } from "../errors.js";

export const LIMITS = { fridge: 5, freezer: -15 };

/** Logs a reading in °C for a location; returns it with `ok`. */
export function logTemperature(store, location, celsius, { at, by = "" }) {
  if (!store.data.locations.some((l) => l.id === location)) throw new AppError("unknown_location", { id: location });
  if (typeof celsius !== "number" || !Number.isFinite(celsius) || celsius < -40 || celsius > 60)
    throw new AppError("bad_request", { reason: "celsius must be a number from -40 to 60" });
  store.data.temperatures ??= [];
  const limit = LIMITS[location];
  const reading = { id: store.nextId("reading"), location, celsius, at, by, ok: limit === undefined || celsius <= limit };
  store.data.temperatures.push(reading);
  return reading;
}

/** Readings out of limits on a day (YYYY-MM-DD), oldest first. */
export function breaches(store, day) {
  return (store.data.temperatures ?? []).filter((r) => !r.ok && r.at.slice(0, 10) === day).sort((a, b) => a.at.localeCompare(b.at));
}

/** Locations with a limit that have no reading on `day`. */
export function missingChecks(store, day) {
  const logged = new Set((store.data.temperatures ?? []).filter((r) => r.at.slice(0, 10) === day).map((r) => r.location));
  return store.data.locations.filter((l) => l.id in LIMITS && !logged.has(l.id)).map((l) => l.id);
}
