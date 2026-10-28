# Python-Markdown (Lab Daily fixture)

This is Python-Markdown 3.11.2. Follow `docs/contributing.md`: tests for new
or changed behavior, documentation updates and a changelog entry, in the
project's code and documentation style.

- Run the tests with `python3 -m unittest discover tests`. They run offline.
  PyYAML is not installed, so the two tests that need it are skipped.
- This checkout is not installed. Extensions load by short name
  (`extensions=['toc']`) through `Markdown-3.11.2.dist-info/entry_points.txt`
  (see `LAB_FIXTURE.md`); a new extension's entry point goes there as well as
  in `pyproject.toml`.
- Do not add dependencies.
