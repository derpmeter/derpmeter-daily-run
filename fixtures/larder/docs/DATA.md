# Data rules

These hold for every record, however it was made.

## Identity

- Ids are positive integers from `seq` in the store and are never reused,
  not even after a record is removed.

## Quantities

- Quantities are numbers above zero with at most 3 decimal places, in the
  item's `unit`. A batch whose quantity reaches 0 stays (the ledger refers to
  it); it is simply empty.

## Batches and consumption

- Stock is used first-expired, first-out (FEFO): the batch that expires
  first is used first. Batches without an expiry date are used last. Among
  batches with the same expiry, the one received first goes first, then the
  lower id.
- Taking stock is all or nothing: if an item does not have enough, nothing
  is taken and the ledger is unchanged.

## Ledger

- Every change to a batch quantity writes exactly one movement per batch
  (`receive`, `consume`, `waste`, `adjust`). Movements are never edited or
  deleted.

## Money

- Money is an integer number of cents. A line (quantity × unit price) is
  rounded to the cent on its own (half up); totals are sums of rounded lines.
  Never sum unrounded amounts.

## Dates

- Calendar dates are `YYYY-MM-DD` in UTC; instants are ISO 8601 strings.

## Prices

- A price list entry is valid from its `validFrom` day until the next entry
  for the same supplier and item. An item's `priceCents` is the price used
  for costing and stock value.

## Notifications

- Outbox messages have a unique `key`. Queueing a key that exists does
  nothing, so jobs may run more than once.

## Forecasts

- Daily use is the consumed quantity over the 14 days before today, divided
  by 14 (3 decimals).

## Stock-takes

- One open stock-take per location. Finishing it sets each counted batch to
  its count and writes one `adjust` movement per changed batch, with the
  direction in `ref` (`stocktake:<id>:up` or `:down`).

## Food safety

- Fridges must read at or below 5 °C and freezers at or below -15 °C. Each
  of them needs at least one reading per day.
- Allergens are the 14 EU allergens, stored lowercase and sorted.
