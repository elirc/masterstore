# User Stories

Use each story as a small apprenticeship. The acceptance criteria tell you what to build; the "What Could Go Wrong" section tells you how to think like a reviewer; the stretch goal tells you where to grow after the core behavior works.

For every story, capture a before-and-after note:

```text
Before: I think this change belongs in these files because...
After: The actual hard part was...
Next time I would inspect...
```

Example:

```text
Before: Story 4 probably belongs in products/page.tsx because active filters are route state.
After: The hard part was counting filters without counting sort/page state.
Next time I would inspect listing-search-params.ts first because it defines the app-owned URL contract.
```

## Story 1: Show SKU On Product Cards
**Difficulty:** Easy
**Estimated Time:** 1 hour
**Skills You'll Practice:** props reading, conditional rendering, product display
**The Story:** As a shopper, I want to see a product SKU on listing cards when available so that I can identify exact catalog items.
**Acceptance Criteria:**
- [ ] Product cards show SKU text only when the product has a SKU-like field available.
- [ ] Cards without SKU do not reserve blank space.
- [ ] Product name, image, price, sale badge, and out-of-stock display still work.
**Files You'll Likely Touch:** `src/components/products/ProductCard.tsx` displays product card UI and already reads product image, price, sale, and purchasability at `src/components/products/ProductCard.tsx:33-107`.
**High-Level Implementation Plan:**
1. Inspect the `Product` shape by hovering `product` in `src/components/products/ProductCard.tsx`.
2. Add a conditional display block near the product name in `ProductCard`.
3. Keep the block small and style it like supporting metadata.
4. Manually check `/us/en/products` after running the dev server.
**Tips:**
- Follow the existing conditional style used for `displayPrice` at `src/components/products/ProductCard.tsx:92-103`.
- Keep `ProductCard` display-only; do not add fetching here.
- Preserve the localized link built at `src/components/products/ProductCard.tsx:62-66`.
**What Could Go Wrong:**
- The SKU field may not exist on listing payload because `ProductListing` narrows fields at `src/components/products/ProductListing.tsx:100-113`.
- Long SKU text may wrap awkwardly; use small muted text.
**Stretch Goal:** Add a test in `src/components/products/__tests__/ProductCard.test.tsx` for SKU rendering.
**Connects To:** Story 2, because both practice safe, conditional UI changes.

## Story 2: Add A Sale Emphasis To Product Detail
**Difficulty:** Easy
**Estimated Time:** 1 hour
**Skills You'll Practice:** derived state, JSX conditions, translations
**The Story:** As a shopper, I want sale pricing on the product page to be visually clearer so that I can understand the discount quickly.
**Acceptance Criteria:**
- [ ] Sale products show the existing sale label more prominently.
- [ ] Non-sale products look unchanged.
- [ ] Price, original price, and add-to-cart behavior still work.
**Files You'll Likely Touch:** `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx` derives sale state at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:66-87` and renders price UI at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:129-145`.
**High-Level Implementation Plan:**
1. Read the `onSale` and `strikethroughPrice` calculations.
2. Adjust only the JSX under the price block.
3. Keep sale logic derived from existing price data.
4. Verify one sale and one non-sale product.
**Tips:**
- Do not add new state; `onSale` is already derived.
- Keep `t("sale")` from `next-intl` at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:141-142`.
- Avoid changing `handleAddToCart` at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:98-110`.
**What Could Go Wrong:**
- Changing price logic can mislabel compare-at prices.
- Adding layout-heavy markup can shift the add-to-cart area.
**Stretch Goal:** Add discount percentage if both current and original cents exist.
**Connects To:** Story 3, because both touch localized display text.

## Story 3: Add Empty Search Helper Text
**Difficulty:** Easy
**Estimated Time:** 1.5 hours
**Skills You'll Practice:** route state, translations, empty states
**The Story:** As a shopper, I want a helpful empty search message so that I know what to try next.
**Acceptance Criteria:**
- [ ] Search result empty state includes a suggestion to change search terms.
- [ ] Non-search empty product lists keep the generic filter guidance.
- [ ] Text is localized through message files.
**Files You'll Likely Touch:** `src/app/[country]/[locale]/(storefront)/products/page.tsx` chooses empty messages at `src/app/[country]/[locale]/(storefront)/products/page.tsx:70-72`; `messages/en.json` and other locale files provide translations imported by `src/app/[country]/[locale]/layout.tsx:14-26`.
**High-Level Implementation Plan:**
1. Add a new translation key under the products namespace.
2. Update `products/page.tsx` to use it when `query` exists.
3. Update every locale file or run `npm run check:locales` from `package.json:14`.
4. Test a query with no results.
**Tips:**
- `query` is derived from `listingState.query` at `src/app/[country]/[locale]/(storefront)/products/page.tsx:33-34`.
- Keep locale parity; the project has `scripts/check-locale-parity.ts` invoked by `package.json:14`.
- Avoid hard-coded English in components.
**What Could Go Wrong:**
- Missing locale keys can break runtime translation.
- Empty message may show for category pages if you change `ProductListing` globally instead of the products route.
**Stretch Goal:** Include the query string in the new localized helper.
**Connects To:** Story 4, because it prepares you to read listing state.

