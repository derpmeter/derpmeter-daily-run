// Every error a client can see is an AppError with a code from CODES. The
// HTTP layer turns it into { status, body: { error: { code, message } } },
// with the message in the request's language (src/i18n/messages.js).

/** Error codes and their HTTP status. */
export const CODES = Object.freeze({
  not_found: 404,
  bad_request: 400,
  invalid_qty: 400,
  invalid_date: 400,
  unknown_item: 404,
  unknown_batch: 404,
  unknown_location: 400,
  unknown_supplier: 400,
  not_enough_stock: 409,
  order_state: 409,
});

/** An error a client may see: a code from CODES plus message parameters. */
export class AppError extends Error {
  constructor(code, params = {}) {
    if (!(code in CODES)) throw new Error(`Unknown error code ${code}`);
    super(code);
    this.code = code;
    this.params = params;
    this.status = CODES[code];
  }
}

/** Builds an API error response body. */
export function errorBody(code, message) {
  return { error: { code, message } };
}
