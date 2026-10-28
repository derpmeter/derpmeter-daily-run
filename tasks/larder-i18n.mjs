// Content negotiation plus a complete translation; params must survive.
import { LARDER_PRELUDE } from "../lib/larder.mjs";
import { cases, changelogNoted, grade } from "../lib/grade.mjs";

const task = {
  id: "larder-i18n",
  fixture: "larder",
  prompt:
    "Answer in the client's language: choose it from the request's `Accept-Language` header (`ko` or `en`, honoring q-values and region tags such as `ko-KR`; anything else falls back to `LARDER_LANG`), and give every error code a Korean message.",
  budgetSec: 150,
  allowed: ["src/", "docs/API.md", "README.md", "CHANGELOG.md"],
  forbidden: ["tests/", "data/"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `${LARDER_PRELUDE}
      const { CODES } = await import("./src/errors.js");
      const { messageKeys, t } = await import("./src/i18n/messages.js");
      const ask = async (lang, path = "/items/99", extra = {}) => (await mk().handle({ path, headers: lang === null ? {} : { "accept-language": lang }, ...extra })).body?.error?.message;
      try {
        const ko = await ask("ko"); const en = await ask("en");
        out.basic = hangul(ko) && ko.includes("99") && !hangul(en) && en.includes("99");
        out.qValues = hangul(await ask("en;q=0.4, ko;q=0.9")) && !hangul(await ask("fr, en;q=0.5, ko;q=0.1"));
        out.region = hangul(await ask("ko-KR,ko;q=0.9,en;q=0.8"));
        out.fallback = !hangul(await ask("fr")) && !hangul(await ask(null));
        out.allCodes = Object.keys(CODES).every((c) => messageKeys("ko").includes(c) && hangul(t(c, "ko")));
        const cook = await mk().handle({ method: "POST", path: "/recipes/2/cook", body: { portions: 100 }, headers: { "accept-language": "ko" } });
        const msg = cook.body?.error?.message ?? "";
        out.params = hangul(msg) && msg.includes("10") && !msg.includes("{");
      } catch (e) { out.crash = String(e).slice(0, 80); }
      console.log(JSON.stringify(out));`,
      ["basic", "qValues", "region", "fallback", "allCodes", "params"],
    );
    r.apiDoc = /accept-language/i.test(await ctx.read("docs/API.md").catch(() => ""));
    r.tests = (await ctx.run("npm", ["test"])).code === 0;
    r.lint = (await ctx.run("npm", ["run", "lint"])).code === 0;
    r.changelog = await changelogNoted(ctx, "larder");
    return grade(r, { core: ["basic", "tests"], okWhy: "language negotiation and every message in Korean" });
  },
};

export default task;
