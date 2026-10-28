// The stock ledger: every change to a batch quantity writes one movement.
// Movements are never edited or deleted (docs/DATA.md).

export const MOVEMENT_TYPES = ["receive", "consume", "waste", "adjust"];

/** Appends a movement and returns it. `qty` is positive; `type` says which way. */
export function record(store, { type, batchId, qty, at, ref = "" }) {
  if (!MOVEMENT_TYPES.includes(type)) throw new Error(`Unknown movement type ${type}`);
  const movement = { id: store.nextId("movement"), type, batchId, qty, at, ref };
  store.data.movements.push(movement);
  return movement;
}

/** Movements for one batch, oldest first. */
export function movementsFor(store, batchId) {
  return store.data.movements.filter((m) => m.batchId === batchId);
}
