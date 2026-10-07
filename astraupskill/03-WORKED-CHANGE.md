# Worked change: make price parsing exact

Before the patch ([snapshot](snapshots/src/lib/utils/listing-search-params.ts), lines 58-63):

```ts
function parsePositiveInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}
```

The problem is observable: `parsePositiveInt("12px")` returns `12`, and so do `"12.9"` (→ 12) and `" 12"`. After (`storefront/src/lib/utils/listing-search-params.ts:58-64`):

```ts
function parsePositiveInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (value.length === 0 || /\D/.test(value)) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return undefined;
  return parsed;
}
```

Why both guards are needed:

- **`value.length === 0`**: `/\D/.test("")` is `false` and `Number("")` is `0`, so without it an empty `?price_min=` would become a real `priceMin: 0`. Remove it and test 2 fails (executed, see [06](06-SOLUTIONS-AND-REVIEW.md)).
- **`Number.isSafeInteger`**: `"9007199254740992"` is all digits, but `Number` cannot represent it exactly. Swap in `Number.isFinite` and test 2 fails.

The call site still builds the same `ActiveFilters` object, so valid URLs keep their behavior; the change only narrows what malformed text can create. Trace: `12` → digit check passes → safe `12` → `priceMin`; `12px` → digit check fails → omitted; `1.5` → fails (the `.`) → omitted; `9007199254740992` → unsafe → omitted.

## A correction about the newline case

An earlier version of this chapter said the review caught "a JavaScript regex edge: the dollar anchor may match before a final line terminator." That is true in Python, Perl, and PCRE, but **not in JavaScript**: without the `m` flag, `$` matches only at the end of input. Checked on Node v22.16.0 (2026-10-06): `/^\d+$/.test("12\n")` → `false`, `/^\d+$/.test("12\r\n")` → `false`, `/^\d+$/m.test("12\n")` → `true`. Replacing `/\D/.test(value)` with `!/^\d+$/.test(value)` keeps all five tests green. Both forms are correct here; `/\D/` is simply easier to read as "contains a non-digit". The LF and CRLF cases in test 2 are still worth keeping — they guard against someone adding the `m` flag.

## What the change does not do

It does not order `price_min` against `price_max`, impose a currency range, or change the Spree request builder. A reviewer should check that `0` stays valid, that the output never gains an explicit `priceMin: undefined` key (the conditional spreads at lines 95-96 prevent that), and that the parser name still matches its contract. A good review comment names the exact rejected string and asks whether omission, rejection, or a visible error is intended.
