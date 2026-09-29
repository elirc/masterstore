# Tier 2: Mid-Level Missions

### Mission 9: State Has a Home and a Reason
**Tier:** Mid-Level
**Time Estimate:** 45 minutes
**Goal:** Decide where each kind of state belongs.
**The Concept:** Storefront state is like inventory paperwork: Spree owns the official order, cookies hold the claim ticket, React Context shows the clerk's current screen, and URLs label the aisle.
**Design Intent Before You Read the Code:** Read cart context, cart cookies, and listing params. Poor state placement causes stale carts, broken back buttons, or wrong market prices.
**Find It In The Code:** Open `src/contexts/CartContext.tsx:39-184`, `src/lib/spree/cookies.ts:43-60`, and `src/lib/utils/listing-search-params.ts:1-13`.

```ts
const [cart, setCart] = useState<Cart | null>(null); // Browser session view.
const [isOpen, setIsOpen] = useState(false); // Pure UI state.
const itemCount = useMemo(() => cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0, [cart]); // Derived state.
```

**The Aha Moment:** Bugs shrink when you can name the rightful owner of every value.
**Socratic Checkpoint:** 1. Who owns durable cart data? 2. Who owns drawer open state? 3. Who owns listing filters? 4. Why is item count derived? 5. Why do cookies matter?

How to self-grade: Strong answers cite `src/lib/data/cart.ts:21-157`, `src/contexts/CartContext.tsx:39-49`, `src/contexts/CartContext.tsx:137-144`, `src/lib/spree/cookies.ts:43-60`, and `src/lib/utils/listing-search-params.ts:1-13`.

Example ownership table:

| Value | Owner | Why |
|---|---|---|
| Cart line items | Spree plus `src/lib/data/cart.ts` | They must persist and remain consistent with checkout. |
| Cart drawer open state | `CartContext` | Multiple header/cart components need the same UI state. |
| Product filters | URL search params | Filters should survive refresh and be shareable. |
| Item count | Derived from cart | Storing it separately would create stale duplicate state. |

**Connects To:** Mission 10 and Mission 14.

### Mission 10: The Custom Hook Ecosystem
**Tier:** Mid-Level
**Time Estimate:** 40 minutes
**Goal:** Understand how hooks package reusable client behavior.
**The Concept:** A custom hook is a trained store associate: it knows a repeatable procedure, like switching countries without forgetting the cart.
**Design Intent Before You Read the Code:** Read country switch and country states hooks. Poor hooks hide side effects or ignore cleanup.
**Find It In The Code:** Open `src/hooks/useCountrySwitch.ts:21-68` and `src/hooks/useCountryStates.ts:8-40`.

```ts
if (cart && (cart.currency !== newCurrency || cart.locale !== newLocale)) {
  const result = await updateCartMarket(cart.id, { currency: newCurrency, locale: newLocale }); // Keep order market aligned.
  if (!result.success) return; // Do not navigate into inconsistent state.
  await refreshCart(); // UI mirrors updated cart.
}
setStoreCookies(nextCountry, newLocale); // Browser cookie follows route.
window.location.assign(newPath); // Full navigation reloads localized shell.
```

**The Aha Moment:** Hooks are valuable when they preserve a multi-step invariant.
**Socratic Checkpoint:** 1. What invariant does country switching protect? 2. What state does `useCountryStates` clean up? 3. Why is `cancelled` needed? 4. Why does country switch use full navigation? 5. Which hook is more domain-specific?

How to self-grade: Strong answers cite `src/hooks/useCountrySwitch.ts:45-61` and `src/hooks/useCountryStates.ts:16-37`.
**Connects To:** Mission 11 and Mission 18.

### Mission 11: Side Effects Are Promises to the System
**Tier:** Mid-Level
**Time Estimate:** 45 minutes
**Goal:** Read `useEffect` as synchronization, not magic.
**The Concept:** A side effect is a promise to the store: when a customer enters, refresh the cart; when they leave checkout complete, do not lose their receipt.
**Design Intent Before You Read the Code:** Read cart refresh, analytics, and checkout stale-cart effects. Poor side effects create races.
**Find It In The Code:** Open `src/contexts/CartContext.tsx:122-135`, `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:49-52`, and `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:266-304`.

```ts
useEffect(() => {
  if (pathname.includes("/order-placed/")) {
    setCart(null); // Do not call getCart and clear guest token too early.
    setLoading(false);
    return;
  }
  refreshCart(); // Normal navigation keeps cart fresh.
}, [refreshCart, pathname]);
```

