# API

JSON in, JSON out. Routes are listed in `README.md`.

## Errors

Errors have a status from `src/errors.js` and the body

    { "error": { "code": "unknown_item", "message": "There is no item 9." } }

`code` is stable; `message` is for people and is written in the request's
language.

## Languages

Messages exist in English (`en`) and Korean (`ko`), in
`src/i18n/messages.js`. The server answers in `LARDER_LANG` (default `en`).
