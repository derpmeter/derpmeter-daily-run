// A one-line report; the cause (slugify no longer strips) also breaks leading
// punctuation, custom separators and the unicode slugify. Trimming a final
// dash fixes the report only.
import { grade, pyChangelog, pycases, pySuite, pyTestsAdded } from "../lib/grade.mjs";

const PLANTED = "    value = re.sub(r'[^\\w\\s-]', '', value).lower()";
const task = {
  id: "pymd-slug",
  fixture: "pymd",
  prompt:
    "Bug report: with the `toc` extension, a heading like `# Hello world !` gets the id `hello-world-`, with a trailing dash. Fix it and add a regression test.",
  budgetSec: 150,
  allowed: ["markdown/", "tests/", "docs/changelog.md"],
  forbidden: [],
  async setup(ctx) {
    const p = "markdown/extensions/toc.py";
    const s = await ctx.read(p);
    await ctx.write(p, s.replace("    value = re.sub(r'[^\\w\\s-]', '', value).strip().lower()", PLANTED));
  },
  async check(ctx) {
    const r = await pycases(
      ctx,
      `
import json, re
out = {}
try:
    import markdown
    from markdown.extensions.toc import TocExtension, slugify_unicode
    ids = lambda src, **kw: re.findall(r'id="([^"]*)"', markdown.markdown(src, extensions=[TocExtension(**kw)]))
    out['reported'] = ids("# Hello world !") == ['hello-world']
    out['leading'] = ids("# ! Hello") == ['hello'] and ids("# !! Hi !!") == ['hi']
    out['separator'] = ids("# Hello world !", separator='_') == ['hello_world']
    out['unicode'] = ids("# ¿Qué tal ?", slugify=slugify_unicode) == ['qué-tal']
    out['inner'] = ids("# Q&A - FAQ") == ['qa-faq'] and ids("# Hello world") == ['hello-world']
except Exception as e:
    out['crash'] = repr(e)[:100]
print(json.dumps(out))
`,
      ["reported", "leading", "separator", "unicode", "inner"],
    );
    r.suite = await pySuite(ctx);
    // The new test must fail on the committed (buggy) toc.py.
    const p = "markdown/extensions/toc.py";
    const now = await ctx.read(p);
    await ctx.write(p, (await ctx.run("git", ["show", `HEAD:${p}`])).stdout);
    r.regressionTest = !(await pySuite(ctx));
    await ctx.write(p, now);
    r.testsAdded = await pyTestsAdded(ctx, "");
    r.changelog = await pyChangelog(ctx);
    return grade(r, { core: ["reported", "suite"], okWhy: "slugify strips again on every path, with a regression test and changelog" });
  },
};

export default task;
