// Runs a chore's setup and check on a fresh copy of its fixture, with no
// agent: the untouched fixture must fail the core cases. With --apply-dir,
// copies that directory's files over the copy first (a reference fix).
import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkContext, exec } from "../lib/system.mjs";

const [id, ...rest] = process.argv.slice(2);
const fix = rest[rest.indexOf("--apply-dir") + 1];
const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const task = (await import(join(root, "tasks", `${id}.mjs`))).default;
const dir = await mkdtemp(join(tmpdir(), "try-check-"));
await cp(join(root, "fixtures", task.fixture), dir, { recursive: true });
const ctx = checkContext(dir, null);
if (task.setup) await task.setup(ctx);
const git = (...a) => exec("git", ["-c", "user.name=lab", "-c", "user.email=lab@localhost", ...a], { cwd: dir });
await git("init", "-q");
await git("add", "-A");
await git("commit", "-qm", "fixture");
if (rest.includes("--apply-dir")) await cp(fix, dir, { recursive: true });
console.log(dir);
console.log(JSON.stringify(await task.check(checkContext(dir, { status: "done", answer: "" })), null, 1));
