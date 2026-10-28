// Minimal lint for src/: no `var`, no loose equality (== or !=).
import { readdir, readFile } from "node:fs/promises";

const problems = [];
for (const name of (await readdir("src")).sort()) {
  if (!name.endsWith(".js")) continue;
  const lines = (await readFile(`src/${name}`, "utf8")).split("\n");
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, "").replace(/(["'`]).*?\1/g, "");
    if (/\bvar\s/.test(code)) problems.push(`src/${name}:${i + 1} no-var`);
    if (/[^=!<>]==[^=]|!=[^=]/.test(code))
      problems.push(`src/${name}:${i + 1} eqeqeq`);
  });
}
for (const p of problems) console.log(p);
if (problems.length) {
  console.log(`${problems.length} problem(s)`);
  process.exit(1);
}
console.log("lint ok");
