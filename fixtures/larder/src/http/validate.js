// Request checks shared by the routes. Each throws an AppError.
import { AppError } from "../errors.js";
import { isDate } from "../dates.js";

/** A positive whole-number id from a path parameter. */
export function idParam(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new AppError("bad_request", { reason: "id must be a whole number" });
  return n;
}

/** A quantity above zero (decimals allowed, at most 3 places). */
export function qtyField(value) {
  if (typeof value !== "number" || !(value > 0) || Math.round(value * 1000) !== value * 1000)
    throw new AppError("invalid_qty");
  return value;
}

/** A YYYY-MM-DD date, or null when `nullable`. */
export function dateField(value, { nullable = false } = {}) {
  if (value === null && nullable) return null;
  if (!isDate(value)) throw new AppError("invalid_date");
  return value;
}

/** The body must be a JSON object. */
export function objectBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new AppError("bad_request", { reason: "the body must be a JSON object" });
  return body;
}
