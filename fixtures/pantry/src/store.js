// In-memory shelf. Real storage is out of scope for this service.
const shelf = [
  { id: 1, name: "rice", qty: 2, unit: "bag", tags: ["dry"], expires: "2027-03-01" },
  { id: 2, name: "milk", qty: 1, unit: "carton", tags: ["fridge"], expires: "2026-11-02" },
  { id: 3, name: "egg", qty: 6, unit: "", tags: ["fridge"], expires: "2026-11-09" },
  { id: 4, name: "yogurt", qty: 4, unit: "cup", tags: ["fridge"], expires: "2026-10-20" },
];

export async function fetchItems() {
  return shelf.map((item) => ({ ...item, tags: [...item.tags] }));
}

export async function saveItem(item) {
  const i = shelf.findIndex((s) => s.id === item.id);
  if (i < 0) shelf.push(item);
  else shelf[i] = item;
  return item;
}
