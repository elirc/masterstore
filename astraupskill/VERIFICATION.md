# Verification and limits

Run from this project's `storefront` directory:

```text
node --experimental-strip-types --experimental-loader ./tests/alias-loader.mjs --test tests/listing-search-params.test.mjs
```

The captured Astra run passed five tests, with zero failures and skips. The tests import the actual [listing module](../storefront/src/lib/utils/listing-search-params.ts), and the local alias loader resolves its real `@/types/filters` dependency. No parser behavior is copied into the harness. Node's type stripping enables execution without claiming a complete TypeScript typecheck or application build.

The first case checks zero, leading-zero input and Number.MAX_SAFE_INTEGER on both bounds. The second covers suffixes, decimals, signs, surrounding spaces, LF and CRLF suffixes, exponent and hexadecimal notation, empty input, Infinity, and unsafe overflow. These values are looped within one test case and are not inflated into additional test counts. The third verifies server-style parameter arrays, first-value semantics, repeated options and trimmed query. The fourth exercises buildListingSearchParams and listingKey as well as the parser, retaining unrelated repeated URL parameters during a valid round trip. The fifth proves that an invalid or missing minimum does not erase a valid zero maximum.

Read [the runtime test](../storefront/tests/listing-search-params.test.mjs), [the alias loader](../storefront/tests/alias-loader.mjs), and [the exact original snapshot](snapshots/src/lib/utils/listing-search-params.ts) together. The new non-digit check prevents the final-newline loophole found during review, while safe-integer checking prevents rounding an oversized digit string into an accepted bound.

This evidence does not include native Vitest, Next rendering, a browser, Spree requests, a catalog database, authorization or webhook handling. Invalid bounds are omitted according to the existing parser shape; no visible validation error is added. Currency units, provider limits and priceMin-versus-priceMax ordering remain existing application decisions. The tests establish the local parse/serialize contract, not catalog completeness or request authorization.

## Astra execution evidence

The captured focused production-source suite executed 5 tests: all passed, zero failed and zero skipped. Read the [captured output](evidence/crud-b03-astra-runtime.log) and [exact command and limits](evidence/results.json). Earlier check records remain preserved in the workspace.
