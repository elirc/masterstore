# Tier 3: Senior Missions

### Mission 18: Reverse-Engineer the Architecture Decisions
**Tier:** Senior
**Time Estimate:** 60 minutes
**Goal:** Infer why the system is shaped this way.
**The Concept:** Architecture is the store layout: every aisle placement optimizes one path and makes another path costlier.
**Design Intent Before You Read the Code:** Read README architecture, middleware, product cache, and cart context. Look for decisions, not just implementation.
**Find It In The Code:** Open `README.md:68-80`, `src/lib/spree/middleware.ts:45-105`, `src/lib/data/products.ts:17-31`, and `src/contexts/CartContext.tsx:122-135`.

```ts
export async function cachedListProducts(params, options, _userToken) {
  "use cache: remote"; // Decision: cache server-side product reads.
  cacheTag("products"); // Decision: invalidate by domain tag.
  return getClient().products.list(params, options); // Decision: keep Spree behind server boundary.
}
```

**The Aha Moment:** The main architecture optimizes secure Spree access, localized markets, cacheability, and interactive storefront UX.
**Socratic Checkpoint:** 1. Why server-first? 2. Why URL markets? 3. Why cache product reads? 4. Why keep cart in context? 5. Why special-case order placed?

How to self-grade: Strong answers cite `README.md:70-75`, `src/lib/spree/middleware.ts:70-105`, `src/lib/data/products.ts:17-31`, and `src/contexts/CartContext.tsx:122-135`.

Example senior answer:

```text
The app chooses server-first Spree access so the browser does not become the integration boundary. Markets live in URL structure because country and locale affect routing, messages, and product/cart behavior. Product reads are cached because catalog browsing is frequent and mostly stable, but the cache includes _userToken so personalized catalog data does not collapse across users. Cart context exists because cart interaction is immediate and shared across header, drawer, and product detail. The order-placed exception suggests a past guest checkout token bug, so I would review any cart refresh change against guest order completion.
```

**Connects To:** Mission 19 and Mission 24.

### Mission 19: Find the Bugs Before They Happen
**Tier:** Senior
**Time Estimate:** 55 minutes
**Goal:** Predict failure modes from code shape.
**The Concept:** Senior review is checking the order before the customer complains at the counter.
**Design Intent Before You Read the Code:** Read stale cart, webhook idempotency, HTML rendering, and local IP images. Poor review sees only syntax.
**Find It In The Code:** Open `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:266-304`, `src/lib/webhooks/handlers.ts:20-41`, `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:214-218`, and `next.config.ts:32-35`.

```ts
const PROCESSED_EVENTS = new Set<string>(); // Works in one process.
function markProcessed(eventId: string): void {
  if (PROCESSED_EVENTS.size >= MAX_PROCESSED_EVENTS) PROCESSED_EVENTS.delete(first); // Memory bounded.
  PROCESSED_EVENTS.add(eventId); // Not durable across cold starts or instances.
}
```

**The Aha Moment:** The riskiest bugs often live where runtime environment assumptions meet business rules.
**Socratic Checkpoint:** 1. What fails in multi-instance webhooks? 2. What trust boundary exists around HTML? 3. What router-cache issue does checkout handle? 4. Why can local IP images matter? 5. Which risk would you fix first?

How to self-grade: Strong answers include likelihood, impact, and one test or mitigation.
**Connects To:** Mission 20 and Mission 22.

### Mission 20: The Bug Injection Challenge
**Tier:** Senior
**Time Estimate:** 70 minutes
**Goal:** Practice symptom-to-source debugging.
**The Concept:** You are reading smoke from the stockroom and deciding which aisle is burning.
**Design Intent Before You Read the Code:** Use symptoms to choose files. Do not edit production code for the exercise.
**Find It In The Code:** Open `src/contexts/CartContext.tsx:122-135`, `src/hooks/useCountrySwitch.ts:45-61`, `src/components/products/ProductListing.tsx:155-174`, `src/lib/webhooks/handlers.ts:20-41`, and `src/lib/data/payment.ts:79-104`.

```ts
if (pathname.includes("/order-placed/")) {
  setCart(null); // Removing this can clear guest order credentials too early.
  setLoading(false);
  return;
}
```

**The Aha Moment:** A useful bug report maps a user symptom to a state boundary.
**Socratic Checkpoint:** 1. Which file for missing guest receipt? 2. Which file for wrong currency after country switch? 3. Which file for stale infinite-scroll products? 4. Which file for duplicate emails? 5. Which file for order completion race?

How to self-grade: Strong answers point to the source ranges above and describe a reproduction test.
**Connects To:** Mission 23.

### Mission 21: Performance X-Ray
**Tier:** Senior
**Time Estimate:** 60 minutes
**Goal:** Identify performance choices worth preserving.
**The Concept:** Performance is checkout lane design: keep the heavy boxes off the counter until needed.
**Design Intent Before You Read the Code:** Read product cache, narrowed fields, dynamic imports, and infinite scroll. Poor performance work optimizes without knowing payload and hydration boundaries.
**Find It In The Code:** Open `src/lib/data/products.ts:17-31`, `src/components/products/ProductListing.tsx:100-137`, `src/components/layout/Header.tsx:12-36`, and `src/components/products/InfiniteProductList.tsx:81-126`.