## Story 4: Add Active Filter Count To Products Heading
**Difficulty:** Medium
**Estimated Time:** 2 hours
**Skills You'll Practice:** derived data, URL state, utility reuse
**The Story:** As a shopper, I want to see how many filters are active so that I know the product list is narrowed.
**Acceptance Criteria:**
- [ ] Product listing heading displays active filter count when count is greater than zero.
- [ ] Search query alone does not count as a filter.
- [ ] Count updates when filters change.
**Files You'll Likely Touch:** `src/app/[country]/[locale]/(storefront)/products/page.tsx` owns the products heading at `src/app/[country]/[locale]/(storefront)/products/page.tsx:44-59`; `src/lib/utils/filters.ts` includes filter count helpers; `src/lib/utils/listing-search-params.ts` parses listing state at `src/lib/utils/listing-search-params.ts:65-101`.
**High-Level Implementation Plan:**
1. Inspect `getActiveFilterCount` in `src/lib/utils/filters.ts`.
2. Import it into `products/page.tsx`.
3. Compute count from `listingState.filters`.
4. Add conditional heading/subheading UI.
5. Add localized text if needed.
**Tips:**
- Do not count `listingState.query`; filters live under `listingState.filters`.
- Preserve existing search heading at `src/app/[country]/[locale]/(storefront)/products/page.tsx:47-50`.
- Keep the count display small.
**What Could Go Wrong:**
- Counting option values and price filters incorrectly can confuse users.
- Adding UI inside `ProductListing` may also affect category pages unexpectedly.
**Stretch Goal:** Add the same count to category pages.
**Connects To:** Story 5, because both read existing listing data without new backend work.

## Story 5: Add Product List Result Summary
**Difficulty:** Medium
**Estimated Time:** 2.5 hours
**Skills You'll Practice:** server component props, count display, component boundaries
**The Story:** As a shopper, I want to know how many products matched my filters so that I understand the size of the result set.
**Acceptance Criteria:**
- [ ] Listing shows total product count returned by the backend.
- [ ] Count updates when filters or search query change.
- [ ] Empty state still displays correctly.
**Files You'll Likely Touch:** `src/components/products/ProductListing.tsx` reads `totalCount` at `src/components/products/ProductListing.tsx:139-151`; `src/components/products/ListingFilterBar.tsx` already receives `totalCount` at `src/components/products/ListingFilterBar.tsx:10-14`.
**High-Level Implementation Plan:**
1. Decide whether the count belongs near filters or above the grid.
2. Use `productsResponse.meta.count` already read in `ProductListing`.
3. Add localized copy if visible text is new.
4. Verify search, filters, and empty results.
**Tips:**
- `ProductListingInner` is a server component, so it can render count before client hydration.
- Keep `ListingFilterBar` API stable unless the display belongs there.
- Do not add a second products fetch.
**What Could Go Wrong:**
- Showing count in the wrong place may duplicate filter bar count.
- Forgetting localization creates hard-coded English.
**Stretch Goal:** Show range text like "Showing 1-12 of 45."
**Connects To:** Story 6, because it gets you ready to change shared state paths.

