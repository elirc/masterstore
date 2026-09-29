# Senior Engineer Guide

## Architectural Critique

| Area | Score | Findings |
|---|---:|---|
| Scalability | 4 | Server-first data access and cache tags are strong (`README.md:70-80`, `src/lib/data/products.ts:17-31`), but webhook idempotency is in-memory (`src/lib/webhooks/handlers.ts:20-41`). |
| TypeScript discipline | 4 | Core contracts are typed (`src/contexts/CartContext.tsx:23-35`, `src/types/filters.ts:1-20`), though tests use broad casts (`src/contexts/__tests__/CartContext.test.tsx:35-50`). |
| Separation of concerns | 3 | Data layer and Spree helpers are clean (`src/lib/data/cart.ts:21-157`, `src/lib/spree/config.ts:23-36`), but checkout page combines many UI and orchestration concerns (`src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:84-793`). |
| Testability | 3 | Vitest is configured (`vitest.config.ts:5-17`) and cart tests exist (`src/contexts/__tests__/CartContext.test.tsx:56-237`), but checkout behavior has many untested branches (`src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:136-605`). |
| Maintainability | 4 | Folder boundaries are clear (`src/lib/data`, `src/lib/spree`, `src/components`), but large components will slow feature changes. |
| Security posture | 3 | HTTP-only cookies are good (`src/lib/spree/cookies.ts:43-60`, `src/lib/spree/cookies.ts:76-84`) and webhooks verify signatures (`src/lib/spree/webhooks.ts:67-77`), but trusted HTML and local-IP images need explicit deployment policy (`src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:214-218`, `next.config.ts:32-35`). |
| Performance | 4 | Server components, caching, dynamic imports, and narrowed product fields are strong (`src/components/products/ProductListing.tsx:100-137`, `src/components/layout/Header.tsx:12-36`), with risk concentrated in large client checkout code. |

## Performance Audit

Finding 1: Product listing intentionally narrows payload fields at `src/components/products/ProductListing.tsx:100-113`. Preserve this discipline.

Risky version:

```ts
const listParams = {
  limit: PAGE_SIZE,
  ...queryParams,
  ...baseParams, // If fields is omitted, ProductCard receives more Spree data than it needs.
};
```

Correct pattern from this repo:

```ts
const listParams: ProductListParams = {
  limit: PAGE_SIZE,
  ...queryParams,
  ...baseParams,
  fields: PRODUCT_CARD_FIELDS, // Keep card payload small for cache and RSC serialization.
};
```

Finding 2: Header lazy-loads mobile menu and country switcher at `src/components/layout/Header.tsx:12-36`. Keep heavy interactive controls out of the initial server-rendered header when possible.

Finding 3: `InfiniteProductList` prevents duplicate appended products at `src/components/products/InfiniteProductList.tsx:89-94`. This protects UX if backend pagination shifts while a user scrolls.

## Security Audit

