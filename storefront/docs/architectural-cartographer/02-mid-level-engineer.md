# Mid-Level Engineer Guide

## Architecture Diagram

```text
Browser
  |
  | route request, clicks, form submissions
  v
Next App Router
  |-- proxy.ts -> createSpreeMiddleware
  |     source: src/proxy.ts:1-10, src/lib/spree/middleware.ts:45-105
  |
  |-- layouts/providers
  |     source: src/app/layout.tsx:37-62, src/app/[country]/[locale]/layout.tsx:73-93
  |
  |-- server components
  |     source: src/components/products/ProductListing.tsx:75-200
  |
  |-- client islands/context
  |     source: src/contexts/CartContext.tsx:39-184, src/components/products/InfiniteProductList.tsx:41-162
  |
  v
Server Actions in src/lib/data
  |     source: src/lib/data/cart.ts:21-157, src/lib/data/products.ts:17-79
  v
Spree SDK client
  |     source: src/lib/spree/config.ts:23-36
  v
Spree API and Spree database
```

## TypeScript Type System Deep Dive

The app leans on SDK types for domain objects and app-owned interfaces for UI contracts. `ProductCardProps` defines which product card inputs are required or optional at `src/components/products/ProductCard.tsx:10-20`; `ProductListingProps` defines the contract between route pages, server listing logic, and the client infinite-scroll island at `src/components/products/ProductListing.tsx:26-50`; `CartContextType` defines the shared cart state and actions at `src/contexts/CartContext.tsx:23-35`.

The strongest small TypeScript pattern is the filter contract. `AvailabilityStatus` is a literal union at `src/types/filters.ts:1-1`; `isAvailabilityStatus` narrows a string at runtime at `src/types/filters.ts:8-12`; `parseListingSearchParams` uses that guard before accepting a URL value at `src/lib/utils/listing-search-params.ts:72-76`.

Annotated filter parsing:

```ts
const availabilityRaw = readFirst(params, LISTING_PARAM_KEYS.availability); // URL gives strings, not trusted types.
const availability: AvailabilityStatus | undefined =
  availabilityRaw && isAvailabilityStatus(availabilityRaw)
    ? availabilityRaw // TypeScript now knows this is "in_stock" | "out_of_stock".
    : undefined; // Invalid URL values are ignored instead of entering app state.
```

The biggest type risk is where complex SDK objects are cast broadly, such as `as never` in tests at `src/contexts/__tests__/CartContext.test.tsx:35-41` and `src/contexts/__tests__/CartContext.test.tsx:43-50`. Those casts are acceptable for focused unit tests, but production code should avoid them because they hide contract drift.

## State Management Deep Dive: Cart

Cart state has three homes:

- Spree owns the durable cart/order record through SDK calls in `src/lib/data/cart.ts:21-157`.
- HTTP-only cookies hold cart ID and token at `src/lib/spree/cookies.ts:43-60`.
- React Context holds the current browser session view of cart data at `src/contexts/CartContext.tsx:39-184`.

The mutation pattern is centralized in `mutateCart` at `src/contexts/CartContext.tsx:62-89`.

```ts
const mutateCart = useCallback(async (action, fallbackMessage, onSuccess) => {
  setUpdating(true); // UI can disable quantity/remove buttons.
  try {
    const result = await action(); // Server action returns standardized success/error.
    if (result.success) {
      setCart(result.cart ?? null); // Client context mirrors the server response.
      onSuccess?.(); // addItem opens the drawer.
      router.refresh(); // Server components that read cart-sensitive data can refresh.
    } else {
      toast.error(result.error || fallbackMessage); // User gets feedback without throwing.
    }
  } finally {
    setUpdating(false); // Always release UI updating state.
  }
}, [router]);
```

The order-placed exception at `src/contexts/CartContext.tsx:122-135` is a mid-level clue: automatic refresh would clear the guest token before the completed-order page can use it, so navigation behavior and token lifetime are coupled.

## API Contract Map

