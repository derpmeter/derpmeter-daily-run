// A tiny router: "GET /items/:id" style patterns, first match wins.

/** Compiles routes [method, pattern, handler] into a matcher. */
export function router(routes) {
  const compiled = routes.map(([method, pattern, handler]) => {
    const keys = [];
    const re = new RegExp(
      `^${pattern.replace(/:(\w+)/g, (_, k) => {
        keys.push(k);
        return "([^/]+)";
      })}$`,
    );
    return { method, re, keys, handler };
  });
  return (method, path) => {
    for (const r of compiled) {
      if (r.method !== method) continue;
      const m = r.re.exec(path);
      if (m) return { handler: r.handler, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
    }
    return null;
  };
}