**The Aha Moment:** Effects should have a named synchronization reason.
**Socratic Checkpoint:** 1. Why skip `/order-placed/`? 2. Why track product view in an effect? 3. Why compare line-item fingerprints? 4. What race is avoided? 5. What dependencies matter?

How to self-grade: Strong answers cite the three paths above and explain token preservation, analytics isolation, and stale router cache.
**Connects To:** Mission 14 and Mission 19.

### Mission 12: The Full API Contract
**Tier:** Mid-Level
**Time Estimate:** 50 minutes
**Goal:** Map frontend calls to server actions and Spree SDK calls.
**The Concept:** The API contract is the store's service counter: UI requests something, the counter speaks the warehouse language, and returns a receipt.
**Design Intent Before You Read the Code:** Read data actions by domain. Poor contracts leak SDK details into UI.
**Find It In The Code:** Open `src/lib/data/cart.ts:91-139`, `src/lib/data/checkout.ts:34-84`, `src/lib/data/payment.ts:10-68`, and `src/lib/data/customer.ts:76-132`.

```ts
return actionResult(async () => {
  const options = await getCartOptions(); // Server gathers tokens.
  const id = await requireCartId(); // Fail early if no cart exists.
  const cart = await getClient().carts.items.update(id, lineItemId, { quantity }, options); // SDK call.
  updateTag("cart"); // Cache invalidation is part of the contract.
  return { cart }; // UI gets normalized result.
}, "Failed to update cart item");
```

**The Aha Moment:** A server action is not just a fetch; it owns credentials, errors, cache tags, and returned shape.
**Socratic Checkpoint:** 1. What does `actionResult` standardize? 2. Where are tokens collected? 3. Which actions update checkout cache? 4. Which actions update cart cache? 5. Why should UI not call SDK directly?

How to self-grade: Strong answers cite `src/lib/data/utils.ts:5-18`, `src/lib/spree/cookies.ts:125-134`, `src/lib/data/checkout.ts:49-50`, `src/lib/data/cart.ts:103-104`, and `README.md:70-75`.
**Connects To:** Mission 14 and Mission 15.

### Mission 13: The Middleware Chain
**Tier:** Mid-Level
**Time Estimate:** 40 minutes
**Goal:** Trace request normalization before page code.
**The Concept:** Middleware is the greeter who puts the right country/locale sticker on each shopper before they enter the store.
**Design Intent Before You Read the Code:** Read proxy and middleware. Poor middleware would redirect assets, APIs, or already-localized URLs incorrectly.
**Find It In The Code:** Open `src/proxy.ts:1-10` and `src/lib/spree/middleware.ts:45-105`.

```ts
if (staticRoutes.some((route) => pathname.startsWith(route))) return NextResponse.next(); // Skip assets/API/dev.
if (/\.\w+$/.test(pathname)) return NextResponse.next(); // Skip files.
const match = pathname.match(HAS_COUNTRY_LOCALE);
if (match) { setLocaleCookies(response, match[1].toLowerCase(), match[2].toLowerCase()); return response; } // Sync cookies.
url.pathname = `/${country}/${locale}${pathname === "/" ? "" : pathname}`; // Redirect bare routes.
```

**The Aha Moment:** Middleware is part routing, part state synchronization.
**Socratic Checkpoint:** 1. What routes are skipped? 2. Why skip file extensions? 3. What regex detects localized paths? 4. Which headers can choose country? 5. What cookies are written?

How to self-grade: Strong answers cite `src/lib/spree/middleware.ts:50-68`, `src/lib/spree/middleware.ts:70-87`, and `src/lib/spree/middleware.ts:89-104`.
**Connects To:** Mission 18.

### Mission 14: End-to-End Feature Trace
**Tier:** Mid-Level
**Time Estimate:** 60 minutes
**Goal:** Trace add-to-cart from UI click to UI update.
**The Concept:** Add-to-cart is the checkout counter's smallest complete sale: select SKU, update order, print receipt, refresh cart display.
**Design Intent Before You Read the Code:** Start at product UI, follow context, action, cookies, SDK call, cache, and drawer. Poor tracing skips the state update and misses bugs.
**Find It In The Code:** Open `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:98-110`, `src/contexts/CartContext.tsx:62-100`, `src/lib/data/cart.ts:62-105`, and `src/components/cart/CartDrawer.tsx:76-79`.

```tsx
await addItem(variantId, quantity); // Product UI delegates cart mutation.
```

```ts
await mutateCart(() => addToCartAction(variantId, quantity), t("failedToAddItem"), () => setIsOpen(true)); // Context opens drawer on success.
```

