# Mission 25: Write the Docs That Don't Exist

## Doc 1: Junior Onboarding Checklist

- Run `npm install`, copy `.env.local.example` to `.env.local`, set Spree env vars, and run `npm run dev`; source: `README.md:84-138`, `package.json:5-14`, `.env.example:1-3`.
- Open `src/app/layout.tsx:37-62`, then `src/app/[country]/[locale]/layout.tsx:43-93`.
- Trace one product from `src/app/[country]/[locale]/(storefront)/products/page.tsx:24-76` to `src/components/products/ProductCard.tsx:22-111`.
- First PR checklist: no direct browser Spree SDK calls, cache tags updated for mutations, localized links use `basePath`, tests added when behavior changes.
- Questions to ask: Where does state live? Which server action owns this? Which context exposes it?

## Doc 2: Architecture Guide for New Engineers

Navigate by flow:

1. Route: `src/app`.
2. UI: `src/components`.
3. Client shared state: `src/contexts`.
4. Reusable client behavior: `src/hooks`.
5. Server actions: `src/lib/data`.
6. Spree integration: `src/lib/spree`.
7. App-owned types: `src/types`.

Example route-to-data path: products page parses search params at `src/app/[country]/[locale]/(storefront)/products/page.tsx:28-34`, passes fetchers at `src/app/[country]/[locale]/(storefront)/products/page.tsx:61-73`, and `ProductListing` fetches in parallel at `src/components/products/ProductListing.tsx:131-137`.

## Doc 3: Code Review Checklist

- Check route ownership and localized `basePath`; see `src/components/products/ProductCard.tsx:62-66`.
- Check server/client boundary; server actions begin with `"use server"` at `src/lib/data/cart.ts:1`.
- Check token handling through `getCartOptions` at `src/lib/spree/cookies.ts:125-134`.
- Check cache invalidation through `updateTag`, as in `src/lib/data/cart.ts:103-104`.
- Check URL parser changes against `src/lib/utils/listing-search-params.ts:65-142`.
- Check tests under `src/**/*.test.{ts,tsx}` per `vitest.config.ts:12-17`.

## Doc 4: Debugging Playbook

Cart stale or empty: inspect `src/contexts/CartContext.tsx:51-60`, `src/lib/data/cart.ts:21-57`, and `src/lib/spree/cookies.ts:43-60`.

Wrong market/currency: inspect `src/lib/spree/middleware.ts:70-105`, `src/app/[country]/[locale]/layout.tsx:49-68`, and `src/hooks/useCountrySwitch.ts:45-61`.

Product list wrong: inspect `src/lib/utils/listing-search-params.ts:65-101`, `src/components/products/ProductListing.tsx:98-137`, and `src/lib/data/products.ts:17-31`.

Webhook/email failure: inspect `src/app/api/webhooks/spree/route.ts:11-32`, `src/lib/spree/webhooks.ts:55-109`, and `src/lib/webhooks/handlers.ts:46-224`.

## Doc 5: Change Playbook

1. Branch.
2. Locate route and existing feature pattern.
3. Add or adjust server action in `src/lib/data` if backend data changes.
4. Expose shared client behavior through context or hook only when multiple components need it.
5. Update UI.
6. Add focused tests.
7. Run `npm run check` and `npm run test`; scripts are at `package.json:9-14`.
8. Review cache tags, token helpers, and localized links before opening PR.

Example change note:

```text
Change: Add reorder button to order detail.
Existing pattern: cart mutations go through CartContext and src/lib/data/cart.ts.
Backend boundary: order lines are read server-side, cart items are created server-side.
UI boundary: button lives in OrderDetail, but cart refresh should still use cart context behavior.
Tests: partial failure when one old variant cannot be added.
Manual QA: sign in, open old order, reorder, confirm cart drawer reflects added items.
```

## Doc 6: Senior Ownership Notes

Monitor:

- Webhook duplicate sends because idempotency is in-memory at `src/lib/webhooks/handlers.ts:20-41`.
- Checkout complexity because orchestration and UI live together at `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:84-793`.
- Trusted HTML rendering at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:214-218`.
- Product cache correctness at `src/lib/data/products.ts:17-31`.

Improve first: durable webhook idempotency, checkout hook extraction, URL parser tests, and production image security review.

Leave alone unless needed: server-first Spree access (`README.md:70-75`), HTTP-only cookies (`src/lib/spree/cookies.ts:43-60`), and URL-backed listing state (`src/lib/utils/listing-search-params.ts:1-13`).

Ownership habit: when a feature touches account, cart, checkout, or cache behavior, write a one-paragraph risk memo before coding. Include the user, the data owner, the cache owner, the failure mode, and the rollback plan.

Example risk memo:

```text
Feature: saved address nicknames.
User: signed-in customer choosing saved addresses at checkout.
Data owner: Spree address record or custom address metadata.
Cache owner: authenticated account/address reads only.
Failure mode: checkout strips unknown nickname field or shows stale nickname.
Rollback: hide nickname field while preserving existing address display and update action.
```

## Doc 7: Interview Walkthrough

Practice answer:

"I worked with a server-first Next.js storefront for Spree Commerce. Routing is localized by country and locale using middleware in `src/lib/spree/middleware.ts:45-105`. The app shell composes i18n, store, auth, and cart providers in `src/app/[country]/[locale]/layout.tsx:73-93`. Data access is through server actions in `src/lib/data`, with the Spree SDK initialized centrally at `src/lib/spree/config.ts:23-36`. Cart behavior is a full-stack path from `ProductDetails` at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:98-110`, through `CartContext` at `src/contexts/CartContext.tsx:62-100`, to `addToCart` at `src/lib/data/cart.ts:91-105`. The areas I would watch most are checkout complexity and webhook idempotency."
