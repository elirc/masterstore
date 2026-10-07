# Verification and limits

Run from `storefront/`:

```text
node --experimental-strip-types --experimental-loader ./tests/alias-loader.mjs --test ./tests/listing-search-params.test.mjs
```

## Runs

| Date | Node | Result | Source |
|---|---|---|---|
| 2026-09-22 (Astra) | not recorded | 5 pass, 0 fail, 0 skip | [evidence/results.json](evidence/results.json). The log file it names (`crud-b03-astra-runtime.log`) was never committed to this repo. |
| 2026-10-06 | v22.16.0 | 5 pass, 0 fail, 0 skip | Re-run on a fresh clone during the docs refinement pass. |

The tests import the actual [listing module](../storefront/src/lib/utils/listing-search-params.ts), and [the alias loader](../storefront/tests/alias-loader.mjs) resolves its real `@/types/filters` import. No parser behavior is copied into the harness. Type stripping executes the code without a TypeScript typecheck or build.

## What each case covers

1. Zero, leading zeros, and `Number.MAX_SAFE_INTEGER` on both bounds.
2. Thirteen malformed values looped inside one case (suffix, decimal, signs, surrounding spaces, LF and CRLF suffixes, exponent, hex, empty, `Infinity`, unsafe overflow) — one test, not thirteen.
3. Server-style array params: first-value semantics, repeated options, trimmed query.
4. `buildListingSearchParams` → parse round-trip, unrelated repeated params preserved, `listingKey` stable.
5. An invalid or missing minimum does not erase a valid zero maximum.

## Also executed on 2026-10-06 (scratch copies, outside the repo)

- The break-it mutations in [05-PRACTICE.md](05-PRACTICE.md) exercises 2-5; outcomes recorded in [06](06-SOLUTIONS-AND-REVIEW.md).
- A URL → `buildProductQueryParams` trace (exercises 6-7), confirming first-value semantics, unvalidated `sort`, and pass-through of an inverted price range.
- `/^\d+$/.test("12\n")` → `false` in Node, which corrected an earlier claim that the review had found a JavaScript end-anchor loophole.

## Not executed

Vitest (`npm test`, 7 test files under `src/**/__tests__/`), Next rendering, a browser, Spree requests, the `"use cache: remote"` layer, authorization, and webhook handling. Invalid bounds are omitted according to the existing parser shape; no visible validation error is added. Currency units and min-vs-max ordering remain open application decisions.
