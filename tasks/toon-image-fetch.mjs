// A real SSRF hole in Toonify: wherever the backend loads an image it
// requests any http(s) URL it is given, and users can set those URLs (a cut's
// image_path, the project's style reference, the image to modify). The report
// names the ZIP export only. The check runs two local servers: storage (the
// MinIO endpoint, reached as localhost) and an "internal" service reached as
// 127.0.0.1 that must never be requested. Refusing such URLs when they are set
// or ignoring them when images are loaded both pass; images in storage, given
// as keys or as STORAGE_HOST URLs, and data: URLs must keep working.
// Two follow-ups in the same session: exports report the cuts they skip
// (missing.txt in the ZIP, an X-Missing-Cuts header), then the editor tells
// the user. Only the final state is checked.
import { grade } from "../lib/grade.mjs";
import {
  backendCases, backendSuite, backendTestsAdded, changedFrontend, changelogNoted, importGraph,
  keysResolve, linkDeps, messages, pageChain, sameKeys, samePlaceholders, typecheck,
} from "../lib/toonify.mjs";

const EDITOR = "frontend/src/app/[locale]/project/[projectId]/editor/page.tsx";

const SERVERS = `
import http.server, threading, os as _os
HITS = []
SECRET = b"internal-secret-7c1f"
class _Internal(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        HITS.append(self.path)
        self.send_response(200); self.send_header("Content-Type", "image/png"); self.end_headers()
        self.wfile.write(PNG + SECRET)
    do_POST = do_GET
    def log_message(self, *a): pass
class _Storage(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        bucket, _, key = self.path.lstrip("/").partition("/")
        body = FakeMinio.objects.get(bucket, {}).get(key)
        if body is None:
            self.send_response(404); self.end_headers(); return
        self.send_response(200); self.send_header("Content-Type", "image/png"); self.end_headers()
        self.wfile.write(body)
    def log_message(self, *a): pass
def _serve(h):
    s = http.server.ThreadingHTTPServer(("127.0.0.1", 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s.server_address[1]
INTERNAL = f"http://127.0.0.1:{_serve(_Internal)}"
_os.environ["MINIO_ENDPOINT"] = f"localhost:{_serve(_Storage)}"
_os.environ.pop("STORAGE_HOST", None)
`;

