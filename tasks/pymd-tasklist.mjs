// A new extension in a real project: behavior, options, registration, docs,
// tests and changelog the way docs/contributing.md asks.
import { grade, pyChangelog, pycases, pyLineLength, pySuite, pyTestsAdded } from "../lib/grade.mjs";

const task = {
  id: "pymd-tasklist",
  fixture: "pymd",
  prompt: [
    "Add a `tasklist` extension: a list item whose text starts with `[ ]`, `[x]` or `[X]` followed by a space becomes a task.",
    "- The marker is replaced by `<input type=\"checkbox\">`, `checked` for `x`/`X`, and `disabled` unless the `clickable` option is true (default false).",
    "- The `<li>` gets the class from the `item_class` option (default `task`).",
    "- It works in ordered and unordered lists, nested lists and loose lists, and keeps inline markup after the marker.",
    "Register it so `markdown.Markdown(extensions=['tasklist'])` works once installed.",
  ].join("\n"),
  budgetSec: 300,
  allowed: ["markdown/", "tests/", "docs/", "pyproject.toml", "mkdocs.yml", "Markdown-3.11.2.dist-info/"],
  forbidden: [],
  async check(ctx) {
    const r = await pycases(
      ctx,
      `
import json, re
out = {}
try:
    import markdown
    def md(src, **cfg):
        ext = 'markdown.extensions.tasklist'
        return markdown.markdown(src, extensions=[ext], extension_configs={ext: cfg} if cfg else {})
    boxes = lambda h: re.findall(r'<input[^>]*>', h)
    h = md("- [ ] a\\n- [x] b\\n- [X] c\\n")
    b = boxes(h)
    out['basic'] = len(b) == 3 and all('type="checkbox"' in x and 'disabled' in x for x in b) and 'checked' not in b[0] \\
        and 'checked' in b[1] and 'checked' in b[2] and h.count('class="task"') == 3 and '[ ]' not in h and '[x]' not in h \\
        and re.search(r'<input[^>]*>\\s?a</li>', h) is not None
    h = md("1. [ ] one\\n2. [x] two\\n")
    out['ordered'] = '<ol>' in h and len(boxes(h)) == 2
    h = md("- [] a\\n- [ ]a\\n- [link](http://x)\\n- plain\\n")
    out['notTasks'] = not boxes(h) and 'task' not in h and '<a href="http://x">link</a>' in h
    h = md("- [ ] **bold** text\\n")
    out['inline'] = re.search(r'<input[^>]*>\\s?<strong>bold</strong> text', h) is not None
    h = md("- [ ] parent\\n    - [x] child\\n")
    out['nested'] = len(boxes(h)) == 2 and h.count('class="task"') == 2
    h = md("- [ ] a\\n\\n- [x] b\\n")
    out['loose'] = len(re.findall(r'<p>\\s?<input', h)) == 2
    out['clickable'] = 'disabled' not in md("- [ ] a\\n", clickable=True) and len(boxes(md("- [ ] a\\n", clickable=True))) == 1
    out['itemClass'] = 'class="todo"' in md("- [ ] a\\n", item_class='todo')
    out['plainLists'] = markdown.markdown("- [ ] a\\n") == '<ul>\\n<li>[ ] a</li>\\n</ul>'
except Exception as e:
    out['crash'] = repr(e)[:100]
print(json.dumps(out))
`,
      ["basic", "ordered", "notTasks", "inline", "nested", "loose", "clickable", "itemClass", "plainLists"],
    );
    r.entryPoint = /tasklist\s*=\s*['"]markdown\.extensions\.tasklist:\w+['"]/.test(await ctx.read("pyproject.toml"));
    // Any new extension page will do (upstream names them like task_lists.md).
    const pages = (await ctx.run("git", ["status", "--porcelain", "--untracked-files=all", "docs/extensions"])).stdout
      .split("\n")
      .filter((l) => l.startsWith("??") || l.startsWith("A "))
      .map((l) => l.slice(3).trim())
      .filter((f) => f.endsWith(".md"));
    let page = false;
    for (const f of pages) if (/task/i.test(await ctx.read(f).catch(() => "")) && (await ctx.read(f)).length > 200) page = true;
    r.docs = page && /task/i.test(await ctx.read("docs/extensions/index.md").catch(() => ""));
    r.changelog = await pyChangelog(ctx);
    r.testsAdded = await pyTestsAdded(ctx, "tasklist");
    r.lineLength = await pyLineLength(ctx);
    r.suite = await pySuite(ctx);
    return grade(r, { core: ["basic", "notTasks", "suite"], okWhy: "task lists everywhere, options, entry point, docs, tests and changelog" });
  },
};

export default task;
