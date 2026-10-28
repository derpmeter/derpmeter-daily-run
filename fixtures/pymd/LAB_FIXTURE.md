# Changes made for the Lab Daily fixture

Python-Markdown 3.11.2 (BSD 3-Clause, see `LICENSE.md`), copied from
https://github.com/Python-Markdown/markdown at tag 3.11.2, with:

- `Markdown-3.11.2.dist-info/`: entry points, so extensions load by short
  name (`extensions=['toc']`) without installing the package.
- `tests/test_apis.py`: PyYAML is optional; its two tests skip without it.
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`: how to run the tests here.
