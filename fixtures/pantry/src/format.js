// "2 bags", "1 carton", "6 eggs". Items without a unit count the item itself.
export function formatQty(qty, unit, name) {
  const word = unit || name;
  return qty === 1 ? `${qty} ${word}` : `${qty} ${word}s`;
}
