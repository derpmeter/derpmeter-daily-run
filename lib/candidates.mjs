// New models approved from DerpMeter's release watch (public.lab_candidates).
// Right before a daily run each pending one is tried in its CLI; when the CLI
// answers with that model it joins grid.json from this run on, with a
// changelog entry and a public.lab_changes row. Not part of the grader.

// A short request that only checks the CLI serves the model.
const PING = "Reply with the single word OK.";
export function probeCommand(agent, model, bins = {}) {
  if (agent === "claude-code")
    return [
      bins.claude || "claude",
      ["-p", PING, "--model", model, "--output-format", "json", "--setting-sources", "project", "--strict-mcp-config", "--no-session-persistence"],
    ];
  if (agent === "codex")
    return [
      bins.codex || "codex",
      ["exec", "-m", model, "--sandbox", "read-only", "--ephemeral", "--ignore-user-config", "--skip-git-repo-check", "--json", PING],
    ];
  return null;
}

// Did the CLI answer with that model? Claude Code names the models it used;
// Codex fails on a model it does not serve; Antigravity lists what it serves
// (the grid pins Gemini models to an effort, so that id must be served).
export function probeAnswered(agent, model, { code, stdout }, served = new Set(), efforts = []) {
  if (agent === "gemini-cli")
    return (efforts.length ? efforts : [""]).every((e) => served.has(e ? `${model}-${e}` : model));
  if (code !== 0) return false;
  if (agent === "claude-code") {
    const last = String(stdout).trim().split("\n").at(-1);
    try {
      const r = JSON.parse(last);
      // An unknown model is an API error; modelUsage, when present, names it.
      if (r.is_error) return false;
      return !r.modelUsage || Object.keys(r.modelUsage).some((k) => k.startsWith(model));
    } catch {
      return false;
    }
  }
  if (agent === "codex") {
    const lines = String(stdout).split("\n");
    return (
      lines.some((l) => l.includes('"type":"turn.completed"')) &&
      !lines.some((l) => /"type":"(error|turn\.failed)"/.test(l))
    );
  }
  return false;
}

export function addToGrid(grid, agent, model) {
  const g = (grid[agent] ??= { models: [] });
  if (!g.models.includes(model)) g.models.push(model);
  return grid;
}

// The changelog heading and anchor GitHub gives it ("2026-11-18 · X added").
export function changelogEntry({ date, title, model, agent, cli, version, run, efforts }) {
  const heading = `## ${date} · ${title} added`;
  const effort = efforts?.length ? `pinned to ${efforts.join(", ")} like the other ${cli} models` : "at the model default effort";
  const body = `- Added automatically: ${cli} ${version ?? ""} answered \`${model}\` right before run \`${run}\`, which is its first run. It runs ${effort}. Found by DerpMeter's release watch and approved by the maintainer.`.replace("  ", " ");
  const anchor = heading
    .slice(3)
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/ /g, "-");
  return { text: `${heading}\n\n${body}\n`, anchor };
}

// Inserts an entry under the changelog's intro (newest first).
export function prependEntry(changelog, entry) {
  const i = changelog.indexOf("\n## ");
  return i < 0 ? `${changelog.trimEnd()}\n\n${entry}` : `${changelog.slice(0, i + 1)}${entry}\n${changelog.slice(i + 1)}`;
}

// Supabase REST with the service role (the runner's .env).
export function rest(url, key) {
  return async (path, init = {}) => {
    const r = await fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init.headers },
    });
    if (!r.ok) throw new Error(`${path.split("?")[0]} ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return r.status === 204 || init.method === "PATCH" || init.method === "POST" ? null : r.json();
  };
}
