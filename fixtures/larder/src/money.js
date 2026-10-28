// Money is always an integer number of cents. Never store or sum floats.

/** True for a whole, non-negative number of cents. */
export function isCents(n) {
  return Number.isInteger(n) && n >= 0;
}

/** Cents for `qty` units at `unitCents` each, rounded half up to a cent. */
export function lineCents(qty, unitCents) {
  return Math.round(qty * unitCents);
}

/** "12.34" for 1234 cents. */
export function formatCents(cents) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
