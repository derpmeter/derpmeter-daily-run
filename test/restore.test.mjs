import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { sanitize } from "../lib/lab.mjs";
import { restoreDecorators } from "../lib/restore.mjs";

const blob = (t) => createHash("sha1").update(`blob ${Buffer.byteLength(t)}\0`).update(t).digest("hex");
const mask = (s) => s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "<email>"); // the old sanitize

test("sanitize keeps diff markers, decorators and reserved example addresses", () => {
  const s = (v) => sanitize(v, { workspace: "/w", home: "/h" });
  assert.equal(s("+@router.get(\"/x\")"), "+@router.get(\"/x\")");
  assert.equal(s("-@pytest.mark.parametrize"), "-@pytest.mark.parametrize");
  assert.equal(s('signup(email="bo@example.com")'), 'signup(email="bo@example.com")');
  assert.equal(s("a@b.test and c@x.example.org"), "a@b.test and c@x.example.org");
  assert.equal(s("mail me@gmail.com, x+tag@corp.io"), "mail <email>, <email>");
});

test("restoreDecorators puts back masked column-0 decorators, verified by blob hash", () => {
  const old = "from x import router\n\n@router.get(\"/a\")\ndef a():\n    pass\n";
  const neu = old + "\n@router.post(\"/b\")\ndef b():\n    pass\n";
  const diff = [
    "diff --git a/app/r.py b/app/r.py",
    `index ${blob(old).slice(0, 7)}..${blob(neu).slice(0, 7)} 100644`,
    "--- a/app/r.py",
    "+++ b/app/r.py",
    "@@ -3,3 +3,7 @@ from x import router",
    " @router.get(\"/a\")",
    " def a():",
    "     pass",
    "+",
    "+@router.post(\"/b\")",
    "+def b():",
    "+    pass",
    "",
  ].join("\n");
  const masked = mask(diff);
  assert.notEqual(masked, diff);
  const sources = new Map([["app/r.py", old]]);
  assert.equal(restoreDecorators(masked, sources), diff);
  // A new file is checked the same way.
  const add = ["diff --git a/app/n.py b/app/n.py", "new file mode 100644", `index 0000000..${blob("@router.put\nx\n").slice(0, 7)}`, "--- /dev/null", "+++ b/app/n.py", "@@ -0,0 +1,2 @@", "+@router.put", "+x", ""].join("\n");
  assert.equal(restoreDecorators(mask(add), sources), add);
  // No candidate matches the hash: left as it was.
  const odd = add.replace("@router.put", "@weird.thing").replace(blob("@router.put\nx\n").slice(0, 7), blob("@weird.thing\nx\n").slice(0, 7));
  assert.equal(restoreDecorators(mask(odd), sources), mask(odd));
});
