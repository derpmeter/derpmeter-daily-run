// Schema migrations. Each entry upgrades data from version `from` to
// `from + 1` and must not lose information. The store runs them in order on
// load, so every older file opens as the current version.

/** The schema version this code reads and writes. */
export const CURRENT_VERSION = 2;

export const MIGRATIONS = [
  {
    from: 1,
    // v1 kept one `stock` number per item; v2 keeps batches (lots), each with
    // its own quantity, expiry and location. Old stock becomes one batch.
    up(data) {
      const batches = [];
      let batchSeq = 0;
      for (const item of data.items) {
        if (item.stock > 0)
          batches.push({
            id: ++batchSeq,
            itemId: item.id,
            lot: `LEGACY-${item.id}`,
            qty: item.stock,
            receivedOn: item.updatedOn ?? "2026-01-01",
            expires: item.expires ?? null,
            location: item.location ?? "dry",
          });
        delete item.stock;
        delete item.expires;
        delete item.location;
        delete item.updatedOn;
      }
      return {
        ...data,
        schemaVersion: 2,
        seq: { ...data.seq, batch: batchSeq, movement: data.seq?.movement ?? 0 },
        batches,
        movements: data.movements ?? [],
      };
    },
  },
];

/** Upgrades `data` to CURRENT_VERSION. */
export function migrate(data) {
  let out = structuredClone(data);
  let version = out.schemaVersion ?? 1;
  if (version > CURRENT_VERSION)
    throw new Error(`Data is schema ${version}; this Larder reads up to ${CURRENT_VERSION}.`);
  while (version < CURRENT_VERSION) {
    const step = MIGRATIONS.find((m) => m.from === version);
    if (!step) throw new Error(`No migration from schema ${version}.`);
    out = step.up(out);
    version = out.schemaVersion;
  }
  return out;
}