| Contract | Caller | Server action/helper | Spree call | Source |
|---|---|---|---|---|
| Product list | Products/category pages | `getProducts`, `getCategoryProducts` | `products.list` | `src/lib/data/products.ts:28-32`, `src/lib/data/categories.ts:61` |
| Product detail | Product page | `getCachedProduct` wrapper over product action | `products.get` | `src/app/[country]/[locale]/(storefront)/products/[slug]/page.tsx:54-57`, `src/lib/data/products.ts:43-62` |
| Cart read | Cart context/pages | `getCart` | `carts.get` or `carts.list` | `src/lib/data/cart.ts:21-57` |
| Add item | Product details/cart context | `addToCart` | `carts.items.create` | `src/lib/data/cart.ts:91-105` |
| Update/remove item | Cart drawer/page | `updateCartItem`, `removeCartItem` | `carts.items.update/delete` | `src/lib/data/cart.ts:108-139` |
| Login/register | Auth context | `login`, `register` | `auth.login`, `customers.create` | `src/lib/data/customer.ts:76-132` |
| Checkout address | Checkout page | `updateOrderAddresses` | `carts.update` | `src/lib/data/checkout.ts:34-52` |
| Delivery rate | Checkout page | `selectDeliveryRate` | `carts.fulfillments.update` | `src/lib/data/checkout.ts:67-84` |
| Payment session | Payment section | `createCheckoutPaymentSession` | `carts.paymentSessions.create` | `src/lib/data/payment.ts:10-29` |
| Webhook | Spree server | `createWebhookHandler` | verifies SDK webhook signature | `src/lib/spree/webhooks.ts:43-110` |

## Component Interaction Map

