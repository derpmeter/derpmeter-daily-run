// Minimal lint for src/: no `var`, no loose equality, no console.* calls.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function files(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await files(p)));
    else if (p.endsWith(".js")) out.push(p);
  }
  return out.sort();
}

const problems = [];
for (const file of await files("src")) {
  (await readFile(file, "utf8")).split("\n").forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, "").replace(/(["'`]).*?\1/g, "");
    if (/\bvar\s/.test(code)) problems.push(`${file}:${i + 1} no-var`);
    if (/[^=!<>]==[^=]|!=[^=]/.test(code)) problems.push(`${file}:${i + 1} eqeqeq`);
    if (/\bconsole\.\w+\(/.test(code)) problems.push(`${file}:${i + 1} no-console`);
  });
}
for (const p of problems) console.log(p);
if (problems.length) {
  console.log(`${problems.length} problem(s)`);
  process.exit(1);
}
console.log("lint ok");