## Story 6: Add Clear Cart To Cart Context And Drawer
**Difficulty:** Medium
**Estimated Time:** 3 hours
**Skills You'll Practice:** context API, server actions, UI mutation, tests
**The Story:** As a shopper, I want to clear my cart in one action so that I can restart shopping quickly.
**Acceptance Criteria:**
- [ ] Cart drawer shows a clear cart action when cart has items.
- [ ] Clicking it clears cart cookies/server state through the existing server action.
- [ ] Cart drawer updates immediately to empty state.
- [ ] Cart context tests cover success behavior.
**Files You'll Likely Touch:** `src/lib/data/cart.ts` already has `clearCart` at `src/lib/data/cart.ts:83-89`; `src/contexts/CartContext.tsx` defines context API at `src/contexts/CartContext.tsx:23-35`; `src/components/cart/CartDrawer.tsx` renders footer actions at `src/components/cart/CartDrawer.tsx:235-293`; `src/contexts/__tests__/CartContext.test.tsx` covers cart mutations at `src/contexts/__tests__/CartContext.test.tsx:102-214`.
**High-Level Implementation Plan:**
1. Import `clearCart` into `CartContext`.
2. Add `clearCart` or `clearItems` to `CartContextType`.
3. Implement it with the same `mutateCart` pattern or a specialized wrapper that sets cart to null.
4. Add a drawer button in the footer.
5. Add a context unit test.
**Tips:**
- Use existing `mutateCart` behavior at `src/contexts/CartContext.tsx:62-89`.
- Disable the button while `updating` like remove actions at `src/components/cart/CartDrawer.tsx:172-185`.
- Keep the server action as the source of truth.
**What Could Go Wrong:**
- Clearing cookies without updating context leaves stale items visible.
- Adding the action only to the drawer makes cart page stale.
**Stretch Goal:** Add the clear action to the full cart page too.
**Connects To:** Story 7, because both add cross-component behavior.

## Story 7: Add Recently Viewed Products
**Difficulty:** Medium
**Estimated Time:** 4 hours
**Skills You'll Practice:** client state, local persistence, product cards, route integration
**The Story:** As a shopper, I want to see recently viewed products so that I can return to items I considered.
**Acceptance Criteria:**
- [ ] Viewing a product adds it to a recent list.
- [ ] Recent list persists across refresh in the same browser.
- [ ] Current product is not duplicated.
- [ ] Recent products render using existing product card style where possible.
**Files You'll Likely Touch:** `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx` runs product-view side effects at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:49-52`; `src/components/products/ProductCard.tsx` renders cards at `src/components/products/ProductCard.tsx:22-111`; `src/lib/utils/completed-order-cache.ts` shows a small local storage utility pattern at `src/lib/utils/completed-order-cache.ts:15-26`.
**High-Level Implementation Plan:**
1. Create a small utility for recently viewed product summaries in `src/lib/utils`.
2. In `ProductDetails`, write the viewed product in a `useEffect`.
3. Create a client component to read and display recent items.
4. Render it below product details.
5. Keep stored data minimal: id, slug, name, image, display price.
**Tips:**
- Product details already has a client side-effect for analytics.
- Avoid storing full SDK product objects in localStorage.
- Use `basePath` for links.
**What Could Go Wrong:**
- Server rendering cannot read localStorage; recent list must be client-only.
- Storing full product data may become stale or too large.
**Stretch Goal:** Add "clear recently viewed."
**Connects To:** Story 8, because both introduce a new user-facing feature across pages.

## Story 8: Add Saved Addresses Nicknames
**Difficulty:** Hard
**Estimated Time:** 6 hours
**Skills You'll Practice:** forms, server actions, account UI, checkout integration
**The Story:** As a signed-in customer, I want to label saved addresses so that I can choose the right one faster at checkout.
**Acceptance Criteria:**
- [ ] Address management UI displays and edits an address nickname if the backend field exists.
- [ ] Checkout address selector shows nickname when available.
- [ ] Missing nickname falls back to existing address display.
- [ ] Address update uses existing authenticated address server action.
**Files You'll Likely Touch:** `src/components/addresses/AddressManagement.tsx` owns account address UI; `src/lib/data/addresses.ts` owns address CRUD and uses authenticated Spree calls; `src/components/checkout/AddressSelector.tsx` and `src/components/checkout/AddressSection.tsx` display saved addresses; `src/hooks/useCountryStates.ts:8-40` is used by address forms for state lists.
**High-Level Implementation Plan:**
1. Inspect the Spree `Address` type for custom or label fields.
2. Add nickname display to account address cards.
3. Add editable nickname field if the SDK accepts it.
4. Pass nickname through `updateAddress` in `src/lib/data/addresses.ts`.
5. Update checkout selector display.
6. Add tests or manual QA for signed-in checkout.
**Tips:**
- Address server actions use `withAuthRefresh`; keep that pattern.
- Preserve existing country/state behavior from `useCountryStates`.
- Do not break guest checkout, which does not use saved addresses.
**What Could Go Wrong:**
- Spree may not support nickname natively; then use `custom_fields` if available, or document the backend requirement.
- Checkout forms may strip unknown address fields.
**Stretch Goal:** Show nickname in order confirmation address blocks.
**Connects To:** Story 9, because both touch account, checkout, and backend persistence.