```ts
const cart = await getOrCreateCart(); // Server ensures there is an order.
const updatedCart = await getClient().carts.items.create(cart.id, { variant_id: variantId, quantity }, { spreeToken, token }); // Spree mutates.
updateTag("cart"); // Cached cart consumers can refresh.
```

**The Aha Moment:** A full-stack trace is a chain of ownership transfers.
**Socratic Checkpoint:** 1. Who chooses variant ID? 2. Who opens the drawer? 3. Who creates a cart if missing? 4. Where is Spree called? 5. Where does UI render updated items?

How to self-grade: Strong answers cite each source range and can narrate the chain without hand-waving.
**Connects To:** Mission 15 and Mission 23.

### Mission 15: Read the Diff Like an Engineer
**Tier:** Mid-Level
**Time Estimate:** 45 minutes
**Goal:** Practice review order on a realistic change.
**The Concept:** A diff is a shipment manifest: check what changed, what it depends on, and whether it updates the right records.
**Design Intent Before You Read the Code:** Hypothetical diff: add "clear cart" to cart drawer. Read existing action, context API, UI, tests.
**Find It In The Code:** Open `src/lib/data/cart.ts:83-89`, `src/contexts/CartContext.tsx:23-35`, `src/components/cart/CartDrawer.tsx:235-293`, and `src/contexts/__tests__/CartContext.test.tsx:188-237`.

```ts
export async function clearCart() {
  return actionResult(async () => {
    await clearCartCookies(); // Existing server behavior clears claim ticket.
    updateTag("cart"); // Cache invalidation already exists.
    return {};
  }, "Failed to clear cart");
}
```

**The Aha Moment:** Review starts from existing contracts, not from the new button.
**Socratic Checkpoint:** 1. Is there already a server action? 2. Is it exposed through context? 3. Where should UI call it? 4. What test is missing? 5. What cache tag matters?

How to self-grade: Strong answers identify context interface/provider/test updates, not only JSX.
**Connects To:** Mission 19.

### Mission 16: Composition Over Inheritance
**Tier:** Mid-Level
**Time Estimate:** 35 minutes
**Goal:** See how the app composes behavior from small pieces.
**The Concept:** The storefront builds a checkout lane from sections: address, delivery, payment, policy, and sidebar, instead of one inherited mega-widget.
**Design Intent Before You Read the Code:** Read layout/provider composition and checkout section composition. Poor design would hide each section's contract.
**Find It In The Code:** Open `src/app/[country]/[locale]/layout.tsx:73-93`, `src/components/layout/Header.tsx:53-94`, and `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:702-781`.

```tsx
<AddressSection ... /> {/* Contact and delivery address. */}
<DeliveryMethodSection ... /> {/* Shipping choice. */}
<PaymentSection ref={paymentRef} ... /> {/* Payment details and imperative submit. */}
<PolicyConsent ... /> {/* Guest legal consent. */}
```

**The Aha Moment:** Composition makes each checkout section replaceable in principle, even when the orchestrator is large.
**Socratic Checkpoint:** 1. Which providers are composed globally? 2. Which header pieces are injected into `SearchToggle`? 3. Which checkout sections are siblings? 4. What section owns payment submit? 5. Where is summary content published?

How to self-grade: Strong answers cite `src/contexts/CheckoutContext.tsx:22-39` for summary context too.
**Connects To:** Mission 18 and Mission 21.

### Mission 17: TypeScript's Hidden Work
**Tier:** Mid-Level
**Time Estimate:** 45 minutes
**Goal:** Notice inference, narrowing, and literal types in real code.
**The Concept:** TypeScript quietly checks the packing list while you load the order.
**Design Intent Before You Read the Code:** Read listing param constants, action result, and payment result types. Poor TypeScript lets invalid states travel farther.
**Find It In The Code:** Open `src/lib/utils/listing-search-params.ts:18-38`, `src/lib/data/utils.ts:5-18`, and `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:19-23`.

```ts
export const LISTING_PARAM_KEYS = { query: "q", sort: "sort", option: "option" } as const; // Values remain literal strings.
type RawSearchParams = URLSearchParams | Record<string, string | string[] | undefined>; // Parser accepts server and browser shapes.
```

**The Aha Moment:** TypeScript makes boundaries explicit even when runtime data is messy.
**Socratic Checkpoint:** 1. What does `as const` preserve? 2. Why does `RawSearchParams` accept two shapes? 3. What does `actionResult` return on success? 4. What does it return on failure? 5. Why import `PaymentSectionHandle`?

How to self-grade: Strong answers cite exact types and explain how they guide callers.
**Connects To:** Mission 23.
