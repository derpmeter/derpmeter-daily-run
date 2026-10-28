// The menu: dishes sold, each made from one recipe portion.
import { AppError } from "../errors.js";
import { isCents } from "../money.js";
import { portionCost } from "./costing.js";
import { getRecipe } from "./recipes.js";

/** Every dish, in id order. */
export function listDishes(store) {
  return [...(store.data.dishes ?? [])].sort((a, b) => a.id - b.id);
}

/** One dish, or AppError not_found. */
export function getDish(store, id) {
  const d = (store.data.dishes ?? []).find((x) => x.id === id);
  if (!d) throw new AppError("not_found");
  return d;
}

/** Adds a dish for a recipe at a price in cents. */
export function addDish(store, { name, recipeId, priceCents }) {
  if (typeof name !== "string" || !name.trim()) throw new AppError("bad_request", { reason: "name is required" });
  getRecipe(store, recipeId);
  if (!isCents(priceCents)) throw new AppError("bad_request", { reason: "priceCents must be whole cents" });
  store.data.dishes ??= [];
  const dish = { id: store.nextId("dish"), name: name.trim(), recipeId, priceCents, active: true };
  store.data.dishes.push(dish);
  return dish;
}

/** Margin per dish: price, portion cost, margin cents and percent (1 decimal). */
export function margins(store) {
  return listDishes(store)
    .filter((d) => d.active)
    .map((d) => {
      const cost = portionCost(store, d.recipeId);
      const margin = d.priceCents - cost;
      return { dishId: d.id, name: d.name, priceCents: d.priceCents, costCents: cost, marginCents: margin, marginPct: d.priceCents ? Math.round((margin / d.priceCents) * 1000) / 10 : 0 };
    });
}
