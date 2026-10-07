# MasterStore listing CRUD upskill

MasterStore is a Next.js 16 storefront for a Spree commerce backend (all code under `storefront/`). This course hardens one small query boundary: product-listing state is read from URL parameters in `storefront/src/lib/utils/listing-search-params.ts`. Before the change, `Number.parseInt("12px", 10)` produced `12`, so malformed input could become an accepted price bound. The parser now requires decimal digits and a safe integer. The [source snapshot](snapshots/src/lib/utils/listing-search-params.ts) preserves the original, and [the runtime test](../storefront/tests/listing-search-params.test.mjs) executes the real TypeScript module.

## Reading order

1. [01-CODEBASE-MAP.md](01-CODEBASE-MAP.md) — URL → page → parser → query builder → cached Spree call, with file:line references.
2. [02-CONCEPTS.md](02-CONCEPTS.md) — parsing vs trusting, query identity, omission as a policy.
3. [03-WORKED-CHANGE.md](03-WORKED-CHANGE.md) — before/after, why each guard is needed, and a correction about JavaScript's `$` anchor.
4. [04-TESTING-AND-DEBUGGING.md](04-TESTING-AND-DEBUGGING.md) — the focused check vs the Vitest suite.
5. [05-PRACTICE.md](05-PRACTICE.md) — eight Goal + Check exercises, seven runnable with no install. Predict before opening [06-SOLUTIONS-AND-REVIEW.md](06-SOLUTIONS-AND-REVIEW.md), which also has four verified review findings.
6. [07-TRACE-LAB.md](07-TRACE-LAB.md) — the same URL traced through both tables.
7. [VERIFICATION.md](VERIFICATION.md) — exactly what ran.

## Quick check (from `storefront/`, Node 22.6+, no install)

```text
node --experimental-strip-types --experimental-loader ./tests/alias-loader.mjs --test ./tests/listing-search-params.test.mjs
```

Expect `# pass 5`. No claim is made about Next rendering, Spree responses, the Vitest suite, or a live catalog. URL validation is kept distinct from authorization, cache freshness, and webhook idempotency — those are visible in the repository and discussed as findings, but are outside this fix.

`storefront/CLAUDE.md` is AI-assistant configuration for the upstream starter, not part of this course.
