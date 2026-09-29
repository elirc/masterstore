# Feature Expansion Plan: Customer Growth Suite

This plan proposes a large feature set for extending the storefront while deliberately improving engineering skill. It is meant to be built after the mission docs and user-story docs have been used for a few smaller changes.

The theme is customer retention: help shoppers save products, compare choices, trust products through reviews, reorder faster, earn loyalty credit, and receive useful account notifications.

## Why This Feature Set

This suite is large enough to teach real product engineering:

- Product UI changes across listing cards, product detail, account pages, and checkout-adjacent flows.
- Authenticated server actions with privacy and cache boundaries.
- Data modeling choices when Spree does not expose a feature directly.
- Localized UI, empty states, error states, and optimistic interaction.
- Tests for pure utilities, server actions, context behavior, and user-facing components.
- Senior review habits around cache leakage, token safety, stale state, and partial failure.

It should not be built as one giant pull request. Build it as a sequence of small, reviewable slices.

## Feature Modules

### Module 1: Server-Backed Wishlist

Goal: signed-in customers can save products and return to them later.

Requirements:

- Signed-in users can add or remove a product from their wishlist.
- Guests see a sign-in prompt instead of a saved state.
- Product cards show saved state without breaking the main product link.
- Product detail shows saved state near purchase actions.
- Account area includes a wishlist page.
- Wishlist data must not leak across users.
- Empty wishlist state links back to product browsing.

Likely files:

- `src/components/products/ProductCard.tsx`
- `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx`
- `src/app/[country]/[locale]/(storefront)/account/layout.tsx`
- `src/lib/data/customer.ts`
- New `src/lib/data/wishlist.ts`
- New account wishlist route under `src/app/[country]/[locale]/(storefront)/account`
- `messages/*.json`

Backend decision:

- Best: use a Spree wishlist/favorites extension if available.
- Acceptable learning path: create a custom persistence layer behind server actions.
- Avoid as final architecture: localStorage-only wishlist, because it will not follow the user across devices.

Skills practiced:

- Auth-aware server actions.
- Cache segmentation by user token.
- Guest vs signed-in UX.
- Product-card interaction design.
- Privacy review.

Acceptance criteria:

- User A cannot see User B's wishlist.
- Saved state survives refresh and sign-out/sign-in.
- Product listing and detail agree on saved state.
- Locale parity check passes after adding messages.
- At least one test proves guest users cannot mutate wishlist state.

### Module 2: Product Compare

Goal: shoppers can compare two to four products before buying.

Requirements:

- Product cards include a compare toggle.
- Compare tray shows selected products across listing navigation.
- Compare page/table shows image, name, price, availability, options, SKU when available, and add-to-cart action.
- Current country/locale is preserved in compare links.
- Compare list persists in the same browser for guests.
- Signed-in users may optionally sync compare list later, but this is not required for the first version.

Likely files:

- `src/components/products/ProductCard.tsx`
- `src/components/products/ProductListing.tsx`
- New `src/components/products/CompareTray.tsx`
- New route under `src/app/[country]/[locale]/(storefront)/compare`
- New utility under `src/lib/utils/compare-products.ts`

Skills practiced:

- Client state with localStorage.
- Fixed-size UI constraints.
- Cross-page state without overusing global context.
- Product summary data modeling.
- Responsive table design.

Acceptance criteria:

- User can add and remove compare products from listing cards.
- Compare tray never blocks add-to-cart or product navigation.
- Compare page handles unavailable or missing fields gracefully.
- Guest compare list persists after refresh.
- Long product names and option values do not break layout.

### Module 3: Reviews And Questions

Goal: shoppers can read product reviews, submit reviews after purchase, and ask product questions.

Requirements:

- Product detail shows average rating, review count, and review list.
- Signed-in customers can submit a review only for products they purchased.
- Reviews support rating, title, body, and optional recommended flag.
- Questions can be submitted by signed-in users.
- Admin/moderation state exists in the data model even if the first UI only shows approved content.
- Product listing may show rating summary when available.

Likely files:

- `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx`
- `src/components/account/OrderDetail.tsx`
- `src/lib/data/orders.ts`
- New `src/lib/data/reviews.ts`
- New review components under `src/components/products`
- `messages/*.json`

Backend decision:

- If Spree has reviews available, integrate through server actions.
- If not, create a separate review persistence boundary and document moderation needs.

Skills practiced:

- Authorization based on purchase history.
- Form validation and error display.
- Read/write data separation.
- Moderation state modeling.
- Testing permission rules.

Acceptance criteria:

