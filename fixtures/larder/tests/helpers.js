import { readFileSync } from "node:fs";
import { memoryStore } from "../src/db/store.js";
import { createApp } from "../src/http/server.js";

export const NOW = Date.parse("2026-10-28T10:00:00Z");
export const seed = () => JSON.parse(readFileSync(new URL("../data/seed.json", import.meta.url), "utf8"));
export const fresh = () => memoryStore(seed());
export const app = (store = fresh()) => ({ store, handle: createApp(store, { clock: () => NOW }) });
