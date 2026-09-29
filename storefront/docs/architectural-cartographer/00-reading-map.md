# Reading Map

## Mental Model

This app is a localized ecommerce cash register plus catalog window: URLs choose the market, server actions talk to Spree, HTTP-only cookies remember cart/auth, server components fetch stable catalog data, and client islands handle interactive moments like filters, country switching, cart drawer, variant selection, and checkout. The README describes the server-first pattern at `README.md:70-80`; the localized provider stack is in `src/app/[country]/[locale]/layout.tsx:73-93`; the Spree SDK client is configured at `src/lib/spree/config.ts:23-36`.

Use the docs like a field notebook. For every file below, write one sentence for each of these questions: what owns the data, what calls it, what can fail, and what user-visible behavior changes if this file changes. That habit turns code reading into engineering judgment instead of passive scanning.

## Top 10 Files To Read In Order

1. `package.json:5-14`, `package.json:16-45`, `package.json:49-64`
   - Why now: know the scripts and libraries before reading code.
   - Understand before reading: npm runs this project.
   - Explain after reading: why Next, Spree SDK, next-intl, Sentry, payment SDKs, and Vitest all appear.

2. `README.md:68-80`, `README.md:82-138`
   - Why now: this states the intended architecture and setup.
   - Understand before reading: server-first means browser actions call your Next app, not Spree directly.
   - Explain after reading: how to run the app and why Spree must be running.

3. `src/app/layout.tsx:37-62`
   - Why now: every route passes through this global shell.
   - Understand before reading: layouts wrap route children in Next App Router.
   - Explain after reading: where global metadata, font class, analytics, and preconnect happen.

4. `src/proxy.ts:1-10` and `src/lib/spree/middleware.ts:45-105`
   - Why now: country and locale shape every route.
   - Understand before reading: middleware runs before most page code.
   - Explain after reading: how `/products` becomes `/{country}/{locale}/products`.

5. `src/app/[country]/[locale]/layout.tsx:43-93`
   - Why now: this is the application shell for localized pages.
   - Understand before reading: route params are async in this app's Next version.
   - Explain after reading: how markets, messages, and providers are composed.

6. `src/lib/spree/config.ts:23-36` and `src/lib/spree/cookies.ts:43-60`
   - Why now: data access depends on SDK config and cookies.
   - Understand before reading: Spree is the source of truth.
   - Explain after reading: what env vars and cart cookies do.

7. `src/lib/data/products.ts:17-32`, `src/lib/data/products.ts:43-62`
   - Why now: product listing and detail are the cleanest read paths.
   - Understand before reading: cache tags and locale options change returned data.
   - Explain after reading: why user token is part of cache segmentation.

8. `src/app/[country]/[locale]/(storefront)/products/page.tsx:24-76` and `src/components/products/ProductListing.tsx:75-200`
   - Why now: this is the catalog browsing flow.
   - Understand before reading: URL search params are state.
   - Explain after reading: how products, filters, and infinite scroll connect.

9. `src/contexts/CartContext.tsx:39-184` and `src/lib/data/cart.ts:21-157`
   - Why now: cart is the most important user mutation path.
   - Understand before reading: client context calls server actions.
   - Explain after reading: how add/update/remove cart operations refresh UI state.

10. `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:84-793`
    - Why now: checkout reveals system complexity.
    - Understand before reading: local UI state and backend order state must stay synchronized.
    - Explain after reading: where address, shipping, payment, policy consent, and completion happen.

## Example Reading Session

Goal: understand how a product card link stays localized.

1. Start at `src/components/products/ProductCard.tsx:22-111`.
2. Find where `basePath` is received and used.
3. Jump to `src/components/products/ProductListing.tsx:155-174` to see who passes product cards into the list.
4. Jump to `src/app/[country]/[locale]/(storefront)/products/page.tsx:61-73` to see where `basePath` comes from.
5. Write the causal chain: localized route params create `basePath`, product listing passes it down, product card builds links from it, and navigation stays inside the current country/locale.

Good note:

