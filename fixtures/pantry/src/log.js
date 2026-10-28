// Tiny leveled logger. Output goes to stderr so stdout stays clean for data.
const LEVELS = ["debug", "info", "warn", "error"];
const min = LEVELS.indexOf(process.env.PANTRY_LOG || "info");

function write(level, message, fields = {}) {
  if (LEVELS.indexOf(level) < min) return;
  process.stderr.write(`${JSON.stringify({ level, message, ...fields })}\n`);
}

export const log = {
  debug: (m, f) => write("debug", m, f),
  info: (m, f) => write("info", m, f),
  warn: (m, f) => write("warn", m, f),
  error: (m, f) => write("error", m, f),
};
