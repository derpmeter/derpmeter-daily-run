// A core option that crosses the parser, extensions, toc and the CLI.
import { grade, pyChangelog, pycases, pyLineLength, pySuite, pyTestsAdded } from "../lib/grade.mjs";

const task = {
  id: "pymd-heading-offset",
  fixture: "pymd",
  prompt: [
    "Add a `heading_offset` option to `markdown.Markdown` (and `markdown.markdown`): a whole number from 0 to 5, default 0, that shifts the level of every heading Markdown produces by that many (an `h1` becomes an `h2` with 1), never beyond `h6`. Any other value raises `ValueError`.",
    "- It applies to hash and underline headings, and to headings from extensions such as `md_in_html`.",
    "- The `toc` extension sees the shifted levels (its tokens and `toc_depth`).",
    "- The command line gets `--heading-offset N`.",
  ].join("\n"),
  budgetSec: 300,
  allowed: ["markdown/", "tests/", "docs/"],
  forbidden: [],
  async check(ctx) {
    const r = await pycases(
      ctx,
      `
import json, subprocess, sys
out = {}
try:
    import markdown
    from markdown.extensions.toc import TocExtension
    m = markdown.markdown
    out['shift'] = m("# A\\n\\n## B", heading_offset=1) == '<h2>A</h2>\\n<h3>B</h3>'
    out['default'] = m("# A") == '<h1>A</h1>'
    out['cap'] = m("##### E\\n\\n###### F", heading_offset=2) == '<h6>E</h6>\\n<h6>F</h6>'
    out['setext'] = m("A\\n===\\n\\nB\\n---", heading_offset=1) == '<h2>A</h2>\\n<h3>B</h3>'
    out['mdInHtml'] = '<h2>A</h2>' in m('<div markdown="1">\\n# A\\n</div>', extensions=['md_in_html'], heading_offset=1)
    md = markdown.Markdown(extensions=['toc'], heading_offset=1)
    md.convert("# A\\n\\n## B")
    t = md.toc_tokens
    out['toc'] = len(t) == 1 and t[0]['level'] == 2 and t[0]['id'] == 'a' and t[0]['children'][0]['level'] == 3
    md = markdown.Markdown(extensions=[TocExtension(toc_depth=2)], heading_offset=1)
    md.convert("# A\\n\\n## B")
    out['tocDepth'] = [x['name'] for x in md.toc_tokens] == ['A'] and md.toc_tokens[0]['children'] == []
    bad = 0
    for v in (-1, 6, '1', 1.5):
        try:
            markdown.Markdown(heading_offset=v)
        except ValueError:
            bad += 1
    out['validation'] = bad == 4
    cli = subprocess.run([sys.executable, '-m', 'markdown', '--heading-offset', '1'], input='# A\\n', capture_output=True, text=True)
    out['cli'] = cli.returncode == 0 and cli.stdout.strip() == '<h2>A</h2>'
except Exception as e:
    out['crash'] = repr(e)[:100]
print(json.dumps(out))
`,
      ["shift", "default", "cap", "setext", "mdInHtml", "toc", "tocDepth", "validation", "cli"],
    );
    r.docs = /heading_offset/.test(await ctx.read("docs/library.md").catch(() => "")) && /heading-offset/.test(await ctx.read("docs/cli.md").catch(() => ""));
    r.changelog = await pyChangelog(ctx);
    r.testsAdded = await pyTestsAdded(ctx, "heading_offset");
    r.lineLength = await pyLineLength(ctx);
    r.suite = await pySuite(ctx);
    return grade(r, { core: ["shift", "default", "suite"], okWhy: "offset everywhere incl. toc and CLI, validated, documented and tested" });
  },
};

export default task;