```text
ProductCard does not know country or locale directly. It trusts basePath from the route/listing layer. If I add a link inside ProductCard, I should reuse basePath instead of hard-coding /products.
```

Weak note:

```text
ProductCard links to product page.
```

The stronger note explains ownership and the mistake it prevents.

## Three Most Important Data Flows

1. Catalog listing: `products/page.tsx` parses URL state at `src/app/[country]/[locale]/(storefront)/products/page.tsx:28-34`, calls `ProductListing` at `src/app/[country]/[locale]/(storefront)/products/page.tsx:61-73`, fetches products and filters in parallel at `src/components/products/ProductListing.tsx:131-137`, and renders an infinite client island at `src/components/products/ProductListing.tsx:155-174`.

2. Add to cart: `ProductDetails` computes selected variant and calls `addItem` at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:98-110`; `CartContext` wraps `addToCartAction` at `src/contexts/CartContext.tsx:91-100`; `addToCart` creates or loads a cart and calls Spree at `src/lib/data/cart.ts:91-105`; the context updates state and refreshes the route at `src/contexts/CartContext.tsx:72-88`.

3. Checkout completion: checkout loads initial cart, market, addresses, and auth at `src/app/[country]/[locale]/(checkout)/checkout/[id]/page.tsx:28-69`; the client submits payment at `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:444-505`; payment server actions complete the payment session and order at `src/lib/data/payment.ts:52-68` and `src/lib/data/payment.ts:79-104`.

## Pre-Reading Checklist

1. Can I explain why the app needs both `country` and `locale` in the URL?
2. Can I find the global layout and localized layout?
3. Can I name where Spree API credentials come from?
4. Can I tell whether data is fetched in browser code or server actions?
5. Can I find where cart tokens are stored?
6. Can I find one server component and one client component?
7. Can I identify which state lives in the URL?
8. Can I identify which state lives in React Context?
9. Can I find the webhook endpoint?
10. Can I run the local dev command from `package.json:5-14`?

## Note-Taking Template

Use this for any feature trace:

```text
Feature:
User action:
First file I found:
Server boundary:
Client state:
Durable state:
Cache or cookie involved:
Translation or locale involved:
Likely test target:
One thing I could break:
```

Example for add to cart:

```text
Feature: Add to cart
User action: click button on product detail
First file I found: ProductDetails.tsx
Server boundary: addToCartAction -> src/lib/data/cart.ts
Client state: CartContext cart + updating
Durable state: Spree cart/order
Cache or cookie involved: cart token cookies + cart tag invalidation
Translation or locale involved: product page basePath and storefront messages
Likely test target: CartContext addItem success/failure
One thing I could break: drawer opens but server cart does not persist
```

## Red Flags Checklist

- Browser code importing `@spree/sdk` directly would violate the README's server-first rule at `README.md:70-75`.
- A cart mutation that forgets `updateTag("cart")` would leave stale cache behind; compare `src/lib/data/cart.ts:103-104`, `src/lib/data/cart.ts:120-121`, and `src/lib/data/cart.ts:136-137`.
- A product cache key that ignores user token could leak personalized prices; see `_userToken` in `src/lib/data/products.ts:17-31`.
- A country switch that changes URL without updating cart market could show wrong currency; see `src/hooks/useCountrySwitch.ts:45-57`.
- A checkout change that overwrites local cart totals from `contextCart` can undo discount/shipping state; see the warning comments at `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:266-304`.
- A webhook handler without idempotency can duplicate emails; this repo has in-memory idempotency at `src/lib/webhooks/handlers.ts:20-41`, which is useful but deployment-limited.
- Admin HTML rendering needs a trust decision; product description uses `dangerouslySetInnerHTML` at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:214-218`.
- A filter UI storing product listing state only in component state would break shareable URLs; current parse/build logic is centralized at `src/lib/utils/listing-search-params.ts:65-142`.
- A route that forgets `basePath` can break localized navigation; `ProductCard` composes localized links at `src/components/products/ProductCard.tsx:62-66`.
