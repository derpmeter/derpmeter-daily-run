// A real billing bug in Toonify: every paid route charges before the AI call
// and keeps the credits when the call fails, whether the route answers with
// an error or a background task marks the item failed. The report names the
// cover only. A failed call must cost nothing; a route that still answers 200
// with fallback content may charge or not. Successful calls stay charged.
// Two follow-ups in the same session: a credit history API (charges and
// refunds both listed), then that history on the Settings page. Only the
// final state is checked. Charging only on success is as good as refunding:
// a failed call then leaves no entry at all, or a charge and its refund.
import { grade } from "../lib/grade.mjs";
import {
  backendCases, backendSuite, backendTestsAdded, changedFrontend, changelogNoted, importGraph,
  keysResolve, linkDeps, messages, pageChain, sameKeys, samePlaceholders, typecheck,
} from "../lib/toonify.mjs";

const SETTINGS = "frontend/src/app/[locale]/dashboard/settings/page.tsx";

const task = {
  id: "toon-failed-charges",
  fixture: "toonify",
  prompt: [
    "Support ticket: \"My project cover came back as failed, and 15 credits were gone anyway. Same thing happened earlier with a character sheet.\"",
    "Users must not pay for AI work that failed. Fix it everywhere credits are charged, not only for covers. Add tests.",
  ].join("\n"),
  followUps: [
    [
      "Users want to see where their credits went. Add `GET /api/v1/workspaces/{id}/credits/history`: the workspace's credit changes, newest first, with every charge, refund and daily refill. Each item has `amount` (negative for a charge), `action` and `created_at`. A refunded charge and its refund both appear.",
      "Only members of the workspace may read it; to anyone else the workspace does not exist (404). Add tests.",
    ].join("\n"),
    "On the Settings page, under the credit balance, show this history: when, what it was for, and the amount, with refunds marked as refunds. Both languages.",
  ],
  budgetSec: 1330,
  allowed: ["backend/app/", "backend/tests/", "frontend/src/", "frontend/messages/", "docs/", "CHANGELOG.md"],
  forbidden: [],
  async setup(ctx) {
    await linkDeps(ctx);
  },
  async check(ctx) {
    const r = await backendCases(
      ctx,
      `
from sqlmodel import Session as _S
from app.models.models import Workspace as _W
a = signup("ana@example.com")
pid = client.post("/api/v1/projects", headers=a, json={"title": "Night Bus", "genres": []}).json()["id"]
cid = client.post("/api/v1/characters", headers=a, json={"name": "Mina", "project_id": pid}).json()["id"]
def set_credits(n):
    with _S(engine) as s:
        for w in s.exec(__import__("sqlmodel").select(_W)).all():
            w.credits = n; s.add(w)
        s.commit()
P = "/api/v1"
# Each route: (name, method path, body, how its failure shows).
routes = [
    ("cover", f"/projects/{pid}/cover", None, "proj"),
    ("sheet", f"/characters/{cid}/generate", None, "char"),
    ("casting", f"/projects/{pid}/characters/casting/generate", {"character_id": cid, "name": "Mina", "description": "x", "style": "ink"}, "char"),
    ("worldview", "/projects/worldview/augment", {"title": "Night Bus", "description": "A city", "genres": []}, None),
    ("augment", "/characters/augment", {"project_id": pid, "name": "Mina", "tags": ["calm"], "mood": ["dark"]}, None),
    ("suggest", "/characters/suggest", {"project_id": pid, "type": "lore", "current_name": "Mina"}, None),
    ("batch", "/characters/suggestions/batch", {"project_id": pid}, None),
    ("structure", "/scenes/structure", {"project_id": pid, "script": "Rain falls."}, None),
    ("modify", "/scenes/modify", {"project_id": pid, "original_image_url": "data:image/png;base64,AA==", "instruction": "darker"}, None),
    ("render", "/scenes/render", {"project_id": pid, "prompt": "rain"}, None),
    ("castAugment", f"/projects/{pid}/characters/casting/augment", {"name": "Mina", "tags": ["calm"], "mood": "dark", "style": "ink"}, None),
    ("ideas", f"/projects/{pid}/episodes/ideas", {}, None),
    ("episode", f"/projects/{pid}/episodes/create", {"project_id": pid, "title": "E", "summary": "x", "num_cuts": 2}, None),
]
def state(kind):
    if kind == "proj": return client.get(f"{P}/projects/{pid}", headers=a).json().get("cover_image_status")
    if kind == "char": return client.get(f"{P}/characters/{cid}", headers=a).json().get("sheet_status")
def call(path, body):
    return client.post(P + path, headers=a, json=body)
# Gemini down: a call that fails (an error answer, or the item marked failed) costs nothing.
FakeGemini.fail = True
failed = {}
for name, path, body, kind in routes:
    c0 = credits(a)
    res = call(path, body)
    lost = res.status_code >= 500 or (res.status_code < 400 and kind and state(kind) == "failed")
    failed[name] = (lost, credits(a) == c0)
out["reported"] = failed["cover"] == (True, True)
out["background"] = all(failed[n] == (True, True) for n in ("sheet", "casting"))
sync = [n for n, _, _, k in routes if not k]
out["sync"] = all(failed[n][1] for n in sync if failed[n][0]) and sum(failed[n][0] for n in sync) >= 5
# Gemini up: images that come back are still paid for, at the listed price.
FakeGemini.fail = False
paid = {"cover": 15, "sheet": 20, "render": 12, "modify": 8}
ok = True
for name, path, body, kind in routes:
    if name not in paid: continue
    c0 = credits(a)
    res = call(path, body)
    ok = ok and res.status_code == 200 and (not kind or state(kind) == "completed") and c0 - credits(a) == paid[name]
out["charged"] = ok
# Too few credits: refused as before, nothing taken, Gemini never asked.
set_credits(3)
n = len(FakeGemini.calls)
res = call(f"/projects/{pid}/cover", None)
out["insufficient"] = 400 <= res.status_code < 500 and credits(a) == 3 and len(FakeGemini.calls) == n
# History: a failed cover shows its charge and its refund, newest first; then a paid render.
wid = client.get(P + "/workspaces", headers=a).json()[0]["id"]
client.get(f"{P}/workspaces/{wid}", headers=a)  # today's refill, before the scenario
set_credits(100)
def history():
    res = client.get(f"{P}/workspaces/{wid}/credits/history", headers=a)
    items = res.json() if res.status_code == 200 else []
    items = items.get("items", items) if isinstance(items, dict) else items
    return [i for i in items if isinstance(i, dict)]
n0 = len(history())
FakeGemini.fail = True
call(f"/projects/{pid}/cover", None)
FakeGemini.fail = False
call("/scenes/render", {"project_id": pid, "prompt": "rain"})
items = history()
amounts = [i.get("amount") for i in items[: len(items) - n0]]
out["history"] = amounts in ([-12], [-12, 15, -15]) \
    and all(isinstance(i.get("action"), str) and i.get("created_at") for i in items[:3]) \
    and [i["created_at"] for i in items] == sorted((i["created_at"] for i in items), reverse=True)
b = signup("bo@example.com")
out["historyGuard"] = client.get(f"{P}/workspaces/{wid}/credits/history", headers=b).status_code in (403, 404)
`,
      ["reported", "background", "sync", "charged", "insufficient", "history", "historyGuard"],
    );
    r.suite = await backendSuite(ctx);
    r.tests = await backendTestsAdded(ctx, ["credit", "fail"]);
    r.historyTests = await backendTestsAdded(ctx, ["history"]);
    // The Settings page (or what it imports) reads the history.
    const g = await importGraph(ctx);
    r.ui = [...g.reach(pageChain(SETTINGS))].some((f) => /[`'"][^`'"\n]*\/credits\/history\b/.test(g.src[f]));
    const msgs = await messages(ctx);
    r.keys = sameKeys(msgs) && (await keysResolve(ctx, await changedFrontend(ctx), msgs));
    r.placeholders = samePlaceholders(msgs);
    r.typecheck = await typecheck(ctx);
    r.changelog = await changelogNoted(ctx);
    return grade(r, {
      core: [
        "reported", "background", "sync", "charged", "insufficient", "history", "historyGuard",
        "suite", "ui", "keys", "placeholders", "typecheck",
      ],
      okWhy: "failed AI calls cost nothing, history lists charges and refunds, shown in Settings in both languages, tests and changelog",
    });
  },
};
export default task;
