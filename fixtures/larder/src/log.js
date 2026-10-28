// Leveled JSON logger on stderr, so stdout stays clean for CLI output.
const LEVELS = ["debug", "info", "warn", "error"];
const min = LEVELS.indexOf(process.env.LARDER_LOG || "info");

function write(level, message, fields = {}) {
  if (LEVELS.indexOf(level) < min) return;
  process.stderr.write(`${JSON.stringify({ level, message, ...fields })}\n`);
}

/** debug / info / warn / error, each (message, fields). */
export const log = {
  debug: (m, f) => write("debug", m, f),
  info: (m, f) => write("info", m, f),
  warn: (m, f) => write("warn", m, f),
  error: (m, f) => write("error", m, f),
};
