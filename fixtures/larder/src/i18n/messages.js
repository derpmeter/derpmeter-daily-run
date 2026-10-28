// Client-facing messages, per language. Every error code in src/errors.js
// has an English message; Korean is filled in where translated.
const MESSAGES = {
  en: {
    not_found: "No such route.",
    bad_request: "The request is not valid: {reason}.",
    invalid_qty: "Quantity must be a number above zero.",
    invalid_date: "Dates are written YYYY-MM-DD.",
    unknown_item: "There is no item {id}.",
    unknown_batch: "There is no batch {id}.",
    unknown_location: "There is no location {id}.",
    unknown_supplier: "There is no supplier {id}.",
    not_enough_stock: "Only {available} {unit} of {item} left.",
    order_state: "Order {id} is {state}; it cannot be {action}.",
  },
  ko: {
    not_found: "없는 경로입니다.",
    unknown_item: "{id}번 품목이 없습니다.",
  },
};

/** Supported languages, the first is the fallback. */
export const LANGUAGES = Object.keys(MESSAGES);

/** The message for `key` in `lang` (falling back to English), with {params} filled in. */
export function t(key, lang = "en", params = {}) {
  const text = MESSAGES[lang]?.[key] ?? MESSAGES.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

/** Message keys per language, for checks. */
export const messageKeys = (lang) => Object.keys(MESSAGES[lang] ?? {});
