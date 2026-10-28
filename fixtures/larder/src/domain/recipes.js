// Recipes: cooking `portions` uses each ingredient scaled from the recipe's
// own portion count. Cooking is all or nothing.
import { AppError } from "../errors.js";
import { consume } from "./batches.js";
import { getItem, onHand } from "./items.js";

/** One recipe, or AppError not_found. */
export function getRecipe(store, id) {
  const recipe = store.data.recipes.find((r) => r.id === id);
  if (!recipe) throw new AppError("not_found");
  return recipe;
}

/** Ingredient quantities for `portions` portions (3 decimals). */
export function scaled(recipe, portions) {
  return recipe.ingredients.map((i) => ({
    itemId: i.itemId,
    qty: Math.round(((i.qty * portions) / recipe.portions) * 1000) / 1000,
  }));
}

/** Cooks a recipe: checks every ingredient first, then consumes them. */
export function cook(store, id, portions, { at }) {
  const recipe = getRecipe(store, id);
  if (!Number.isInteger(portions) || portions < 1) throw new AppError("invalid_qty");
  const needs = scaled(recipe, portions);
  for (const n of needs) {
    const item = getItem(store, n.itemId);
    const available = onHand(store, n.itemId);
    if (available < n.qty)
      throw new AppError("not_enough_stock", { item: item.name, available, unit: item.unit });
  }
  return needs.map((n) => ({
    itemId: n.itemId,
    batches: consume(store, n.itemId, n.qty, { at, ref: `recipe:${id}` }),
  }));
}
