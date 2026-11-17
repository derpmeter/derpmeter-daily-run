// A full-stack feature in Toonify, then two follow-ups in the same session:
// duplicate an episode; then keep episode order dense (a copy goes right
// after its original, a delete closes the gap); then restore a deleted
// episode to its old place, with Undo on the Episodes page. Only the final
// state is checked: the first request's rules that the follow-ups did not
// change still hold. The backend is checked through the API; the page through
// the routes it calls, its text in both locales and the type check. The images may be shared or copied;
// either way each episode must keep showing its own after the other changes.
// A copy of a cut or episode that was mid-generation must not stay
// "generating" forever (no job runs for the copy): an extra case.
import { grade } from "../lib/grade.mjs";
import {
  backendCases, backendSuite, backendTestsAdded, changedFrontend, changelogNoted, importGraph,
  keysResolve, linkDeps, messages, pageChain, sameKeys, samePlaceholders, typecheck,
} from "../lib/toonify.mjs";

const PAGE = "frontend/src/app/[locale]/project/[projectId]/episodes/page.tsx";

const task = {
  id: "toon-episode-copy",
  fixture: "toonify",
  prompt: [
    "Users want to duplicate an episode, to try another take without losing the original.",
    "- Add `POST /api/v1/episodes/{id}/duplicate`, returning the new episode. The copy goes after the project's other episodes, its title marks it as a copy, and it keeps the summary and the same cuts in the same order, with their scripts, dialogues, layouts, characters and images. Changing or deleting either episode afterwards never affects the other. Duplicating is free. Only members of the episode's workspace may duplicate it; to anyone else the episode does not exist (404).",
    "- On the project's Episodes page, every episode gets a Duplicate action next to Delete, and the copy shows up in the list without a reload. Both languages.",
    "Add tests.",
  ].join("\n"),
  followUps: [
    [
      "Change of plan for the order: a copy goes right after its original, and the episodes after it move down one place. Deleting an episode closes the gap. A project's episodes are always numbered 1, 2, 3… with no gaps or repeats, and the list API returns them in that order.",
      "Keep the tests up to date.",
    ].join("\n"),
    [
      "Users delete episodes by mistake. Add `POST /api/v1/episodes/{id}/restore`: a deleted episode comes back with its cuts at the place it had, and the episodes from there on move down one place. Only members of its workspace may restore it; to anyone else it does not exist (404).",
      "On the Episodes page, the message shown after a delete offers Undo, which restores the episode. Both languages. Add tests.",
    ].join("\n"),
  ],
  budgetSec: 1080,
  allowed: ["backend/app/", "backend/tests/", "frontend/src/", "frontend/messages/", "docs/", "CHANGELOG.md"],
  forbidden: [],
  async setup(ctx) {
    await linkDeps(ctx);
  },
  async check(ctx) {
    const r = await backendCases(
      ctx,
      `
import base64
from sqlmodel import Session as _S
from app.core.config import settings
from app.models.models import StoryCut as _C, Episode as _E
from app.services.storage import storage
P = "/api/v1"
a = signup("ana@example.com"); b = signup("bo@example.com")
get = lambda p, h=a: client.get(P + p, headers=h)
pid = client.post(P + "/projects", headers=a, json={"title": "Night Bus", "genres": []}).json()["id"]
mk = lambda t, o: client.post(P + "/episodes", headers=a, json={"title": t, "project_id": pid, "episode_order": o, "story_summary": "The last bus."}).json()["id"]
eid = mk("Ep 1", 1); other = mk("Ep 2", 2)
key = storage.upload_image(PNG + b"one", schema="cuts", identifier="x")
data = "data:image/png;base64," + base64.b64encode(PNG + b"two").decode()
cuts = [
    {"cut_order": 1, "script": "Rain.", "selected_layout": "single", "aspect_ratio": "1:1", "dialogues": [{"speaker": "Mina", "text": "Late again."}], "appearing_characters": [{"id": "c1", "name": "Mina"}], "image_path": key},
    {"cut_order": 2, "script": "The bus.", "selected_layout": "wide", "aspect_ratio": "16:9", "dialogues": [], "appearing_characters": [], "refer_prev_cut": False, "image_path": data},
    {"cut_order": 3, "script": "Doors open.", "selected_layout": "single", "aspect_ratio": "4:5", "dialogues": [{"speaker": "Driver", "text": "Last stop."}], "appearing_characters": []},
]
for c in cuts:
    uid = client.post(P + "/cuts", headers=a, json={"episode_id": eid, **{k: v for k, v in c.items() if k != "image_path"}}).json()["id"]
    if c.get("image_path"): client.put(f"{P}/cuts/{uid}", headers=a, json={"image_path": c["image_path"]})
with _S(engine) as s:
    e = s.get(_E, __import__("uuid").UUID(eid)); e.background_info = "Seoul, 2 a.m."; e.character_outfits = {"Mina": "yellow raincoat"}; s.add(e); s.commit()
FIELDS = ("script", "selected_layout", "aspect_ratio", "dialogues", "appearing_characters", "refer_prev_cut")
def image(path):
    if not path: return None
    if path.startswith("data:"): return base64.b64decode(path.split(",", 1)[1])
    host = settings.STORAGE_HOST.rstrip("/") + "/"
    return storage.download_image(path[len(host):] if path.startswith(host) else path)
def shape(episode):
    cs = sorted(get(f"/cuts?episode_id={episode}").json(), key=lambda c: c["cut_order"])
    return [tuple([c[f] for f in FIELDS] + [image(c.get("image_path"))]) for c in cs]
original = shape(eid)
c0 = credits(a)
# A stranger cannot copy it, and nothing is created.
before = len(get(f"/episodes?project_id={pid}").json())
res = client.post(f"{P}/episodes/{eid}/duplicate", headers=b)
out["guard"] = res.status_code in (403, 404) and len(get(f"/episodes?project_id={pid}").json()) == before
out["missing"] = client.post(f"{P}/episodes/{__import__('uuid').uuid4()}/duplicate", headers=a).status_code == 404
res = client.post(f"{P}/episodes/{eid}/duplicate", headers=a)
new = res.json().get("id") if res.status_code in (200, 201) else None
out["created"] = bool(new) and str(new) != eid
def listing():
    return get(f"/episodes?project_id={pid}").json()
def dense(titles=None):
    l = listing()
    ok = [e["episode_order"] for e in l] == list(range(1, len(l) + 1))
    return ok and (titles is None or [e["title"] for e in l] == titles)
copy = next((e for e in listing() if e["id"] == str(new)), {})
title = copy.get("title", "")
out["listed"] = bool(copy) and title != "Ep 1" and "Ep 1" in title and copy.get("story_summary") == "The last bus."
order = [dense(["Ep 1", title, "Ep 2"])]
out["cuts"] = out["created"] and shape(new) == original and len(original) == 3 and original[0][-1] == PNG + b"one"
out["free"] = credits(a) == c0
out["context"] = copy.get("background_info") == "Seoul, 2 a.m." and copy.get("character_outfits") == {"Mina": "yellow raincoat"}
# Independent: edit the copy, delete the original; then copy the copy.
if out["created"]:
    first = sorted(get(f"/cuts?episode_id={new}").json(), key=lambda c: c["cut_order"])[0]["id"]
    client.put(f"{P}/cuts/{first}", headers=a, json={"script": "Snow.", "image_path": data})
    client.delete(f"{P}/cuts/{sorted(get(f'/cuts?episode_id={new}').json(), key=lambda c: c['cut_order'])[-1]['id']}", headers=a)
    kept = shape(eid) == original
    client.delete(f"{P}/episodes/{eid}", headers=a)
    order.append(dense([title, "Ep 2"]))
    after = shape(new)
    out["independent"] = kept and len(after) == 2 and after[0][0] == "Snow." and after[1] == original[1]
    res = client.post(f"{P}/episodes/{new}/duplicate", headers=a)
    second = res.json().get("title", "") if res.status_code in (200, 201) else ""
    out["again"] = res.status_code in (200, 201) and shape(res.json()["id"]) == after
    order.append(dense([title, second, "Ep 2"]))
out["order"] = all(order) and len(order) == 3
# Mid-generation: the copy must not stay "generating" (no job runs for it).
gid = mk("Ep 3", len(listing()) + 1)
uid = client.post(P + "/cuts", headers=a, json={"episode_id": gid, "cut_order": 1, "script": "Fog."}).json()["id"]
with _S(engine) as s:
    for m, i in ((_E, gid), (_C, uid)):
        o = s.get(m, __import__("uuid").UUID(i)); o.status = "generating"; s.add(o)
    s.commit()
res = client.post(f"{P}/episodes/{gid}/duplicate", headers=a)
if res.status_code in (200, 201):
    g = res.json()["id"]
    out["stuck"] = get(f"/episodes/{g}").json().get("status") != "generating" \
        and all(c["status"] != "generating" for c in get(f"/cuts?episode_id={g}").json())
# Restore: Ep 2 (third) is deleted, then comes back to its place with its cuts.
titles = [e["title"] for e in listing()]
ep2 = next(e["id"] for e in listing() if e["title"] == "Ep 2")
client.post(P + "/cuts", headers=a, json={"episode_id": ep2, "cut_order": 1, "script": "Terminus."})
place = titles.index("Ep 2")
client.delete(f"{P}/episodes/{ep2}", headers=a)
gone = dense([t for t in titles if t != "Ep 2"])
stranger = client.post(f"{P}/episodes/{ep2}/restore", headers=b)
out["restoreGuard"] = stranger.status_code in (403, 404) and "Ep 2" not in [e["title"] for e in listing()]
res = client.post(f"{P}/episodes/{ep2}/restore", headers=a)
back = dense(titles)
out["restore"] = gone and res.status_code in (200, 201, 204) and back \
    and [c["script"] for c in get(f"/cuts?episode_id={ep2}").json()] == ["Terminus."]
n = len(listing())
client.post(f"{P}/episodes/{ep2}/restore", headers=a)
out["restoreLive"] = len(listing()) == n and dense(titles) \
    and client.post(f"{P}/episodes/{__import__('uuid').uuid4()}/restore", headers=a).status_code == 404
`,
      ["guard", "missing", "created", "listed", "cuts", "free", "context", "independent", "again", "order", "stuck", "restore", "restoreGuard", "restoreLive"],
    );
    r.suite = await backendSuite(ctx);
    r.tests = (await backendTestsAdded(ctx, ["duplicate"])) && (await backendTestsAdded(ctx, ["restore"]));
    // The Episodes page (or what it imports) calls the new route.
    const g = await importGraph(ctx);
    const live = g.reach(pageChain(PAGE));
    const calls = (route) => [...live].some((f) => new RegExp(`[\`'"][^\`'"\\n]*/${route}\\b`).test(g.src[f]));
    r.ui = calls("duplicate");
    r.undo = calls("restore");
    const msgs = await messages(ctx);
    r.keys = sameKeys(msgs) && (await keysResolve(ctx, await changedFrontend(ctx), msgs));
    r.placeholders = samePlaceholders(msgs);
    r.typecheck = await typecheck(ctx);
    r.changelog = await changelogNoted(ctx);
    return grade(r, {
      core: [
        "guard", "missing", "created", "listed", "cuts", "free", "independent", "again", "order",
        "restore", "restoreGuard", "restoreLive", "suite", "ui", "undo", "keys", "placeholders", "typecheck",
      ],
      okWhy: "copy, dense order and restore all work together, guarded, page actions in both languages, tests and changelog",
    });
  },
};
export default task;
