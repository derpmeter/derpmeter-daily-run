/** Builds an API error response: { status, body: { error: { code, message } } }. */
export function httpError(status, code, message) {
  return { status, body: { error: { code, message } } };
}
