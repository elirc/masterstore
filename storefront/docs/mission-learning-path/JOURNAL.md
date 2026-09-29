# Mission Learning Path Journal

## Mission Design Rationale

The missions are ordered from "find the heartbeat" to "own the system." The codebase is a Next.js 16 Spree storefront: README technology and architecture claims live at `README.md:57-80`, scripts at `package.json:5-14`, and the server-first data layer lives in `src/lib/data` with `"use server"` in `src/lib/data/cart.ts:1`, `src/lib/data/products.ts:1`, and `src/lib/data/checkout.ts:1`.

## Why This Order

Missions 1-3 teach project shape, folders, and TypeScript contracts before asking you to trace behavior. This order matches the actual entry path: scripts in `package.json:5-14`, root layout in `src/app/layout.tsx:37-62`, localized provider layout in `src/app/[country]/[locale]/layout.tsx:43-93`, and type contracts in `src/types/filters.ts:1-20`.

Missions 4-8 move through component, route, props, data fetch, and navigation because product browsing uses all five: `ProductCard` at `src/components/products/ProductCard.tsx:22-111`, product route at `src/app/[country]/[locale]/(storefront)/products/page.tsx:24-76`, product listing at `src/components/products/ProductListing.tsx:75-200`, and middleware at `src/lib/spree/middleware.ts:45-105`.

Missions 9-17 build mid-level instincts around state, hooks, effects, contracts, middleware, full-stack traces, diffs, composition, and TypeScript inference. The central anchors are `CartContext` at `src/contexts/CartContext.tsx:39-184`, `useCountrySwitch` at `src/hooks/useCountrySwitch.ts:21-68`, and listing URL parsing at `src/lib/utils/listing-search-params.ts:65-164`.

Missions 18-24 develop senior review instincts around architecture decisions, bug prevention, performance, security, tests, and history. The chosen anchors are checkout complexity at `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:84-793`, webhook idempotency at `src/lib/webhooks/handlers.ts:20-41`, trusted HTML at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:214-218`, and Vitest config at `vitest.config.ts:5-17`.

## Code Paths Chosen

- App heartbeat: `src/app/layout.tsx:37-62` and `src/app/[country]/[locale]/layout.tsx:43-93`.
- Folder map: `src/app`, `src/components`, `src/contexts`, `src/hooks`, `src/lib/data`, `src/lib/spree`, and `src/types`, verified by file layout and imports.
- TypeScript contract: `src/types/filters.ts:1-20` and `src/lib/utils/listing-search-params.ts:65-101`.
- First React component: `src/components/products/ProductCard.tsx:22-111`.
- First Node.js route: `src/app/api/webhooks/spree/route.ts:11-32`.
- Full API contract: `src/lib/data/cart.ts:21-157`, `src/lib/data/checkout.ts:11-168`, and `src/lib/data/payment.ts:10-185`.
- End-to-end feature trace: product add-to-cart from `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:98-110` to `src/lib/data/cart.ts:91-105` to `src/components/cart/CartDrawer.tsx:76-79`.

## Skill By Tier

- Junior: recognize stack, entry points, components, routes, props, data reads, and navigation.
- Mid-level: decide state ownership, trace effects, map API contracts, read diffs, and understand composition.
- Senior: critique tradeoffs, find risks before bugs appear, design tests, and infer architecture evolution.

## What A Senior Would Do Differently

At every checkpoint, a senior asks three extra questions:

1. What owns this behavior?
2. What breaks when this changes?
3. How would I prove my answer with a test or source line?

That habit is visible in the repo's own defensive comments: product listing explains state ownership at `src/lib/utils/listing-search-params.ts:1-13`, cart context explains guest order token races at `src/contexts/CartContext.tsx:122-135`, and checkout explains stale router-cache recovery at `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:266-304`.

