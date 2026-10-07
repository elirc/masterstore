# Graduated practice

Every exercise has a **Goal** and a **Check**. All commands run from `storefront/` with Node 22.6+ and no install. Break-it exercises edit `src/lib/utils/listing-search-params.ts`; do them on a scratch branch and `git restore` the file afterwards. Write your prediction down first; answers are in [06-SOLUTIONS-AND-REVIEW.md](06-SOLUTIONS-AND-REVIEW.md).

The test command (called **T** below):

```text
node --experimental-strip-types --experimental-loader ./tests/alias-loader.mjs --test ./tests/listing-search-params.test.mjs
```

Unmodified, **T** prints `# pass 5`, `# fail 0` (re-run 2026-10-06, Node v22.16.0).

## 1. Six predictions

**Goal:** for `0`, `0012`, `12px`, `-1`, `1.5`, `9007199254740992`, predict whether each becomes a `priceMin`, and with what value. Explain why "only digits" and "safe integer" are separate checks.
**Check (runnable):** every one of these values appears in test 1 or test 2 (`tests/listing-search-params.test.mjs:4-15`); **T** passing confirms the intended answers. Compare against yours.

## 2. Remove the empty-string guard

**Goal:** delete `value.length === 0 || ` from line 60. Predict which tests fail and which input causes it.
**Check (runnable):** run **T**.

## 3. Use `isFinite` instead of `isSafeInteger`

**Goal:** change `Number.isSafeInteger(parsed)` to `Number.isFinite(parsed)` on line 62. Predict the failing input.
**Check (runnable):** run **T**.

## 4. Restore the old parser

**Goal:** paste the snapshot's `Number.parseInt` body back into lines 60-62. Predict exactly which of the five tests fail. (Hint: test 3 passes `price_min: ['12px', '8']`.)
**Check (runnable):** run **T**.

## 5. The anchored regex

**Goal:** replace `/\D/.test(value)` with `!/^\d+$/.test(value)`. Predict whether the `'12\n'` and `'12\r\n'` cases in test 2 still pass in JavaScript.
**Check (runnable):** run **T**. Then read the correction in [03-WORKED-CHANGE.md](03-WORKED-CHANGE.md).

## 6. Trace a URL all the way to Spree params

**Goal:** for `q=%20shoes%20&price_min=12px&price_max=99&option=red&option=large&sort=%20anything-goes%20&price_min=5`, predict (a) the parsed `{ query, filters }` and (b) the object `buildProductQueryParams` (`src/lib/utils/product-query.ts:9-42`) returns.
**Check (runnable):** create a scratch file **outside the repo** (for example in your temp folder) containing

```js
import { parseListingSearchParams } from "@/lib/utils/listing-search-params";
import { buildProductQueryParams } from "@/lib/utils/product-query";
const s = parseListingSearchParams(new URLSearchParams("<the query above>"));
console.log(JSON.stringify(s));
console.log(JSON.stringify(buildProductQueryParams(s.filters, s.query)));
```

and run `node --experimental-strip-types --experimental-loader ./tests/alias-loader.mjs <path-to-scratch-file>` from `storefront/`. Compare both lines with your prediction.

## 7. Inverted range

**Goal:** predict what reaches Spree for `price_min=500&price_max=10`. Decide whose job it is to reject or swap it: parser, query builder, UI, or Spree.
**Check (runnable):** reuse the exercise 6 script with this query. Your write-up must name the file and line where you would add the rule and the test that would prove it.

## 8. Error policy (senior)

**Goal:** propose a policy for malformed filters: silent omission (today), normalization, or a visible error. If you choose an error, identify the route (`app/[country]/[locale]/(storefront)/products/page.tsx:33`), the user message, and the tests that would change.
**Check (review):** your proposal states which existing behavior it is consistent with (`availability` at `listing-search-params.ts:73-77`) and which it is not (`sort`, F1 in 06).
