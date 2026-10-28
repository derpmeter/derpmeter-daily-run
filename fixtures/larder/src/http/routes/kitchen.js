import { cook } from "../../domain/recipes.js";
import { stockValue, wasteReport } from "../../domain/reports.js";
import { expiringSoon, lowStock } from "../../domain/alerts.js";
import { config } from "../../config.js";
import { dateField, idParam, objectBody } from "../validate.js";

/** Cooking, reports and alerts. */
export const kitchenRoutes = [
  ["POST", "/recipes/:id/cook", ({ store, params, body, now }) => {
    const b = objectBody(body);
    const used = cook(store, idParam(params.id), b.portions, { at: new Date(now).toISOString() });
    store.save();
    return { status: 200, body: { used } };
  }],
  ["GET", "/reports/stock-value", ({ store }) => ({ status: 200, body: stockValue(store) })],
  ["GET", "/reports/waste", ({ store, query }) => ({
    status: 200,
    body: wasteReport(store, dateField(query.from), dateField(query.to)),
  })],
  ["GET", "/alerts", ({ store, now }) => ({
    status: 200,
    body: { expiring: expiringSoon(store, now, config.expiryAlertDays), lowStock: lowStock(store) },
  })],
];
