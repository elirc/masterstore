# Worked change: make price parsing exact

Before the patch, the relevant function was:

```ts
function parsePositiveInt(value: string | undefined) {
  if (value === undefined) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}
```

The problem is observable: `parsePositiveInt("12px")` returns `12`. The staged after version is:

```ts
if (value === undefined) return undefined;
if (value.length === 0 || /\D/.test(value)) return undefined;
const parsed = Number(value);
if (!Number.isSafeInteger(parsed)) return undefined;
return parsed;
```

The call site still builds the same `ActiveFilters` object, so valid URLs retain their behavior. The change only narrows what malformed text can create. Trace table: raw value `12` -> regex pass -> safe number `12` -> include `priceMin`; raw `12px` -> regex fail -> omit bound; raw `1.5` -> fail -> omit; `9007199254740992` -> number outside safe range -> omit. The runtime test in `tests/listing-search-params.test.mjs` exercises these paths through the actual `.ts` module and resolves the production `@/types/filters` import with the staged loader.

A reviewer should check that the parser's name and comments still describe non-negative integers, that `0` remains valid, and that the output shape does not add an accidental `undefined` property. The fix does not normalize price order, impose a currency range, or change the Spree request. Those are separate decisions. The exact original file is in [snapshots/src/lib/utils/listing-search-params.ts](snapshots/src/lib/utils/listing-search-params.ts).

A useful code review comment names the exact rejected string and asks whether omission, rejection, or a visible error is intentional. Record that product decision beside the parser test so later changes do not broaden behavior accidentally.

Astra review caught a JavaScript regex edge: the dollar anchor may match before a final line terminator, so a superficially strict digit regex accepted a value ending in newline. The final implementation rejects any non-digit with /\D/ and rejects the empty string separately. The executed cases include both LF and CRLF suffixes, not just alphabetic garbage. Leading zeros remain accepted and normalize numerically.
