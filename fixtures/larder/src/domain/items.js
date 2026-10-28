import { AppError } from "../errors.js";

/** Every item, in id order. */
export function listItems(store) {
  return [...store.data.items].sort((a, b) => a.id - b.id);
}

/** One item, or AppError unknown_item. */
export function getItem(store, id) {
  const item = store.data.items.find((i) => i.id === id);
  if (!item) throw new AppError("unknown_item", { id });
  return item;
}

/** Total quantity on hand for an item, over all its batches. */
export function onHand(store, itemId) {
  return store.data.batches
    .filter((b) => b.itemId === itemId)
    .reduce((sum, b) => sum + b.qty, 0);
}
