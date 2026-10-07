# Solutions and review rubric

Answers to [05-PRACTICE.md](05-PRACTICE.md). Exercises 2-7 were executed on 2026-10-06 (Node v22.16.0) against a scratch copy of the module and the real test file; the results below are observed, not predicted.

## Solutions

1. `0` → `0`; `0012` → `12`; `12px`, `-1`, `1.5` → omitted (non-digit character); `9007199254740992` → omitted (digits, but not a safe integer). A prefix parser answers "what number starts this string?"; this contract asks "is the whole string a non-negative integer that `Number` represents exactly?"
2. Only **test 2** fails. The input is `''`: `/\D/.test('')` is `false` and `Number('')` is `0`, so an empty bound would become `0`.
3. Only **test 2** fails, on `'9007199254740992'` (finite, but not safe).
4. **Tests 2 and 3** fail (`# pass 3`, `# fail 2`). Test 2: `'12px'` and others are accepted as prefixes. Test 3: `price_min: ['12px', '8']` now yields `priceMin: 12`. Tests 1, 4, 5 use only valid digits or already-absent bounds, so they still pass — a reminder that a green suite only covers the inputs it names.
5. All five tests still **pass**. In JavaScript, `$` without the `m` flag matches only at the end of input, so `/^\d+$/` already rejects `'12\n'` and `'12\r\n'`.
6. Parsed: `{"query":"shoes","filters":{"optionValues":["red","large"],"priceMax":99,"sortBy":"anything-goes"}}`. Spree params: `{"search":"shoes","price_lte":99,"with_option_value_ids":["red","large"],"sort":"anything-goes"}`. The second `price_min=5` is ignored because `readFirst` takes the first value (`12px`), which is rejected — there is no fallback to later values. `anything-goes` reaches Spree untouched.
7. `{"price_gte":500,"price_lte":10}` is sent. Nothing between the URL and Spree checks ordering. A defensible answer puts the rule in `buildProductQueryParams` or the parser with a dedicated test, and states the chosen behavior (drop both, swap, or drop one).
8. Open-ended; a strong answer keeps omission for consistency with `availability`, adds an allowlist for `sort`, and treats a visible error as a new contract.

## Verified review findings

**F1 — `sort` has no allowlist.** `availability` is checked against `AVAILABILITY_STATUSES` (`types/filters.ts`), but `sortBy` is any non-empty trimmed string (`listing-search-params.ts:90-91`) and `product-query.ts:37-39` forwards everything except `"manual"` to Spree as `params.sort`. Observed in exercise 6. The UI offers only `filtersData.sort_options` from Spree (`components/products/filters/ProductFilters.tsx:218`), so this matters for hand-edited or crawled URLs: each distinct junk value is a distinct `listingKey` and a distinct cache entry.

**F2 — inverted price range passes through.** Observed in exercise 7: `price_gte: 500, price_lte: 10`. Not a security issue; a guaranteed-empty result that looks like "no products".

**F3 — webhook idempotency is per process and check-then-act.** `lib/webhooks/handlers.ts:28-41` stores processed ids in a module-level `Set` (cap 10,000, oldest evicted). `handleOrderCompleted` checks at line 47, awaits `sendEmail` at line 64, and only marks at line 90. Two concurrent deliveries of the same event can both pass the check and both send; a restart or a second instance forgets everything. The comment at lines 20-27 documents the mark-after-send choice (so failed sends retry), which is reasonable — but it is at-least-once, not exactly-once.

**F4 — `listingKey` normalizes option order but the URL does not.** `listingKey` sorts `optionValues` (line 163) while `buildListingSearchParams` preserves order (lines 137-139). Two URLs differing only in option order are the same listing state but different URLs; harmless today, worth knowing before using the URL itself as a cache key.

## Rubric

Approve the parser change only if: the snapshot diff is confined to lines 60-62; the test imports the production module (it does, line 3) rather than a copied predicate; `0` and `MAX_SAFE_INTEGER` stay accepted; no explicit `undefined` keys appear. Reject claims that the loader proves server authorization, that Spree was exercised, or that the parser makes webhook processing durable. Do not count static reading as an executed test.