const task = {
  id: "toon-image-fetch",
  fixture: "toonify",
  prompt: [
    "Security report: `POST /api/v1/episodes/{id}/export?format=zip` downloads whatever URL a cut's `image_path` holds. Set it with `PUT /api/v1/cuts/{id}` to an address inside our network and the ZIP contains that server's response.",
    "Fix it everywhere the backend loads an image from a URL a user can set, not only the export: the backend must never request such an address. Images in our storage and data: URLs keep working. Add tests.",
  ].join("\n"),
  followUps: [
    [
      "Exports now skip cuts silently. Say which: when an export leaves out cuts (no image yet, an address it refuses, or an image that cannot be loaded), the ZIP gets a `missing.txt` with their cut numbers, one per line, and both export formats send the header `X-Missing-Cuts` with the numbers separated by commas. With nothing missing there is no `missing.txt` and no header.",
      "Add tests.",
    ].join("\n"),
    "In the editor, after an export that left out cuts, tell the user which cut numbers are missing. Both languages.",
  ],
  budgetSec: 680,
  allowed: ["backend/app/", "backend/tests/", "frontend/src/", "frontend/messages/", "docs/", "CHANGELOG.md"],
  forbidden: [],
  async setup(ctx) {
    await linkDeps(ctx);
  },
  async check(ctx) {
    const r = await backendCases(
      ctx,
      `
import io, zipfile, base64
from app.core.config import settings
from app.services.storage import storage
a = signup("ana@example.com")
P = "/api/v1"
pid = client.post(P + "/projects", headers=a, json={"title": "Night Bus", "genres": []}).json()["id"]
eid = client.post(P + "/episodes", headers=a, json={"title": "Ep 1", "project_id": pid, "episode_order": 1}).json()["id"]
def cut(order, path):
    uid = client.post(P + "/cuts", headers=a, json={"episode_id": eid, "cut_order": order, "script": "Rain."}).json()["id"]
    res = client.put(f"{P}/cuts/{uid}", headers=a, json={"image_path": path})
    return uid, res.status_code
def hit(fn):
    n = len(HITS); fn(); return len(HITS) > n
def zip_names():
    res = client.post(f"{P}/episodes/{eid}/export?format=zip", headers=a)
    if res.status_code != 200: return res.status_code, {}
    z = zipfile.ZipFile(io.BytesIO(res.content))
    return 200, {n: z.read(n) for n in z.namelist()}
# Images in storage: a key, a full STORAGE_HOST URL, a data: URL.
key = storage.upload_image(PNG + b"key", schema="cuts", identifier="k")
url_key = storage.upload_image(PNG + b"url", schema="cuts", identifier="u")
data = "data:image/png;base64," + base64.b64encode(PNG + b"data").decode()
cut(1, key); cut(2, f"{settings.STORAGE_HOST}/{url_key}"); cut(3, data)
code, files = zip_names()
out["kept"] = code == 200 and sorted(files.values()) == sorted([PNG + b"key", PNG + b"url", PNG + b"data"])
out["webtoon"] = client.post(f"{P}/episodes/{eid}/export?format=webtoon", headers=a).status_code == 200
# The reported hole: an internal address in image_path.
bad, _ = cut(4, f"{INTERNAL}/latest/meta-data")
reported = []
reported.append(not hit(lambda: zip_names()))
code, files = zip_names()
reported.append(not any(SECRET in v for v in files.values()))
out["reported"] = all(reported)
out["webtoonSafe"] = not hit(lambda: client.post(f"{P}/episodes/{eid}/export?format=webtoon", headers=a))
# Elsewhere: the image to modify, the project's style reference, the previous cut.
out["modify"] = not hit(lambda: client.post(P + "/scenes/modify", headers=a, json={"project_id": pid, "original_image_url": f"{INTERNAL}/m", "instruction": "darker"}))
def cover():
    client.patch(f"{P}/projects/{pid}", headers=a, json={"style_reference_url": f"{INTERNAL}/style"})
    client.post(f"{P}/projects/{pid}/cover", headers=a)
out["style"] = not hit(cover)
client.patch(f"{P}/projects/{pid}", headers=a, json={"style_reference_url": None})
nxt, _ = cut(5, None)
out["previous"] = not hit(lambda: client.post(f"{P}/episodes/{eid}/cuts/{nxt}/generate-image", headers=a, json={"use_previous_context": True}))
# Storage images still reach the image model.
FakeGemini.calls.clear()
res = client.post(P + "/scenes/modify", headers=a, json={"project_id": pid, "original_image_url": f"{settings.STORAGE_HOST}/{url_key}", "instruction": "darker"})
out["modifyKept"] = res.status_code == 200 and len(FakeGemini.calls) > 0
# Missing cuts: 1 stored, 2 an internal address, 3 no image, 4 a key with no object.
e2 = client.post(P + "/episodes", headers=a, json={"title": "Ep 2", "project_id": pid, "episode_order": 2}).json()["id"]
def cut2(order, path):
    uid = client.post(P + "/cuts", headers=a, json={"episode_id": e2, "cut_order": order, "script": "Fog."}).json()["id"]
    if path: client.put(f"{P}/cuts/{uid}", headers=a, json={"image_path": path})
cut2(1, key); cut2(2, f"{INTERNAL}/x"); cut2(3, None); cut2(4, "cuts/none/gone.png")
nums = lambda v: sorted(x.strip() for x in (v or "").replace("\\n", ",").split(",") if x.strip())
res = client.post(f"{P}/episodes/{e2}/export?format=zip", headers=a)
listed = []
if res.status_code == 200:
    z = zipfile.ZipFile(io.BytesIO(res.content))
    names = z.namelist()
    listed = nums(z.read("missing.txt").decode()) if "missing.txt" in names else []
    out["missingZip"] = listed == ["2", "3", "4"] and nums(res.headers.get("x-missing-cuts")) == ["2", "3", "4"] \
        and [z.read(n) for n in names if n != "missing.txt"] == [PNG + b"key"]
res = client.post(f"{P}/episodes/{e2}/export?format=webtoon", headers=a)
out["missingWebtoon"] = res.status_code == 200 and nums(res.headers.get("x-missing-cuts")) == ["2", "3", "4"]
# Nothing missing: no file, no header.
e3 = client.post(P + "/episodes", headers=a, json={"title": "Ep 3", "project_id": pid, "episode_order": 3}).json()["id"]
uid = client.post(P + "/cuts", headers=a, json={"episode_id": e3, "cut_order": 1, "script": "Dawn."}).json()["id"]
client.put(f"{P}/cuts/{uid}", headers=a, json={"image_path": key})
res = client.post(f"{P}/episodes/{e3}/export?format=zip", headers=a)
out["missingNone"] = res.status_code == 200 and "x-missing-cuts" not in res.headers \
    and zipfile.ZipFile(io.BytesIO(res.content)).namelist() != [] \
    and "missing.txt" not in zipfile.ZipFile(io.BytesIO(res.content)).namelist()
`,
      ["kept", "webtoon", "reported", "webtoonSafe", "modify", "style", "previous", "modifyKept", "missingZip", "missingWebtoon", "missingNone"],
      {},
      SERVERS,
    );
    r.suite = await backendSuite(ctx);
    r.tests = await backendTestsAdded(ctx, ["export", "image_path", "url"]);
    r.missingTests = await backendTestsAdded(ctx, ["missing"]);
    // The editor (or what it imports) reads the header.
    const g = await importGraph(ctx);
    r.ui = [...g.reach(pageChain(EDITOR))].some((f) => /x-missing-cuts/i.test(g.src[f]));
    const msgs = await messages(ctx);
    r.keys = sameKeys(msgs) && (await keysResolve(ctx, await changedFrontend(ctx), msgs));
    r.placeholders = samePlaceholders(msgs);
    r.typecheck = await typecheck(ctx);
    r.changelog = await changelogNoted(ctx);
    return grade(r, {
      core: [
        "kept", "webtoon", "reported", "webtoonSafe", "modify", "style", "previous", "modifyKept",
        "missingZip", "missingWebtoon", "missingNone", "suite", "ui", "keys", "placeholders", "typecheck",
      ],
      okWhy: "no user-set URL is requested, stored images work, skipped cuts reported and shown in the editor, tests and changelog",
    });
  },
};
export default task;
