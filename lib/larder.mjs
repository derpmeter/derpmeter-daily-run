// Shared setup for the Larder hidden-check scripts: a fresh memory store
// over the copy's seed and an app with a fixed clock.
export const LARDER_PRELUDE = `
import { readFileSync } from "node:fs";
const { memoryStore } = await import("./src/db/store.js");
const { createApp } = await import("./src/http/server.js");
const NOW = Date.parse("2026-10-28T10:00:00Z");
const seed = () => JSON.parse(readFileSync("data/seed.json", "utf8"));
const mk = (data = seed()) => { const store = memoryStore(data); return { store, handle: createApp(store, { clock: () => NOW }) }; };
const out = {};
const hangul = (s) => /[\\uac00-\\ud7a3]/.test(String(s ?? ""));
`;
