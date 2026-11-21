// Stored diffs. A raw result keeps its diff inline, cut at 50k characters so
// the JSON stays readable. Toonify chores (a whole web app) often run longer,
// so their full diff is also kept next to the result, gzipped, as
// <chore>.diff.gz; the regrade reads it back. Not part of the grader.
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";

export const DIFF_CAP = 50_000;

// Fixtures whose full diff is kept compressed when it is longer than the cap.
const COMPRESSED = new Set(["toonify"]);

export const diffFileFor = (jsonFile) => jsonFile.replace(/\.json$/, ".diff.gz");

/**
 * Cuts raw.diff at the cap. For a compressed fixture with a longer diff,
 * writes the whole diff to <jsonFile>.diff.gz and records its name in
 * raw.diff_file. Call after sanitizing, so the file holds the same text.
 */
export async function storeDiff(raw, jsonFile, fixture) {
  const diff = String(raw.diff ?? "");
  if (diff.length < DIFF_CAP) return raw;
  if (COMPRESSED.has(fixture)) {
    const file = diffFileFor(jsonFile);
    await writeFile(file, await promisify(gzip)(diff, { level: 9 }));
    raw.diff_file = file.split("/").pop();
  }
  raw.diff = diff.slice(0, DIFF_CAP);
  return raw;
}

/** The whole diff of a stored result, or null when it was cut and not kept. */
export async function loadDiff(raw, jsonFile) {
  if (raw.diff_file) {
    const file = jsonFile.replace(/[^/]+$/, raw.diff_file);
    if (existsSync(file)) return String(await promisify(gunzip)(await readFile(file)));
    return null;
  }
  const diff = String(raw.diff ?? "");
  return diff.length >= DIFF_CAP ? null : diff;
}
