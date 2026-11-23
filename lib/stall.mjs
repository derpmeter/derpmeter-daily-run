// Since 2026-11-23 the runner waits for a chore's final result instead of
// stopping it at the hard cap (4× the time budget). Only a CLI with no answer
// after STALL_SEC is stopped, and that run is not graded (skipped "crash",
// not the model). Not a grader lib: the judge did not change.
import { capSec } from "./lab.mjs";

export const STALL_SEC = 3 * 3600;

// Whether a stored raw result was stopped at the hard cap. Results from
// before the change have no stall_cap_sec and keep their old reading.
export const pastHardCap = (raw, task) =>
  raw.stall_cap_sec != null
    ? false
    : Boolean(raw.timed_out) || raw.duration_ms >= capSec(task) * 1000;
