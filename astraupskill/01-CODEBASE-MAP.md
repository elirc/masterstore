# Codebase map: listing data from URL to catalog

MasterStore is a Next.js 16 storefront for a Spree commerce backend (`storefront/`, package name `nextjs-starter-spree`). This course follows one read path: a product-listing URL becomes a Spree catalog request.

## The path, file by file

| Step | File (under `storefront/src/`) | What happens |
|---|---|---|
| 1 | `app/[country]/[locale]/(storefront)/products/page.tsx:33` (also `c/[...permalink]/page.tsx:55` for category pages) | the server page awaits `searchParams` and calls `parseListingSearchParams` |
| 2 | `lib/utils/listing-search-params.ts:67-102` | `readFirst`/`readAll` pull `q`, `price_min`, `price_max`, `availability`, repeated `option`, `sort`; returns `{ query, filters }` |
| 3 | `lib/utils/listing-search-params.ts:58-64` | `parsePositiveInt` — the seam this course changes |
| 4 | `types/filters.ts` | `ActiveFilters` shape and `isAvailabilityStatus` allowlist (`in_stock`, `out_of_stock`) |
| 5 | `components/products/ProductListing.tsx:98` | `buildProductQueryParams(state.filters, state.query)` |
| 6 | `lib/utils/product-query.ts:9-42` | maps filters to Spree params: `price_gte`, `price_lte`, `with_option_value_ids`, `in_stock`/`out_of_stock`, `sort`, `search` |
| 7 | `lib/data/products.ts:17-31` | `getProducts` → `cachedListProducts` (`"use cache: remote"`, ten-minute life, tag `products`) → `getClient().products.list` |

`listingKey` (`listing-search-params.ts:156-165`) serializes the parsed state with `JSON.stringify` and is used as the React key that remounts the infinite list when filters change. It sorts `optionValues`, so `option=red&option=large` and `option=large&option=red` share one key.

## The seam

`parsePositiveInt` does not contact Spree and does not own authorization. Its job is to decide whether a string becomes a non-negative integer bound. The old `Number.parseInt` accepted a valid prefix of invalid text (`"12px"` → `12`). The new digit check plus `Number.isSafeInteger` makes the accepted language explicit. The exact pre-change file is [snapshots/src/lib/utils/listing-search-params.ts](snapshots/src/lib/utils/listing-search-params.ts); a whitespace-insensitive diff against the live file shows only lines 60-62 changed.

Trace: `?price_min=12` → `readFirst` → parser → `filters.priceMin = 12` → `price_gte: 12`. `?price_min=12px` → parser rejects → no `priceMin` key → no `price_gte`. `?price_min=9007199254740992` → unsafe → omitted.

## Neighbours you will be asked about, not changed here

- `lib/utils/product-query.ts:37-39` forwards any non-`manual` `sortBy` string to Spree unvalidated (finding F1 in [06](06-SOLUTIONS-AND-REVIEW.md)).
- `lib/webhooks/handlers.ts:28-41` keeps webhook idempotency in a per-process `Set` capped at 10,000 ids (finding F3).

Keep a boundary ledger while reading: raw URL input, normalized filter object, Spree params, cached response, rendered cards. Each has a different owner and should not inherit assumptions from the next.