`src/app/[country]/[locale]/layout.tsx:73-93` wraps the app in `NextIntlClientProvider`, `StoreProvider`, `AuthProvider`, and `CartProvider`. That means `ProductDetails` can call `useCart` and `useStore` at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:21-24`, `CartButton` can read item count through `useCart` at `src/components/layout/CartButton.tsx:1-9`, and `CountrySwitcher` can use store/cart data through `useCountrySwitch` at `src/hooks/useCountrySwitch.ts:21-68`.

Product listing splits responsibilities:

- Route parses URL and chooses list metadata at `src/app/[country]/[locale]/(storefront)/products/page.tsx:28-43`.
- Server component fetches first page and facets at `src/components/products/ProductListing.tsx:96-137`.
- Client filter bar writes URL changes at `src/components/products/ListingFilterBar.tsx:31-48`.
- Client infinite list accumulates more pages at `src/components/products/InfiniteProductList.tsx:81-126`.

## Full-Stack Feature Trace: Add To Cart

1. Product page loads product detail through `getCachedProduct` at `src/app/[country]/[locale]/(storefront)/products/[slug]/page.tsx:54-57`.
2. `ProductDetails` receives the product and initializes selected variant at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:34-44`.
3. User clicks add to cart; `handleAddToCart` chooses a variant, calls `addItem`, and tracks analytics at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:98-110`.
4. `CartContext.addItem` calls `addToCartAction` and opens the drawer on success at `src/contexts/CartContext.tsx:91-100`.
5. `addToCart` loads or creates a cart, reads cart/access tokens, calls `getClient().carts.items.create`, and invalidates the `cart` tag at `src/lib/data/cart.ts:91-105`.
6. `mutateCart` sets the returned cart into React state and calls `router.refresh()` at `src/contexts/CartContext.tsx:72-88`.
7. `CartDrawer` renders updated line items from context at `src/components/cart/CartDrawer.tsx:76-79` and `src/components/cart/CartDrawer.tsx:143-231`.

## Diff Reading Exercise

Hypothetical change: add a "clear cart" button to `CartDrawer`.

Read the diff in this order:

1. Look for server action support. `clearCart` already exists at `src/lib/data/cart.ts:83-89`.
2. Look for context exposure. `CartContextType` currently exposes add/update/remove/refresh but not clear at `src/contexts/CartContext.tsx:23-35`.
3. Look for UI placement. Drawer footer and line-item actions live at `src/components/cart/CartDrawer.tsx:235-293`.
4. Look for cache behavior. `clearCart` calls `updateTag("cart")` at `src/lib/data/cart.ts:83-89`.
5. Look for tests. Existing cart context tests cover add/update/remove/toggle at `src/contexts/__tests__/CartContext.test.tsx:102-237`, but not clear.

Strong review comment: "Expose `clearCart` through `CartContextType`, update provider value and tests, then add a footer button in `CartDrawer`. Do not call `clearCart` directly from the drawer if the drawer's cart state is expected to update immediately."

Example implementation sketch before coding:

```text
1. Add clearCart to CartContextType.
2. Implement clearCart in provider with mutateCart(() => clearCartAction(), "Failed to clear cart").
3. Include clearCart in the provider value.
4. Add a small destructive button near the drawer footer only when line items exist.
5. Disable it while updating, just like quantity/remove controls.
6. Extend CartContext tests with success and failure cases.
```

Example review notes after coding:

```text
Good: UI uses context, so drawer state and toast behavior stay centralized.
Risk: clear cart should not render for an empty cart.
Risk: a failure should leave current cart lines visible.
Manual QA: add two products, clear cart, refresh page, confirm the cart stays empty.
```

## Non-Obvious Architectural Patterns

- URL as catalog state: `src/lib/utils/listing-search-params.ts:1-13` says filters/sort/query live in the URL while pagination is ephemeral. This makes product browsing shareable like a storefront aisle number.
- Cache segmentation by user token: `src/lib/data/products.ts:17-31` passes `_userToken` only to the cached function signature, not the SDK, so cache keys differ for authenticated users.
- Server-action binding: category page binds `category.id` to `getCategoryProducts` at `src/app/[country]/[locale]/(storefront)/c/[...permalink]/page.tsx:57-61` because inline closures cannot cross the server-to-client boundary.
- Defensive order retrieval: checkout avoids `getCart()` on completed orders in `getCompletedOrder` because `getCart()` may clear guest cookies at `src/lib/data/checkout.ts:23-31`.

## Mid-Level Debugging Examples

Bug: product filters work until you refresh, then reset.

Likely inspection order:

1. `src/components/products/ListingFilterBar.tsx:31-48` to see whether the UI writes URL params.
2. `src/lib/utils/listing-search-params.ts:65-142` to see whether the parser accepts those params.
3. `src/app/[country]/[locale]/(storefront)/products/page.tsx:28-43` to see whether route state is passed into listing.
4. `src/components/products/ProductListing.tsx:96-137` to see whether query params become Spree list params.

Reasoning goal: prove whether the state is lost in the UI event, URL serialization, route parsing, or server fetch.

Bug: cart count updates, but the cart drawer still shows old line items.

Likely inspection order:

1. `src/contexts/CartContext.tsx:62-89` for `mutateCart` behavior.
2. `src/lib/data/cart.ts:91-139` for returned cart payload and tag invalidation.
3. `src/components/cart/CartDrawer.tsx:76-79` for context consumption.
4. `src/components/layout/CartButton.tsx:1-9` to compare count rendering.

Reasoning goal: decide whether the stale value is in server response, context state, or a component reading a different source.

## Mid-Level Socratic Checkpoint

1. Why is cart state duplicated between Spree, cookies, and React Context?
2. Why does product cache include `_userToken` even though SDK calls do not use it?
3. What breaks if listing filters live only in `useState`?
4. Why does `ProductListing` fetch filters and products in `Promise.all`?
5. Why does category page use `.bind()` for `getCategoryProducts`?
6. Why is webhook signature verification done before `JSON.parse`?
7. What makes checkout state harder than cart drawer state?
8. What files would you inspect for a payment completion bug?

How to self-grade:

- Strong answers cite `src/contexts/CartContext.tsx:39-184`, `src/lib/spree/cookies.ts:43-60`, `src/lib/data/products.ts:17-31`, `src/lib/utils/listing-search-params.ts:1-13`, `src/components/products/ProductListing.tsx:131-137`, `src/app/[country]/[locale]/(storefront)/c/[...permalink]/page.tsx:57-61`, `src/lib/spree/webhooks.ts:55-84`, and `src/lib/data/payment.ts:52-104`.
- Strong answers describe tradeoffs: shareable URLs, cache correctness, token safety, and UI responsiveness.
