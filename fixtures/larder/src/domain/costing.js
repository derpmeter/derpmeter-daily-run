// Recipe costing: what one portion costs at today's item prices.
import { lineCents } from "../money.js";
import { getItem } from "./items.js";
import { getRecipe } from "./recipes.js";

/** Cents per ingredient line and in total for the whole recipe. */
export function recipeCost(store, recipeId) {
  const recipe = getRecipe(store, recipeId);
  const lines = recipe.ingredients.map((i) => {
    const item = getItem(store, i.itemId);
    return { itemId: item.id, qty: i.qty, costCents: lineCents(i.qty, item.priceCents) };
  });
  return { recipeId, portions: recipe.portions, totalCents: lines.reduce((s, l) => s + l.costCents, 0), lines };
}

/** Cost of one portion, rounded to the cent. */
export function portionCost(store, recipeId) {
  const { totalCents, portions } = recipeCost(store, recipeId);
  return Math.round(totalCents / portions);
}