Finding 1: HTML injection is accepted from Spree admin content. Product description renders trusted HTML at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:214-218`; policy pages render policy HTML at `src/app/[country]/[locale]/(storefront)/policies/[slug]/page.tsx:63`.

Corrected defensive wrapper idea:

```tsx
// Keep the trust decision visible at the call site.
// Sanitize on the Spree/admin side, or add a server sanitizer before rendering.
<TrustedCmsHtml html={product.description} source="spree-product-description" />
```

Finding 2: Cookies use `httpOnly`, production `secure`, `sameSite: "lax"`, and root path for cart and access tokens at `src/lib/spree/cookies.ts:43-60` and `src/lib/spree/cookies.ts:76-84`. This is the right default for storefront tokens.

Finding 3: Webhook signature verification happens before parsing at `src/lib/spree/webhooks.ts:55-84`. This is good. The improvement is durable idempotency: replace the in-memory `Set` at `src/lib/webhooks/handlers.ts:20-41` with a Spree-side event log, Redis, database table, or durable KV.

Finding 4: `dangerouslyAllowLocalIP` is true at `next.config.ts:32-35`. It supports local Spree images, but production deployments should explicitly review SSRF/internal image fetch risk.

## TypeScript Discipline Review

Good:

- App-owned domain filters use literal unions and guards at `src/types/filters.ts:1-20`.
- Context APIs are explicit at `src/contexts/AuthContext.tsx:27-44` and `src/contexts/CartContext.tsx:23-35`.
- `actionResult` standardizes server action return shape at `src/lib/data/utils.ts:5-18`.

Improve:

- Avoid growing unchecked `Record<string, unknown>` API surfaces except where SDK shape is intentionally flexible, such as product filters at `src/lib/data/products.ts:64-79`.
- In tests, replace `as never` fixtures at `src/contexts/__tests__/CartContext.test.tsx:35-50` with small factory helpers typed as `Partial<Cart>` plus final cast in one location.

## Custom Abstractions Inventory

- `actionResult`: server action success/error envelope at `src/lib/data/utils.ts:5-18`.
- `withFallback`: safe fallback helper at `src/lib/data/utils.ts:23-33`.
- `getClient`: lazy Spree SDK singleton at `src/lib/spree/config.ts:23-36`.
- `withAuthRefresh`: authenticated request retry wrapper at `src/lib/spree/auth-helpers.ts:49-77`.
- `createSpreeMiddleware`: country/locale redirect and cookie sync at `src/lib/spree/middleware.ts:45-105`.
- `createWebhookHandler`: signature verification and event dispatch at `src/lib/spree/webhooks.ts:43-110`.
- `parseListingSearchParams` and `buildListingSearchParams`: URL contract for listings at `src/lib/utils/listing-search-params.ts:65-142`.
- `useCountrySwitch`: market-aware country navigation at `src/hooks/useCountrySwitch.ts:21-68`.
- `useCountryStates`: country states loading with cleanup at `src/hooks/useCountryStates.ts:8-40`.

## Testing Assessment

Existing coverage includes cart context behavior at `src/contexts/__tests__/CartContext.test.tsx:56-237`, data-layer tests under `src/lib/data/__tests__`, ProductCard tests at `src/components/products/__tests__/ProductCard.test.tsx`, and confirm-payment page tests at `src/app/[country]/[locale]/(checkout)/confirm-payment/__tests__/page.test.tsx`. Vitest uses jsdom and Testing Library at `vitest.config.ts:5-17`.

Risky untested behavior to add: product listing URL parser rejects invalid availability and invalid prices.

Complete runnable test:

```ts
// src/lib/utils/__tests__/listing-search-params.test.ts
import { describe, expect, it } from "vitest";
import { parseListingSearchParams } from "@/lib/utils/listing-search-params";

