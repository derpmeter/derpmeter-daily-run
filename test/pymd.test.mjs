// Python-Markdown chores: each check fails untouched and passes a reference
// solution; the typical shortcut is partly done.
import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkContext, exec } from "../lib/system.mjs";
import { changedFiles } from "../lib/lab.mjs";

const FIXTURE = new URL("../fixtures/pymd", import.meta.url).pathname;
const done = { status: "done", answer: "ok", changed: [] };
async function check(id, ...edits) {
  const task = (await import(`../tasks/${id}.mjs`)).default;
  const dir = await mkdtemp(join(tmpdir(), "pymd-test-"));
  try {
    await cp(FIXTURE, dir, { recursive: true });
    if (task.setup) await task.setup(checkContext(dir, null));
    const git = (...a) => exec("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: dir });
    await git("init", "-q");
    await git("add", "-A");
    await git("commit", "-qm", "fixture");
    for (const e of edits) await e(dir);
    return await task.check(checkContext(dir, done));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
const edit = (file, from, to) => async (dir) => {
  const p = join(dir, file);
  const s = await readFile(p, "utf8");
  if (!s.includes(from)) throw new Error(`edit: ${file} lacks ${from.slice(0, 60)}`);
  await writeFile(p, s.replace(from, to));
};
const put = (file, body) => async (dir) => writeFile(join(dir, file), body);
const changelog = (kind, line) =>
  edit("docs/changelog.md", "## [3.11.2] - 2026-10-19", `## [unreleased]\n\n### ${kind}\n\n* ${line}\n\n## [3.11.2] - 2026-10-19`);

test("pymd: every chore fails untouched; pycache is not a change", async () => {
  for (const id of ["pymd-tasklist", "pymd-heading-offset", "pymd-slug"]) {
    const r = await check(id);
    assert.equal(r.ok, false, id);
  }
  assert.deepEqual(changedFiles("?? markdown/__pycache__/core.cpython-313.pyc\n?? tests/x/__pycache__/a.pyc\n M a.py\n"), ["a.py"]);
});

const TASKLIST = `"""
Task lists: list items that start with \`[ ]\` or \`[x]\` become checkboxes.

See the [documentation](https://Python-Markdown.github.io/extensions/tasklist)
for details.
"""

from __future__ import annotations

import re
import xml.etree.ElementTree as etree

from . import Extension
from ..treeprocessors import Treeprocessor

TASK_RE = re.compile(r'^\\[([ xX])\\][ \\t]+')


class TaskListTreeprocessor(Treeprocessor):
    """ Turn task markers at the start of list items into checkboxes. """

    def __init__(self, md, config):
        super().__init__(md)
        self.config = config

    def run(self, root: etree.Element) -> None:
        for li in root.iter('li'):
            target = li
            if len(li) and li[0].tag == 'p' and not (li.text or '').strip():
                target = li[0]
            text = target.text or ''
            m = TASK_RE.match(text)
            if not m:
                continue
            box = etree.Element('input', {'type': 'checkbox'})
            if m.group(1) in 'xX':
                box.set('checked', 'checked')
            if not self.config['clickable']:
                box.set('disabled', 'disabled')
            box.tail = text[m.end():]
            target.text = ''
            target.insert(0, box)
            if self.config['item_class']:
                li.set('class', ' '.join(filter(None, [li.get('class'), self.config['item_class']])))


class TaskListExtension(Extension):
    """ Add task lists to Markdown. """

    def __init__(self, **kwargs):
        self.config = {
            'clickable': [False, 'Leave checkboxes enabled. Default: \`False\`.'],
            'item_class': ['task', 'Class of task list items. Default: \`task\`.'],
        }
        super().__init__(**kwargs)

    def extendMarkdown(self, md):
        md.treeprocessors.register(TaskListTreeprocessor(md, self.getConfigs()), 'tasklist', 15)


def makeExtension(**kwargs):  # pragma: no cover
    return TaskListExtension(**kwargs)
`;
const TASKLIST_TEST = `from markdown.test_tools import TestCase


class TestTaskList(TestCase):

    def test_tasks(self):
        self.assertMarkdownRenders(
            '- [ ] a\\n- [x] b',
            '<ul>\\n'
            '<li class="task"><input disabled="disabled" type="checkbox" />a</li>\\n'
            '<li class="task"><input checked="checked" disabled="disabled" type="checkbox" />b</li>\\n'
            '</ul>',
            extensions=['markdown.extensions.tasklist']
        )
`;
test("pymd-tasklist: reference solution; without docs it is partly done", async () => {
  const code = [
    put("markdown/extensions/tasklist.py", TASKLIST),
    edit("pyproject.toml", "toc = 'markdown.extensions.toc:TocExtension'", "toc = 'markdown.extensions.toc:TocExtension'\ntasklist = 'markdown.extensions.tasklist:TaskListExtension'"),
    put("tests/test_syntax/extensions/test_tasklist.py", TASKLIST_TEST),
    changelog("Added", "Add the `tasklist` extension."),
  ];
  const docs = [
    put("docs/extensions/tasklist.md", "title: Task Lists\n\n# Task Lists\n\nThe Task Lists extension turns list items that start with `[ ]` or `[x]` into\ncheckboxes. Options: `clickable` (default `False`) and `item_class` (default\n`task`). Use it with `markdown.markdown(text, extensions=['tasklist'])`.\n"),
    edit("docs/extensions/index.md", "[Table of Contents]", "[Task Lists]: tasklist.md\n[Table of Contents]"),
  ];
  const full = await check("pymd-tasklist", ...code, ...docs);
  assert.equal(full.ok, true, full.why);
  // The page may be named like upstream's (task_lists.md).
  const otherName = [
    put("docs/extensions/task_lists.md", "title: Task Lists\n\n# Task Lists\n\nThe Task Lists extension turns list items that start with \`[ ]\` or \`[x]\` into\ncheckboxes. Options: \`clickable\` (default \`False\`) and \`item_class\` (default\n\`task\`). Use it with \`markdown.markdown(text, extensions=['tasklist'])\`.\n"),
    edit("docs/extensions/index.md", "[Table of Contents]", "[Task Lists]: task_lists.md\n[Table of Contents]"),
  ];
  assert.equal((await check("pymd-tasklist", ...code, ...otherName)).ok, true);
  const bare = await check("pymd-tasklist", ...code);
  assert.equal(bare.partial, true);
  assert.match(bare.why, /docs/);
});

test("pymd-heading-offset: reference solution; without the CLI it is partly done", async () => {
  const core = [
    edit(
      "markdown/core.py",
      "        self.tab_length: int = kwargs.get('tab_length', 4)\n",
      `        self.tab_length: int = kwargs.get('tab_length', 4)
        offset = kwargs.get('heading_offset', 0)
        if not isinstance(offset, int) or isinstance(offset, bool) or not 0 <= offset <= 5:
            raise ValueError('heading_offset must be a whole number from 0 to 5.')
        self.heading_offset: int = offset
`,
    ),
    edit(
      "markdown/core.py",
      "        self.set_output_format(kwargs.get('output_format', 'xhtml'))\n",
      `        self.set_output_format(kwargs.get('output_format', 'xhtml'))
        if self.heading_offset:
            from .treeprocessors import HeadingOffsetTreeprocessor
            self.treeprocessors.register(HeadingOffsetTreeprocessor(self), 'heading_offset', 25)
`,
    ),
    edit(
      "markdown/treeprocessors.py",
      "class InlineProcessor(Treeprocessor):",
      `class HeadingOffsetTreeprocessor(Treeprocessor):
    """ Shift every heading by \`md.heading_offset\` levels, at most to \`h6\`. """

    def run(self, root: etree.Element) -> None:
        for el in root.iter():
            if isinstance(el.tag, str) and len(el.tag) == 2 and el.tag[0] == 'h' and el.tag[1] in '123456':
                el.tag = 'h%d' % min(6, int(el.tag[1]) + self.md.heading_offset)


class InlineProcessor(Treeprocessor):`,
    ),
    put("tests/test_syntax/test_heading_offset.py", "from markdown.test_tools import TestCase\n\n\nclass TestHeadingOffset(TestCase):\n\n    def test_offset(self):\n        self.assertMarkdownRenders('# A', '<h2>A</h2>', heading_offset=1)\n"),
    changelog("Added", "Add the `heading_offset` option."),
    edit("docs/library.md", "### Tab Length { #tab_length }", "### Heading Offset { #heading_offset }\n\nThe `heading_offset` keyword shifts every heading by that many levels.\n\n### Tab Length { #tab_length }"),
  ];
  const cli = [
    edit("markdown/__main__.py", '    parser.add_option("-q", "--quiet"', '    parser.add_option("--heading-offset", dest="heading_offset", type="int", default=0,\n                      help="Shift every heading by this many levels.")\n    parser.add_option("-q", "--quiet"'),
    edit("markdown/__main__.py", "        'lazy_ol': options.lazy_ol\n", "        'lazy_ol': options.lazy_ol,\n        'heading_offset': options.heading_offset\n"),
    edit("docs/cli.md", "  --noisy               Print debug messages.", "  --heading-offset=N    Shift every heading by N levels.\n  --noisy               Print debug messages."),
    // The CLI tests compare the whole options dict.
    edit("tests/test_apis.py", "            'lazy_ol': True,\n", "            'lazy_ol': True,\n            'heading_offset': 0,\n"),
  ];
  const full = await check("pymd-heading-offset", ...core, ...cli);
  assert.equal(full.ok, true, full.why);
  const noCli = await check("pymd-heading-offset", ...core);
  assert.equal(noCli.partial, true);
  assert.match(noCli.why, /cli|docs/);
});

test("pymd-slug: the real fix; trimming the final dash is partly done", async () => {
  const PLANTED = "    value = re.sub(r'[^\\w\\s-]', '', value).lower()";
  const fix = edit("markdown/extensions/toc.py", PLANTED, "    value = re.sub(r'[^\\w\\s-]', '', value).strip().lower()");
  const regression = put(
    "tests/test_syntax/extensions/test_toc_slug.py",
    "from markdown.test_tools import TestCase\n\n\nclass TestSlug(TestCase):\n\n    def test_trailing_punctuation(self):\n        self.assertMarkdownRenders('# Hello world !', '<h1 id=\"hello-world\">Hello world !</h1>', extensions=['toc'])\n",
  );
  const noted = changelog("Fixed", "Heading ids no longer end with a separator.");
  const full = await check("pymd-slug", fix, regression, noted);
  assert.equal(full.ok, true, full.why);
  const trim = edit(
    "markdown/extensions/toc.py",
    "    return re.sub(r'[{}\\s]+'.format(separator), separator, value)",
    "    return re.sub(r'[{}\\s]+'.format(separator), separator, value).rstrip('-')",
  );
  const symptom = await check("pymd-slug", trim, regression, noted);
  assert.equal(symptom.partial, true);
  assert.match(symptom.why, /leading|separator|unicode/);
});
