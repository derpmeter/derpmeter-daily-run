// Date boundaries in UTC: the classic off-by-one, checked across the day.
import { cases, changelogNoted, grade } from "../lib/grade.mjs";

const task = {
  id: "expiry-boundary",
  prompt:
    "Bug report: an item that expires tomorrow shows 0 days left in the afternoon. Expiry dates are UTC calendar dates, and an item is good through the end of its expiry date. Make `daysLeft(item, now)` the number of UTC calendar days from the UTC date of `now` to the expiry date (tomorrow is 1, today is 0, yesterday is -1, at any time of day), and make `isExpired` true only when `daysLeft` is below 0.",
  budgetSec: 33,
  allowed: ["src/expiry.js", "CHANGELOG.md"],
  forbidden: ["tests/"],
  async check(ctx) {
    const r = await cases(
      ctx,
      `
      const out = {};
      try {
        const { daysLeft, isExpired } = await import("./src/expiry.js");
        const t = (s) => Date.parse(s);
        const it = { expires: "2026-11-02" };
        out.tomorrow = [t("2026-11-01T00:00:00Z"), t("2026-11-01T12:00:00Z"), t("2026-11-01T23:59:59Z")].every((n) => daysLeft(it, n) === 1);
        out.today = [t("2026-11-02T00:00:00Z"), t("2026-11-02T18:30:00Z")].every((n) => daysLeft(it, n) === 0);
        out.yesterday = daysLeft(it, t("2026-11-03T06:00:00Z")) === -1;
        out.expired = isExpired(it, t("2026-11-02T23:00:00Z")) === false && isExpired(it, t("2026-11-03T00:00:01Z")) === true;
        out.farAndMonth = daysLeft({ expires: "2026-12-01" }, t("2026-11-30T20:00:00Z")) === 1 && daysLeft({ expires: "2027-01-01" }, t("2026-12-31T23:00:00Z")) === 1;
      } catch {}
      console.log(JSON.stringify(out));`,
      ["tomorrow", "today", "yesterday", "expired", "farAndMonth"],
    );
    const t = await ctx.run("npm", ["test"]);
    r.tests = t.code === 0;
    r.changelog = await changelogNoted(ctx);
    return grade(r, { core: ["tomorrow", "today", "tests"], okWhy: "day boundaries right at every time of day, fix noted" });
  },
};

export default task;