describe("parseListingSearchParams", () => {
  it("ignores invalid availability and negative price values", () => {
    const result = parseListingSearchParams({
      availability: "available-right-now",
      price_min: "-5",
      price_max: "25",
      option: ["red", "large"],
      q: "shirt",
    });

    expect(result).toEqual({
      query: "shirt",
      filters: {
        priceMax: 25,
        optionValues: ["red", "large"],
      },
    });
  });
});
```

Why this matters: invalid URL values enter through `parseListingSearchParams` at `src/lib/utils/listing-search-params.ts:65-101` and drive product queries downstream at `src/components/products/ProductListing.tsx:98-124`.

## Bug Injection Exercise

Do not modify production code. Reproduce by changing code locally on a branch, then write or imagine tests.

1. Symptom: adding a product updates the drawer but refreshing the page shows an empty cart. Test: add item, reload, expect line item to persist. Suspect cookie write in `src/lib/data/cart.ts:62-80` or `src/lib/spree/cookies.ts:43-60`.
2. Symptom: country switch changes URL but checkout still shows old currency. Test: cart has USD, switch to DE/EUR, expect cart currency update. Suspect `src/hooks/useCountrySwitch.ts:45-57`.
3. Symptom: filtering by sale option causes infinite scroll to append old products. Test: filter, scroll, expect only matching products. Suspect `listingKey` use at `src/components/products/ProductListing.tsx:155-174`.
4. Symptom: duplicate order confirmation emails after webhook retry. Test: call handler twice with same event id, expect one send. Suspect idempotency at `src/lib/webhooks/handlers.ts:20-41`.
5. Symptom: guest user lands on order placed page but sees not found. Test: complete guest checkout and preserve order token. Suspect `CartContext` order-placed exception at `src/contexts/CartContext.tsx:122-135`.

## Git History Learning Exercise

Realistic commit messages and what to infer:

1. `Add URL-backed product filters`: expect changes in `src/lib/utils/listing-search-params.ts:65-142`, `src/components/products/ListingFilterBar.tsx:31-48`, and product listing pages.
2. `Fix guest order placed token race`: expect changes around `src/contexts/CartContext.tsx:122-135` and `src/lib/data/checkout.ts:23-31`.
3. `Cache product listing by market and user`: expect changes in `src/lib/data/products.ts:17-31` and `next.config.ts:24-31`.
4. `Add Spree webhook emails`: expect `src/app/api/webhooks/spree/route.ts:11-32`, `src/lib/spree/webhooks.ts:43-110`, and `src/lib/webhooks/handlers.ts:46-224`.
5. `Support express checkout in cart drawer`: expect dynamic import and express checkout handling in `src/components/cart/CartDrawer.tsx:23-29` and `src/components/cart/CartDrawer.tsx:263-274`.

## If I Owned This Codebase

| Refactor | Effort | Impact | Source reason |
|---|---:|---:|---|
| Extract checkout orchestration hooks from `CheckoutPageContent` | High | High | Current file spans UI, loading, effects, mutations, validation at `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:84-793`. |
| Replace webhook in-memory idempotency with durable store | Medium | High | In-memory `Set` at `src/lib/webhooks/handlers.ts:20-41` is not deployment-durable. |
| Add tests for listing URL parser and filter serialization | Low | Medium | Parser is central at `src/lib/utils/listing-search-params.ts:65-142`. |
| Add production image security note or conditional config for local IP | Low | Medium | `dangerouslyAllowLocalIP` is enabled at `next.config.ts:32-35`. |
| Create typed test fixture factories for `Cart`, `Product`, and `Order` | Medium | Medium | Existing tests cast fixtures with `as never` at `src/contexts/__tests__/CartContext.test.tsx:35-50`. |

## Senior Review Examples

Use senior review to protect system behavior, not to show that you can find style nits.

Example finding:

```text
High: Wishlist state is cached without user token segmentation.
Why it matters: src/lib/data/products.ts:17-31 already segments product cache by _userToken to avoid personalized data leakage. A wishlist read without the same principle could expose one user's saved products to another user.
Fix direction: include an authenticated user/token cache key, use private cache semantics, or avoid shared caching for wishlist reads.
Test: sign in as User A and User B, save different products, verify each account only sees its own wishlist after refresh.
```

Example non-finding:

```text
Nit: Button text could be shorter.
```

The first comment changes engineering decisions. The second may be true, but it is not the senior-level risk.

Example architecture decision record:

```text
Decision: Keep wishlist persistence server-side instead of localStorage-only.
Context: Product saves are account-specific and should follow users across devices.
Options considered: localStorage, Spree extension, custom backend table/API.
Choice: backend-backed wishlist, surfaced through server actions.
Consequences: more backend work, but better auth, cache, privacy, and cross-device behavior.
Validation: tests for guest prompt, authenticated save/remove, and user isolation.
```

## Senior Socratic Checkpoint

1. Which architectural choice most protects the Spree publishable key?
2. Which cache decision prevents personalized-price leakage?
3. Which state boundary would you refactor first and why?
4. Which security issue is acceptable only with an explicit trust policy?
5. Which in-memory behavior is unsafe in serverless/multi-instance deployment?
6. Which tests would give the highest confidence per hour?
7. Which performance choices should be preserved during feature work?
8. How would you explain this codebase's biggest tradeoff in one minute?

How to self-grade:

- Strong answers cite `README.md:70-75`, `src/lib/data/products.ts:17-31`, `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:84-793`, `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:214-218`, `src/lib/webhooks/handlers.ts:20-41`, and `src/components/products/ProductListing.tsx:100-137`.
