// Settings from the environment, read once. Every setting has a default so
// the service and the tests run without any.
const env = process.env;

function intSetting(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max)
    throw new Error(`${name} must be a whole number from ${min} to ${max}.`);
  return n;
}

/** Service settings (port, data file, alert windows, default language). */
export const config = Object.freeze({
  port: intSetting("LARDER_PORT", 4400, { min: 1, max: 65535 }),
  dataFile: env.LARDER_DATA || "data/db.json",
  expiryAlertDays: intSetting("LARDER_EXPIRY_ALERT_DAYS", 3, { max: 30 }),
  defaultLanguage: env.LARDER_LANG === "ko" ? "ko" : "en",
});
