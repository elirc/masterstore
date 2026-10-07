# Trace lab: follow a malformed listing query

Input: `q=%20shoes%20&price_min=12px&price_max=99&option=red&option=large&sort=%20price%20`. Predict the returned object before reading on.

| Step | Code (`listing-search-params.ts`) | Input | Decision | Output |
| --- | --- | --- | --- | --- |
| query | `readFirst` + `trim` (70-71) | ` shoes ` | trim and keep | `query: "shoes"` |
| minimum | `parsePositiveInt` (79-81) | `12px` | non-digit → reject | omitted |
| maximum | `parsePositiveInt` (82-84) | `99` | digits and safe | `priceMax: 99` |
| options | `readAll` + `filter(Boolean)` (86-88) | `red`, `large` | collect all, drop empties | `["red", "large"]` |
| sort | `readFirst` + `trim` (90-91) | ` price ` | trim and keep | `sortBy: "price"` |

Now alter one field at a time and predict: minimum `12` (appears); maximum `1.5` (disappears); minimum `9007199254740992` (disappears despite being digits); query of spaces only (becomes `undefined`, because `"".trim() || undefined`); `option=` empty (dropped by `filter(Boolean)`). Each prediction tells you whether a bug belongs to parsing or to downstream filtering.

## Second table: into the Spree request

Continue through `components/products/ProductListing.tsx:98` into `buildProductQueryParams` (`lib/utils/product-query.ts:9-42`):

| Filter | Spree param | Line |
| --- | --- | --- |
| `query` | `search` | 15-17 |
| `priceMin` / `priceMax` | `price_gte` / `price_lte` | 19-25 |
| `optionValues` (non-empty) | `with_option_value_ids` | 27-29 |
| `availability` | `in_stock: true` or `out_of_stock: true` | 31-35 |
| `sortBy` (not `"manual"`) | `sort` | 37-39 |

For the input above the result is `{ search: "shoes", price_lte: 99, with_option_value_ids: ["red", "large"], sort: "price" }`. The list call then goes through `cachedListProducts` (`lib/data/products.ts:17-26`, `"use cache: remote"`, `cacheLife("tenMinutes")`, tag `products`).

**Check:** both tables can be confirmed without an install by the scratch-script method in [05-PRACTICE.md](05-PRACTICE.md) exercise 6 (2026-10-06: matches). The cache and Spree call are read from source only; this lab does not claim a provider response.
