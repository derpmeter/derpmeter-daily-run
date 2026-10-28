# Pantry data rules

These rules hold for every item the store keeps, however it got there.

## Identity

- Every item has a numeric `id`, assigned by the store when the item is added.
- Ids are never reused, not even after the item they belonged to is removed.
  Clients cache items by id; a reused id would show them the wrong item.

## Names

- A name is stored trimmed and in lowercase ("  Black Beans " is stored as
  "black beans").
- A name is never empty after trimming.

## Quantity

- `qty` is a whole number, 0 or more.
- An item whose `qty` reaches 0 stays on the shelf. It is out of stock, not
  gone; only removing it takes it off the shelf.

## Tags

- Tags are stored in lowercase, without duplicates, sorted alphabetically.
- An item may have no tags.

## Expiry

- `expires` is optional. When it is set, it is a calendar date written
  `YYYY-MM-DD` (UTC).

## Units

- `unit` is a word such as "bag" or "can", or an empty string for items that
  are counted by themselves (eggs).
