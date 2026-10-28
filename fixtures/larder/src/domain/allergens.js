// Allergens (the 14 EU allergens). Items list theirs; recipes and dishes
// contain the union of their ingredients' allergens.
import { AppError } from "../errors.js";
import { getItem } from "./items.js";
import { getRecipe } from "./recipes.js";
import { listDishes } from "./menu.js";

export const ALLERGENS = ["celery", "gluten", "crustaceans", "eggs", "fish", "lupin", "milk", "molluscs", "mustard", "nuts", "peanuts", "sesame", "soy", "sulphites"];

/** Sets an item's allergens (lowercase, known, sorted, no duplicates). */
export function setAllergens(store, itemId, list) {
  const item = getItem(store, itemId);
  if (!Array.isArray(list)) throw new AppError("bad_request", { reason: "allergens must be a list" });
  const clean = [...new Set(list.map((a) => String(a).toLowerCase()))].sort();
  const unknown = clean.filter((a) => !ALLERGENS.includes(a));
  if (unknown.length) throw new AppError("bad_request", { reason: `unknown allergen ${unknown[0]}` });
  item.allergens = clean;
  return item;
}

/** Allergens in a recipe, sorted. */
export function recipeAllergens(store, recipeId) {
  const recipe = getRecipe(store, recipeId);
  const all = new Set();
  for (const i of recipe.ingredients) for (const a of getItem(store, i.itemId).allergens ?? []) all.add(a);
  return [...all].sort();
}

/** The allergen matrix of active dishes: { dishId, name, allergens }. */
export function menuAllergens(store) {
  return listDishes(store)
    .filter((d) => d.active)
    .map((d) => ({ dishId: d.id, name: d.name, allergens: recipeAllergens(store, d.recipeId) }));
}
