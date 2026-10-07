# Testing and debugging the filter boundary

## Two test systems

| Suite | Location | Count | Command | Needs install? |
|---|---|---|---|---|
| Focused parser check | `storefront/tests/listing-search-params.test.mjs` | 5 `test(...)` cases | see below | No (Node 22.6+) |
| Project Vitest suite | `storefront/src/**/__tests__/*.test.{ts,tsx}` (7 files: cart, checkout, customer, payment data; CartContext; ProductCard; confirm-payment page) | not counted here | `npm install` then `npm test` (`vitest run`, jsdom) | Yes |

The Vitest `include` is `src/**/*.test.{ts,tsx}` (`vitest.config.ts`), so the focused `.mjs` check in `storefront/tests/` is **not** part of `npm test`. Run it separately from `storefront/`:

```text
node --experimental-strip-types --experimental-loader ./tests/alias-loader.mjs --test ./tests/listing-search-params.test.mjs
```

Node prints an `ExperimentalWarning` about `--experimental-loader`; that is expected. The loader (`tests/alias-loader.mjs`, 12 lines) maps `@/x` to `src/x.ts`, which is how the real `@/types/filters` import resolves. The test imports `parseListingSearchParams`, `buildListingSearchParams`, and `listingKey` from the real module and asserts complete filter objects, so changing the production parser changes the result. Re-run 2026-10-06 on Node v22.16.0: `# tests 5`, `# pass 5`, `# fail 0`.

## Predict first

Given `new URLSearchParams("price_min=12px")`, the old code produced `{ priceMin: 12 }`; the contract is to omit the bound. Given `price_min=12&price_max=99`, both remain numbers. Given an unsafe integer, no bound. Each case maps to one parser branch.

## Debugging order

Inspect the raw URL, then `readFirst` (`listing-search-params.ts:40-47`), then the parser (58-64), then the conditional spreads that build `filters` (93-99).

- `12px` survives → parser.
- A missing option → `readAll` (49-56), which also drops empty strings via `.filter(Boolean)` (line 86-88).
- A valid later bound ignored → expected: `readFirst` takes the **first** value only, so `?price_min=12px&price_min=5` yields no minimum (verified 2026-10-06 with a scratch script).
- `Cannot find module '@/…'` or `ERR_UNKNOWN_FILE_EXTENSION` → harness problem (loader not passed, or run from the wrong directory), not product behavior. Fix the command and rerun; do not count it as a parser failure.

## Going one step further without an install

`lib/utils/product-query.ts` has only a type import from `@spree/sdk`, which type stripping erases, so you can import `buildProductQueryParams` with the same loader from a scratch script and see the exact Spree params a URL produces (05, exercise 6). The Spree client, Next caching, and rendering still require dependencies and were not executed for this course.
