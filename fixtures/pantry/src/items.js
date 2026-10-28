import { fetchItems, saveItem } from "./store.js";

/** Items that carry `tag`. */
export async function findByTag(tag) {
  const items = await fetchItems();
  return items.filter((item) => item.tags.includes(tag));
}

/** Adds an item with the next free id. */
export async function addItem(item) {
  if (!item.name) throw new Error("Item needs a name.");
  const items = await fetchItems();
  const id = Math.max(0, ...items.map((i) => i.id)) + 1;
  return saveItem({ tags: [], unit: "", ...item, id });
}