## Story 9: Add Order Reorder Button
**Difficulty:** Hard
**Estimated Time:** 7 hours
**Skills You'll Practice:** account flows, cart mutations, server action design, error handling
**The Story:** As a returning customer, I want to reorder items from a previous order so that I can buy them again quickly.
**Acceptance Criteria:**
- [ ] Order detail page shows a reorder action.
- [ ] Reorder attempts to add each previous order item variant to the current cart.
- [ ] User sees success and per-item failure feedback.
- [ ] Cart drawer or cart page reflects the newly added items.
**Files You'll Likely Touch:** `src/components/account/OrderDetail.tsx` displays order detail; `src/lib/data/orders.ts` reads orders through Spree; `src/lib/data/cart.ts` adds cart items at `src/lib/data/cart.ts:91-105`; `src/contexts/CartContext.tsx` exposes cart mutations at `src/contexts/CartContext.tsx:91-120`; `src/components/cart/CartDrawer.tsx` renders cart state at `src/components/cart/CartDrawer.tsx:76-79`.
**High-Level Implementation Plan:**
1. Inspect order item fields in `OrderDetail`.
2. Create a server action that loops previous line items and calls cart item create for purchasable variants.
3. Return a structured summary: added count, failed items.
4. Add a button in `OrderDetail`.
5. Refresh cart context after success.
6. Add tests around partial failure if practical.
**Tips:**
- Reuse `getOrCreateCart` behavior from `src/lib/data/cart.ts:62-80`.
- Do not assume every old variant is still purchasable.
- Return a user-readable result rather than throwing on the first failure.
**What Could Go Wrong:**
- Old variants may be deleted or out of stock.
- Adding many items sequentially can be slow.
- Auth/customer order access must remain server-side.
**Stretch Goal:** Add a confirmation modal listing items before reorder.
**Connects To:** Story 10, because reorder starts to feel like a SaaS-grade retention feature.

## Story 10: Add Server-Side Wishlist With Auth-Aware Caching
**Difficulty:** Expert
**Estimated Time:** 12+ hours
**Skills You'll Practice:** architecture design, auth, persistence, API contracts, caching, product UI
**The Story:** As a signed-in shopper, I want to save products to a wishlist so that I can return later and purchase them.
**Acceptance Criteria:**
- [ ] Signed-in users can add/remove products from a wishlist.
- [ ] Wishlist state is not visible to other users.
- [ ] Product cards and product detail show saved state.
- [ ] Wishlist page lists saved products using existing product card patterns.
- [ ] Guest users are prompted to sign in.
- [ ] Cache behavior cannot leak one user's wishlist to another.
**Files You'll Likely Touch:** `src/contexts/AuthContext.tsx` exposes signed-in user state at `src/contexts/AuthContext.tsx:27-44`; `src/lib/data/customer.ts` owns authenticated customer actions at `src/lib/data/customer.ts:51-70`; `src/lib/data/products.ts` demonstrates user-token cache segmentation at `src/lib/data/products.ts:17-31`; `src/components/products/ProductCard.tsx` and `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx` are wishlist UI surfaces; `src/app/[country]/[locale]/(storefront)/account/layout.tsx` and account routes are the natural home for a wishlist page.
**High-Level Implementation Plan:**
1. Confirm whether Spree backend exposes wishlist/favorites or whether a backend extension is required.
2. Design server actions under `src/lib/data/wishlist.ts`.
3. Use `withAuthRefresh` for authenticated access.
4. Add cache tags such as `wishlist` and segment any cached reads by access token.
5. Add wishlist controls to product card and product details.
6. Add an account wishlist route.
7. Add tests for authenticated/guest behavior and cache separation.
8. Document required Spree backend support if not present.
**Tips:**
- Follow auth refresh patterns from `src/lib/data/customer.ts:51-70`.
- Follow cache segmentation ideas from `src/lib/data/products.ts:17-31`.
- Keep wishlist state out of global cart context; it is a separate domain.
- Use localized `basePath` for the wishlist page.
**What Could Go Wrong:**
- If wishlist data is cached without user token segmentation, users may see each other's saved products.
- If backend support is absent, frontend-only wishlist will not work across devices.
- Product cards may become too interactive if wishlist controls interfere with the main link.
**Stretch Goal:** Add "move wishlist item to cart."
**Connects To:** Future subscription, recommendations, and customer retention features because it introduces a user-specific product relationship.
