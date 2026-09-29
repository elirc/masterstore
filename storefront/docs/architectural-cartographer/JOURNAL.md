# Architectural Cartographer Journal

## First-Pass Mental Model

This repository is a Next.js 16, React 19, TypeScript storefront for Spree Commerce. The README states the app is a headless ecommerce storefront for the Spree REST API at `README.md:5-7`, and the dependencies confirm Next, React, `@spree/sdk`, Stripe, PayPal, Adyen, `next-intl`, Sentry, and Vitest at `package.json:16-45` and `package.json:49-64`.

The system is server-first. The README explicitly says "All API calls happen server-side using Next.js Server Actions" and "No Client-Side API Calls" at `README.md:70-75`. The implementation matches that: storefront data functions begin with `"use server"` in `src/lib/data/cart.ts:1`, `src/lib/data/products.ts:1`, `src/lib/data/checkout.ts:1`, `src/lib/data/customer.ts:1`, and `src/lib/data/payment.ts:1`.

There is no local database or ORM layer in this repo. Persistence lives in Spree through `@spree/sdk`, with local state carried through HTTP-only cookies for cart and auth at `src/lib/spree/cookies.ts:43-60` and `src/lib/spree/cookies.ts:76-84`.

## Inspection Findings

- Package manager: npm, because `package-lock.json` is present and scripts are npm scripts in `package.json:5-14`.
- Frontend entry point: root App Router layout at `src/app/layout.tsx:37-62`.
- Localized app shell: `[country]/[locale]` layout wraps providers and validates markets at `src/app/[country]/[locale]/layout.tsx:43-93`.
- Routing system: Next App Router file routes under `src/app`, with product listing at `src/app/[country]/[locale]/(storefront)/products/page.tsx:24-76`, category listing at `src/app/[country]/[locale]/(storefront)/c/[...permalink]/page.tsx:30-87`, product detail at `src/app/[country]/[locale]/(storefront)/products/[slug]/page.tsx:46-100`, and webhook API route at `src/app/api/webhooks/spree/route.ts:11-32`.
- Backend/API layer: Next Server Actions in `src/lib/data/*`, Spree client in `src/lib/spree/config.ts:23-36`, and webhook route handlers in `src/lib/spree/webhooks.ts:43-110`.
- State management: React Context for store, auth, cart, and checkout summary. Cart context exposes cart data and mutations at `src/contexts/CartContext.tsx:23-35`; Auth context exposes user state and auth methods at `src/contexts/AuthContext.tsx:27-44`; Store context exposes country, locale, currency, and markets at `src/contexts/StoreContext.tsx:16-23`.
- Auth layer: implemented through Spree auth endpoints and HTTP-only cookies, with refresh support at `src/lib/spree/auth-helpers.ts:17-41` and `src/lib/spree/auth-helpers.ts:49-77`.
- Database/ORM: absent locally; Spree owns products, carts, customers, addresses, payment sessions, and orders through SDK calls such as `getClient().carts.items.create` at `src/lib/data/cart.ts:91-105`.
- Testing tools: Vitest with jsdom and Testing Library configured at `vitest.config.ts:5-17`; example cart context tests at `src/contexts/__tests__/CartContext.test.tsx:56-237`.
- Build/dev scripts: `dev`, `build`, `start`, `lint`, `format`, `check`, `test`, `test:watch`, and locale parity script at `package.json:5-14`.

## Teaching Anchors Chosen

- `src/app/layout.tsx:37-62`: shows global app shell, font, analytics, Sentry-adjacent config, and children rendering.
- `src/app/[country]/[locale]/layout.tsx:43-93`: shows route params, market validation, i18n provider, and context composition.
- `src/lib/spree/middleware.ts:45-105`: shows country/locale URL normalization and cookie sync.
- `src/lib/spree/config.ts:23-36`: shows SDK initialization and why env vars matter.
- `src/lib/data/products.ts:17-32` and `src/lib/data/products.ts:43-62`: show cached server-side product reads.
- `src/components/products/ProductListing.tsx:75-200`: shows a server component coordinating filters, products, and infinite scrolling.
- `src/components/products/InfiniteProductList.tsx:41-162`: shows client-owned ephemeral pagination state.
- `src/components/products/ProductCard.tsx:22-111`: simple typed UI component with analytics.
- `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:21-253`: complex client component with variants, cart mutation, analytics, and trusted HTML rendering.
- `src/contexts/CartContext.tsx:39-184`: the clearest example of client state wrapping server actions.
- `src/lib/data/cart.ts:21-157`: cart persistence and mutation flow.
- `src/app/api/webhooks/spree/route.ts:11-32` plus `src/lib/spree/webhooks.ts:43-110`: simple backend route/controller anatomy.
- `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:84-793`: complex checkout state machine.

## Where A Junior Might Get Confused

- Client components can import server actions, as `ProductDetails` calls `useCart` at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:21-24`, and `CartContext` imports server actions at `src/contexts/CartContext.tsx:16-21`.
- The app does not fetch Spree directly from the browser; the README says the API key is not exposed at `README.md:70-75`, and the SDK client is created server-side from env vars at `src/lib/spree/config.ts:23-36`.
- Product listing state lives in the URL, but infinite-scroll page accumulation lives in a client island, documented in code at `src/lib/utils/listing-search-params.ts:1-13` and implemented at `src/components/products/InfiniteProductList.tsx:54-69`.
- There is auth in the storefront, but no custom local user database. Spree customer endpoints and cookies hold the real auth state at `src/lib/data/customer.ts:51-70` and `src/lib/spree/cookies.ts:71-123`.

## Where A Mid-Level Engineer Should Slow Down

- Cache segmentation by user token in `src/lib/data/products.ts:17-31` matters because authenticated customers may see different prices.
- `CartContext` has a navigation exception for order placed pages at `src/contexts/CartContext.tsx:122-135`; this is a bug-prevention detail, not incidental code.
- Checkout intentionally compares line-item fingerprints only, not totals, to avoid overwriting local checkout mutations at `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:266-304`.
- Category page uses `.bind()` to pass a server action across the server-to-client boundary at `src/app/[country]/[locale]/(storefront)/c/[...permalink]/page.tsx:57-61`.

## Where A Senior Engineer Should Be Skeptical

- `dangerouslySetInnerHTML` is used for Spree-admin product descriptions at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:214-218` and policy HTML at `src/app/[country]/[locale]/(storefront)/policies/[slug]/page.tsx:63`; trust boundaries should be explicit.
- Webhook idempotency uses an in-memory `Set` at `src/lib/webhooks/handlers.ts:20-41`, which does not survive serverless cold starts or multi-instance deployments.
- `images.dangerouslyAllowLocalIP` is enabled in Next config at `next.config.ts:32-35`; useful in dev, risky if production deployment reaches internal networks.
- The checkout component is large, with many responsibilities from `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:84-793`; behavior is rich, but ownership boundaries are heavy.

## How To Use This Journal

Use this file as the senior engineer's margin notes. If you are lost, return to the mental model, pick one teaching anchor, and trace one causal path from route to data action to UI state.

