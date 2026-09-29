# Architecture Reference Suite

## Doc 1: Junior Onboarding Guide

Start with the run path. Install with `npm install`, copy `.env.local.example` to `.env.local`, set `SPREE_API_URL` and `SPREE_PUBLISHABLE_KEY`, run Spree 5.4+, then run `npm run dev`; these steps are documented at `README.md:84-138` and scripts are defined at `package.json:5-14`.

Read in this order:

1. `src/app/layout.tsx:37-62` for the global shell.
2. `src/proxy.ts:1-10` and `src/lib/spree/middleware.ts:45-105` for country/locale routing.
3. `src/app/[country]/[locale]/layout.tsx:43-93` for i18n, markets, and providers.
4. `src/lib/spree/config.ts:23-36` for SDK setup.
5. `src/lib/data/cart.ts:21-157` for server actions.
6. `src/contexts/CartContext.tsx:39-184` for client state.
7. `src/components/products/ProductCard.tsx:22-111` for simple typed UI.

When you get lost, ask: "Is this server state, URL state, cookie state, or client React state?" The answer usually points to `src/lib/data`, `src/lib/utils/listing-search-params.ts:65-142`, `src/lib/spree/cookies.ts:31-155`, or `src/contexts`.

## Doc 2: Mid-Level Architecture Guide

System contract:

- Next App Router owns page composition at `src/app/layout.tsx:37-62` and `src/app/[country]/[locale]/layout.tsx:43-93`.
- Middleware normalizes market URL state at `src/lib/spree/middleware.ts:45-105`.
- Server Actions own Spree calls at `src/lib/data/cart.ts:21-157`, `src/lib/data/products.ts:17-79`, and `src/lib/data/checkout.ts:11-168`.
- Spree SDK config is centralized at `src/lib/spree/config.ts:23-36`.
- Client Context owns interactive session state at `src/contexts/CartContext.tsx:39-184`, `src/contexts/AuthContext.tsx:57-142`, and `src/contexts/StoreContext.tsx:66-113`.

Most important data flow: add-to-cart starts in `ProductDetails` at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:98-110`, passes through `CartContext` at `src/contexts/CartContext.tsx:91-100`, mutates Spree at `src/lib/data/cart.ts:91-105`, and updates the drawer at `src/components/cart/CartDrawer.tsx:76-79`.

## Doc 3: Senior Ownership Guide

Protect these decisions:

- Server-first Spree access from README architecture at `README.md:70-80`.
- HTTP-only token cookies at `src/lib/spree/cookies.ts:43-60` and `src/lib/spree/cookies.ts:76-84`.
- User-segmented product cache keys at `src/lib/data/products.ts:17-31`.
- URL-backed listing filters at `src/lib/utils/listing-search-params.ts:1-13`.

Debt register:

- Durable webhook idempotency is missing; current state is an in-memory `Set` at `src/lib/webhooks/handlers.ts:20-41`.
- Checkout component is too broad at `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:84-793`.
- Trusted HTML rendering needs explicit sanitation/trust policy at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:214-218`.
- Production image config should review `dangerouslyAllowLocalIP` at `next.config.ts:32-35`.

## Doc 4: Code Review Guide

Review order:

1. Route and ownership: does the change belong in `src/app`, `src/components`, `src/contexts`, `src/lib/data`, or `src/lib/spree`?
2. Server boundary: browser code should not call Spree directly; compare the server-first rule at `README.md:70-75`.
3. Token handling: cart/auth tokens should flow through helpers like `getCartOptions` at `src/lib/spree/cookies.ts:125-134`.
4. Cache invalidation: cart mutations should update `cart`, checkout mutations should update `checkout`, as shown at `src/lib/data/cart.ts:103-104` and `src/lib/data/checkout.ts:49-50`.
5. URL state: product filter changes should use `buildListingSearchParams` at `src/lib/utils/listing-search-params.ts:107-142`.
6. Tests: look for Vitest coverage or fixture updates based on `vitest.config.ts:12-17`.

## Doc 5: Debugging Guide

For product listing bugs:

1. Check route parse at `src/app/[country]/[locale]/(storefront)/products/page.tsx:28-34`.
2. Check query construction at `src/components/products/ProductListing.tsx:98-124`.
3. Check server action cache at `src/lib/data/products.ts:17-31`.
4. Check client scroll state at `src/components/products/InfiniteProductList.tsx:54-69`.

For cart bugs:

1. Check context state and mutation wrapper at `src/contexts/CartContext.tsx:62-100`.
2. Check server action at `src/lib/data/cart.ts:91-139`.
3. Check cookies at `src/lib/spree/cookies.ts:43-60`.
4. Check drawer rendering at `src/components/cart/CartDrawer.tsx:76-79`.

For webhook bugs:

1. Check route env guard at `src/app/api/webhooks/spree/route.ts:11-19`.
2. Check signature verification at `src/lib/spree/webhooks.ts:55-77`.
3. Check handler dispatch at `src/app/api/webhooks/spree/route.ts:21-29`.
4. Check email handler behavior at `src/lib/webhooks/handlers.ts:46-224`.

## Doc 6: Change Playbook

To add a user-facing feature:

1. Find the route in `src/app`; product routes are examples at `src/app/[country]/[locale]/(storefront)/products/page.tsx:24-76`.
2. Find the data action in `src/lib/data`; cart actions are examples at `src/lib/data/cart.ts:21-157`.
3. Decide state home: URL (`src/lib/utils/listing-search-params.ts:65-142`), Context (`src/contexts/CartContext.tsx:39-184`), or local component state (`src/components/products/InfiniteProductList.tsx:54-69`).
4. Update UI components in `src/components` or route-local components like `ProductDetails` at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:21-253`.
5. Add or update tests following `src/contexts/__tests__/CartContext.test.tsx:56-237`.
6. Run `npm run check` and `npm run test` from scripts at `package.json:9-14`.

## Doc 7: Interview Walkthrough

"This is a headless Spree storefront built on Next.js App Router. The app is localized by `/{country}/{locale}` URL segments, enforced by middleware in `src/lib/spree/middleware.ts:45-105`. Server components and server actions fetch from Spree through a centralized SDK client in `src/lib/spree/config.ts:23-36`. Cart and auth tokens are stored as HTTP-only cookies in `src/lib/spree/cookies.ts:43-60` and `src/lib/spree/cookies.ts:76-84`. Product listing state is URL-backed through `src/lib/utils/listing-search-params.ts:65-142`, while infinite scrolling is local client state in `src/components/products/InfiniteProductList.tsx:54-69`. The biggest operational concerns are checkout complexity in `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:84-793` and webhook idempotency currently being in-memory at `src/lib/webhooks/handlers.ts:20-41`."