- Guests can read approved reviews but cannot submit.
- Signed-in users cannot review unpurchased products.
- A product with no reviews has a useful empty state.
- Review submission shows pending/moderation state if approval is required.
- Review display is localized where static text is used.

### Module 4: Reorder And Buy Again

Goal: returning customers can rebuild a cart from past orders.

Requirements:

- Order detail page includes a reorder action.
- Account dashboard includes a "buy again" area with recent purchasable items.
- Reorder adds available variants to the current cart.
- If some items cannot be added, the user gets a partial failure summary.
- Cart drawer or cart page reflects newly added items.

Likely files:

- `src/components/account/OrderDetail.tsx`
- `src/components/account/OrderList.tsx`
- `src/lib/data/orders.ts`
- `src/lib/data/cart.ts`
- `src/contexts/CartContext.tsx`
- `src/components/cart/CartDrawer.tsx`

Skills practiced:

- Partial failure handling.
- Cart mutation orchestration.
- Account page UX.
- Server action return contracts.
- Tests around edge cases.

Acceptance criteria:

- Deleted or unavailable variants do not crash reorder.
- User sees which items were added and which failed.
- Reorder uses existing cart mutation/cache patterns.
- Reorder does not expose another user's order data.
- Tests cover at least one partial failure case.

### Module 5: Loyalty Wallet

Goal: customers can earn points or credit-like rewards for purchases and account actions.

Requirements:

- Account page shows points balance and recent loyalty events.
- Completed orders create earn events.
- Refunds/cancellations can create reversal events.
- Checkout can show estimated points earned.
- Optional later phase: allow points redemption as store credit or coupon-like discount.

Likely files:

- `src/app/[country]/[locale]/(storefront)/account/page.tsx`
- `src/components/account`
- `src/lib/webhooks/handlers.ts`
- `src/lib/emails`
- New `src/lib/data/loyalty.ts`
- `messages/*.json`

Backend decision:

- Do not fake money movement in UI only.
- If redemption affects order totals, it must be represented in Spree or a trusted backend service.
- Earning display can be introduced before redemption, as long as it is labeled clearly.

Skills practiced:

- Event ledger thinking.
- Webhook-driven side effects.
- Idempotency.
- Account dashboard design.
- Financial-risk review.

Acceptance criteria:

- Loyalty events are append-only.
- Duplicate order.completed webhook events do not double-award points.
- Canceled/refunded orders are handled explicitly.
- Points display never claims spendable credit unless redemption is implemented.
- Senior review includes a financial correctness checklist.

### Module 6: Notification Center And Email Preferences

Goal: customers can control useful account notifications.

Requirements:

- Account page includes notification preferences.
- Customers can opt in/out of back-in-stock, sale, wishlist price-drop, and order status notifications.
- Product detail can expose "notify me" for out-of-stock variants.
- Existing transactional emails remain separate from marketing preferences.
- Email templates can be previewed in the dev email preview area.

Likely files:

- `src/app/dev/emails`
- `src/lib/emails`
- `src/lib/webhooks/handlers.ts`
- `src/components/account`
- New `src/lib/data/notifications.ts`
- `messages/*.json`

Skills practiced:

- Preference modeling.
- Transactional vs marketing boundaries.
- Email template development.
- Webhook and scheduled-job thinking.
- Privacy and consent review.

Acceptance criteria:

- Users can update preferences and see saved state after refresh.
- Transactional order emails are not disabled by marketing opt-out.
- Back-in-stock notification cannot be created without a product/variant reference.
- Dev email previews exist for new templates.
- Tests or manual QA cover opt-out behavior.

### Module 7: Personalized Account Dashboard

Goal: account home becomes a useful command center.

Requirements:

- Dashboard shows recent orders, saved products, loyalty balance, recommended next actions, and recently viewed products.
- Empty states are useful for new customers.
- Dashboard data is fetched server-side where possible.
- Client-only data, like local recently viewed products, is isolated in small client components.
- Dashboard must not become a dumping ground for unrelated state.

Likely files:

- `src/app/[country]/[locale]/(storefront)/account/page.tsx`
- `src/components/account`
- `src/contexts/AuthContext.tsx`
- New dashboard components under `src/components/account/dashboard`

Skills practiced:

- Server component composition.
- Small client islands.
- Data loading strategy.
- Product thinking around empty states.
- Component boundaries.

Acceptance criteria:

- Signed-out users are redirected or prompted according to existing account behavior.
- New customers see empty states, not broken blank panels.
- Existing order/address/account behavior still works.
- Dashboard cards link to localized account routes.
- Page remains readable on mobile.

## Build Phases

### Phase 0: Design And Evidence

