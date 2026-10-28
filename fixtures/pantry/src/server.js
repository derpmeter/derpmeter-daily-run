import { createServer } from "node:http";
import { fetchItems } from "./store.js";
import { isExpired, daysLeft } from "./expiry.js";
import { log } from "./log.js";
import { httpError } from "./errors.js";

const PORT = Number(process.env.PORT || 4300);

/** Answers one request: { status, body }. */
export async function handle(path, now = Date.now()) {
  const items = await fetchItems();
  if (path === "/items") return { status: 200, body: items };
  if (path === "/expiring")
    return {
      status: 200,
      body: items.filter((i) => !isExpired(i, now) && daysLeft(i, now) <= 7),
    };
  return httpError(404, "not_found", "No such route.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer(async (req, res) => {
    const { status, body } = await handle(new URL(req.url, "http://x").pathname);
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  }).listen(PORT, () => log.info("listening", { port: PORT }));
}
