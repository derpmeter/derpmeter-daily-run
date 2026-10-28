import { enterCount, finishStocktake, startStocktake } from "../../domain/stocktake.js";
import { menuAllergens, recipeAllergens, setAllergens } from "../../domain/allergens.js";
import { breaches, logTemperature, missingChecks } from "../../domain/temperatures.js";
import { ledgerCsv, stockCsv } from "../../io/export.js";
import { dayOf } from "../../dates.js";
import { dateField, idParam, objectBody } from "../validate.js";

/** Stock-takes, allergens, temperature logs and CSV exports. */
export const safetyRoutes = [
  ["POST", "/stocktakes", ({ store, body, now }) => {
    const take = startStocktake(store, String(objectBody(body).location ?? ""), { at: new Date(now).toISOString() });
    store.save();
    return { status: 201, body: take };
  }],
  ["POST", "/stocktakes/:id/counts", ({ store, params, body }) => {
    const b = objectBody(body);
    const take = enterCount(store, idParam(params.id), b.batchId, b.counted);
    store.save();
    return { status: 200, body: take };
  }],
  ["POST", "/stocktakes/:id/finish", ({ store, params, now }) => {
    const lines = finishStocktake(store, idParam(params.id), { at: new Date(now).toISOString() });
    store.save();
    return { status: 200, body: { lines } };
  }],
  ["PUT", "/items/:id/allergens", ({ store, params, body }) => {
    const item = setAllergens(store, idParam(params.id), objectBody(body).allergens);
    store.save();
    return { status: 200, body: item };
  }],
  ["GET", "/recipes/:id/allergens", ({ store, params }) => ({ status: 200, body: recipeAllergens(store, idParam(params.id)) })],
  ["GET", "/reports/allergens", ({ store }) => ({ status: 200, body: menuAllergens(store) })],
  ["POST", "/temperatures", ({ store, body, now }) => {
    const b = objectBody(body);
    const reading = logTemperature(store, String(b.location ?? ""), b.celsius, { at: new Date(now).toISOString(), by: String(b.by ?? "") });
    store.save();
    return { status: 201, body: reading };
  }],
  ["GET", "/reports/temperatures", ({ store, query, now }) => {
    const day = query.day ? dateField(query.day) : dayOf(now);
    return { status: 200, body: { day, breaches: breaches(store, day), missing: missingChecks(store, day) } };
  }],
  ["GET", "/export/ledger.csv", ({ store }) => ({ status: 200, body: ledgerCsv(store) })],
  ["GET", "/export/stock.csv", ({ store }) => ({ status: 200, body: stockCsv(store) })],
];