Deliverables:

- Data model notes for wishlist, reviews, loyalty, and notifications.
- Backend capability check: what Spree already supports vs what needs extension.
- Cache/privacy memo for user-specific data.
- UI route map.
- Test strategy.

Learning goal: think before coding, but with concrete files and risks.

### Phase 1: Wishlist Foundation

Deliverables:

- `src/lib/data/wishlist.ts`.
- Product detail save/remove.
- Account wishlist route.
- Guest sign-in prompt.
- Locale updates.
- Tests for guest and authenticated behavior.

Learning goal: authenticated server actions and privacy boundaries.

### Phase 2: Compare And Recently Viewed

Deliverables:

- Compare tray.
- Compare page.
- Local persistence utility.
- Recently viewed account/dashboard widget.

Learning goal: client persistence and UI state boundaries.

### Phase 3: Reorder

Deliverables:

- Reorder server action.
- Order detail reorder button.
- Partial success feedback.
- Cart context integration.
- Tests for unavailable variant behavior.

Learning goal: mutation orchestration and partial failure design.

### Phase 4: Reviews And Questions

Deliverables:

- Review read components.
- Review submission form.
- Purchase verification.
- Moderation state.
- Product rating summary.

Learning goal: permission rules and user-generated content.

### Phase 5: Loyalty And Notifications

Deliverables:

- Loyalty event ledger.
- Account loyalty display.
- Webhook integration for earning/reversal.
- Notification preferences.
- Email templates and previews.

Learning goal: event-driven features, idempotency, and customer communication.

### Phase 6: Dashboard Integration

Deliverables:

- Account dashboard redesign.
- Saved products card.
- Buy again card.
- Loyalty card.
- Recently viewed card.
- Preference shortcuts.

Learning goal: composing several domains into one coherent user experience.

## Cross-Cutting Requirements

### Localization

- Any user-facing text goes in `messages/*.json`.
- Run `npm run check:locales` after adding keys.
- Test at least one non-English route manually when adding visible text.

### Server-First Rule

- Browser code must not import `@spree/sdk` directly.
- New Spree access belongs in `src/lib/data` or `src/lib/spree`.
- Client components call server actions or receive server-fetched props.

### Cache And Privacy

- User-specific data must not use shared cache without user segmentation.
- Wishlist, loyalty, notifications, and reviews authored by a user need explicit auth rules.
- Cache invalidation must be documented next to the mutation.

### Error Handling

- Partial failures should return structured results.
- User-facing errors should be specific enough to act on.
- Server logs should keep sensitive tokens and payment details out of output.

### Testing

Recommended minimum tests:

- Pure utilities: compare storage, listing parser additions, review validators.
- Server actions: wishlist mutation, reorder partial failure, loyalty idempotency.
- Components: product save button, compare tray, review form empty/error states.
- Integration/manual QA: localized account dashboard, guest vs signed-in behavior, cart after reorder.

## Suggested Pull Request Sequence

1. Add wishlist data contract and fake/adapter boundary with tests.
2. Add product detail wishlist button.
3. Add product card wishlist button.
4. Add account wishlist page.
5. Add compare persistence utility.
6. Add compare tray.
7. Add compare page.
8. Add reorder server action.
9. Add reorder UI and partial failure feedback.
10. Add review data contract and read UI.
11. Add review submission with purchase verification.
12. Add loyalty event model.
13. Add order.completed loyalty earn handling.
14. Add account loyalty panel.
15. Add notification preferences.
16. Add back-in-stock notification request.
17. Add email templates and dev previews.
18. Add account dashboard composition.

Each PR should include:

- One-sentence user value.
- Files changed.
- Server/client boundary note.
- Cache/privacy note.
- Test evidence.
- Manual QA steps.

## Capstone Evaluation

You are ready to call the suite successful when you can do all of this:

- Explain why each new domain has its own data boundary.
- Review a wishlist or loyalty PR for privacy bugs.
- Trace a reorder action from button click to Spree cart mutation.
- Add localized text without breaking locale parity.
- Write at least one test before implementing a risky server action.
- Explain which features are frontend-only, backend-backed, webhook-driven, or payment/financially sensitive.
- Decide what should be built in Spree, what can live in this Next app, and what should remain out of scope.

## Stretch Capstone

After the core suite works, add a "Customer Insights" page for local development only:

- Count wishlist saves by product.
- Count review submissions awaiting moderation.
- Show loyalty events by type.
- Show failed notification attempts.
- Link each insight back to the relevant product/account/order where possible.

This teaches observability and operational thinking without exposing admin tooling in the public storefront.
