// The HTTP layer. createApp(store) returns handle(request) → response, a pure
// function the server and the tests share: request { method, path (with the
// query string), headers, body }, response { status, body }.
import { createServer } from "node:http";
import { AppError, errorBody } from "../errors.js";
import { config } from "../config.js";
import { log } from "../log.js";
import { t } from "../i18n/messages.js";
import { openStore } from "../db/store.js";
import { router } from "./router.js";
import { itemRoutes } from "./routes/items.js";
import { batchRoutes } from "./routes/batches.js";
import { orderRoutes } from "./routes/orders.js";
import { kitchenRoutes } from "./routes/kitchen.js";
import { planningRoutes } from "./routes/planning.js";
import { safetyRoutes } from "./routes/safety.js";

const match = router([...itemRoutes, ...batchRoutes, ...orderRoutes, ...kitchenRoutes, ...planningRoutes, ...safetyRoutes]);

/** Builds the request handler over a store. `clock` returns now (ms). */
export function createApp(store, { clock = () => Date.now() } = {}) {
  return async function handle({ method = "GET", path, headers = {}, body = null }) {
    const url = new URL(path, "http://larder");
    const lang = config.defaultLanguage;
    try {
      const found = match(method, url.pathname);
      if (!found) throw new AppError("not_found");
      return await found.handler({
        store,
        params: found.params,
        query: Object.fromEntries(url.searchParams),
        body,
        headers,
        now: clock(),
      });
    } catch (e) {
      if (e instanceof AppError) return { status: e.status, body: errorBody(e.code, t(e.code, lang, e.params)) };
      log.error("unhandled", { message: e.message });
      return { status: 500, body: errorBody("internal", "Something went wrong.") };
    }
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const handle = createApp(openStore(config.dataFile));
  createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = undefined;
    }
    const out = await handle({ method: req.method, path: req.url, headers: req.headers, body });
    res.writeHead(out.status, { "content-type": "application/json" });
    res.end(JSON.stringify(out.body));
  }).listen(config.port, () => log.info("listening", { port: config.port }));
}