```ts
const listParams: ProductListParams = {
  limit: PAGE_SIZE,
  ...queryParams,
  ...baseParams,
  fields: PRODUCT_CARD_FIELDS, // Reduces cached payload and RSC-to-client data.
};
```

**The Aha Moment:** This app's performance depends on server caching, small payloads, and small client islands.
**Socratic Checkpoint:** 1. Where is cache life defined? 2. Where are fields narrowed? 3. Which components are dynamically imported? 4. How does infinite scroll avoid duplicate products? 5. What would you measure?

How to self-grade: Strong answers cite `next.config.ts:24-31`, `src/components/products/ProductListing.tsx:100-137`, `src/components/layout/Header.tsx:12-36`, and `src/components/products/InfiniteProductList.tsx:89-97`.
**Connects To:** Mission 23.

### Mission 22: The Security Audit
**Tier:** Senior
**Time Estimate:** 60 minutes
**Goal:** Review trust boundaries and credentials.
**The Concept:** Security is checking who can enter the stockroom, who can print labels, and who can change receipts.
**Design Intent Before You Read the Code:** Read cookies, auth refresh, webhook verification, and HTML rendering.
**Find It In The Code:** Open `src/lib/spree/cookies.ts:43-60`, `src/lib/spree/cookies.ts:76-84`, `src/lib/spree/auth-helpers.ts:49-77`, `src/lib/spree/webhooks.ts:55-77`, and `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:214-218`.

```ts
cookieStore.set(getAccessTokenCookieName(), token, {
  httpOnly: true, // Browser JS cannot read token.
  secure: process.env.NODE_ENV === "production", // HTTPS-only in production.
  sameSite: "lax", // Basic CSRF mitigation for cross-site requests.
  path: "/",
});
```

**The Aha Moment:** The strongest security posture is at boundaries: cookies, webhooks, env vars, and trusted HTML.
**Socratic Checkpoint:** 1. Are auth tokens readable by browser JS? 2. How are webhooks verified? 3. What happens on 401? 4. Which HTML is trusted? 5. What production config needs review?

How to self-grade: Strong answers cite each range and propose one hardening step for HTML or image config.
**Connects To:** Mission 23.

### Mission 23: Write the Test That Doesn't Exist
**Tier:** Senior
**Time Estimate:** 75 minutes
**Goal:** Design a focused test for risky behavior.
**The Concept:** A test is a receipt you can reprint after every refactor.
**Design Intent Before You Read the Code:** Choose one risk with a small surface. Product listing parser is ideal because it is pure and important.
**Find It In The Code:** Open `vitest.config.ts:5-17`, `src/lib/utils/listing-search-params.ts:65-142`, and `src/contexts/__tests__/CartContext.test.tsx:56-237`.

```ts
it("ignores invalid availability and negative price", () => {
  const result = parseListingSearchParams({ availability: "bad", price_min: "-1", option: "red" });
  expect(result.filters).toEqual({ optionValues: ["red"] }); // Invalid URL data cannot leak into filters.
});
```

**The Aha Moment:** The best first test is often a pure boundary parser that protects many downstream flows.
**Socratic Checkpoint:** 1. What test environment is configured? 2. Which parser branch is risky? 3. Why pure tests are cheap? 4. What fixture style exists? 5. What would this test prevent?

How to self-grade: Strong answers cite `vitest.config.ts:12-17`, `src/lib/utils/listing-search-params.ts:72-101`, and a specific expected output.
**Connects To:** Mission 24.

### Mission 24: The Git History Tells a Story
**Tier:** Senior
**Time Estimate:** 45 minutes
**Goal:** Infer codebase evolution from likely commit themes.
**The Concept:** Git history is the store renovation record: it tells you why the checkout moved and which walls are load-bearing.
**Design Intent Before You Read the Code:** Use current code shape to invent plausible history and review implications.
**Find It In The Code:** Open `src/lib/utils/listing-search-params.ts:1-13`, `src/contexts/CartContext.tsx:122-135`, `src/lib/data/products.ts:17-31`, `src/app/api/webhooks/spree/route.ts:21-29`, and `src/components/cart/CartDrawer.tsx:263-274`.

```text
Commit: "Fix guest order placed token race"
Evidence: CartContext skips refresh on /order-placed/ to avoid clearing guest cart token.
Review implication: any cart refresh change must retest guest checkout completion.
```

**The Aha Moment:** History-aware engineers protect decisions that were probably paid for with bugs.
**Socratic Checkpoint:** 1. What commit created URL-backed filters? 2. What bug likely caused order-placed skip? 3. Why cache by user token? 4. Why add webhook idempotency? 5. Why keep express checkout mounted during processing?

How to self-grade: Strong answers cite the ranges above and connect each to a user-visible bug or performance goal.
**Connects To:** Mission 25.
