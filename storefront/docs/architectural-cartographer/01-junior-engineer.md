# Junior Engineer Guide

## Local Setup

1. Install Node.js 20+ because the README lists it as a prerequisite at `README.md:84-87`.
2. Install dependencies with `npm install`, documented at `README.md:89-95`.
3. Copy `.env.local.example` to `.env.local`, documented at `README.md:97-101`.
4. Set `SPREE_API_URL` and `SPREE_PUBLISHABLE_KEY`, documented at `README.md:103-110` and listed in `.env.example:1-3`.
5. Run a Spree Commerce 5.4+ backend because the README requires it at `README.md:84-87`.
6. Start the storefront with `npm run dev`; the script runs `next dev -p 3001 --turbopack` at `package.json:5-7`, and the README points to `http://localhost:3001` at `README.md:132-138`.
7. Optional webhook/email setup uses `SPREE_WEBHOOK_SECRET`, `RESEND_API_KEY`, and `EMAIL_FROM` from `.env.example:29-44`.
8. Optional Stripe setup uses `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from `.env.example:46-47`.

No local seed script exists in `package.json:5-14`. Seed data belongs to the Spree backend, not this storefront.

## Folder Orientation

- `src/app`: Next App Router routes. Examples: root layout at `src/app/layout.tsx:37-62`, localized layout at `src/app/[country]/[locale]/layout.tsx:43-93`, product page route at `src/app/[country]/[locale]/(storefront)/products/[slug]/page.tsx:46-100`, and webhook API route at `src/app/api/webhooks/spree/route.ts:11-32`.
- `src/components`: UI and feature components. Product cards live at `src/components/products/ProductCard.tsx:22-111`; cart drawer at `src/components/cart/CartDrawer.tsx:31-305`; header at `src/components/layout/Header.tsx:46-95`.
- `src/contexts`: client-side state providers. Cart context at `src/contexts/CartContext.tsx:39-184`, auth context at `src/contexts/AuthContext.tsx:57-142`, store context at `src/contexts/StoreContext.tsx:66-113`.
- `src/hooks`: reusable client hooks. Country switching is at `src/hooks/useCountrySwitch.ts:21-68`; country states are fetched by `src/hooks/useCountryStates.ts:8-40`.
- `src/lib/data`: server actions that call Spree. Cart actions are at `src/lib/data/cart.ts:21-157`; product reads at `src/lib/data/products.ts:17-79`; checkout actions at `src/lib/data/checkout.ts:11-168`; payment actions at `src/lib/data/payment.ts:10-185`.
- `src/lib/spree`: integration helpers for SDK config, cookies, auth refresh, middleware, and webhooks. SDK creation is at `src/lib/spree/config.ts:23-36`; cookies at `src/lib/spree/cookies.ts:31-155`; auth refresh at `src/lib/spree/auth-helpers.ts:17-100`; middleware at `src/lib/spree/middleware.ts:45-105`.
- `src/types`: app-owned TypeScript contracts such as filter types at `src/types/filters.ts:1-20`.
- `messages`: locale files imported statically in `src/app/[country]/[locale]/layout.tsx:14-26`.

## One-Level-Deeper Frontend Folders

- `src/components/products`: catalog UI. `ProductListing` coordinates server-rendered product pages and filters at `src/components/products/ProductListing.tsx:75-200`; `InfiniteProductList` owns client infinite-scroll state at `src/components/products/InfiniteProductList.tsx:41-162`; `ProductCard` displays product image, price, sale badge, and link at `src/components/products/ProductCard.tsx:62-110`.
- `src/components/checkout`: checkout UI sections. The checkout page composes address, delivery, payment, policy, and summary sections at `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:17-52` and renders them at `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:702-781`.
- `src/components/layout`: app frame. Header lazy-loads mobile menu and country switcher at `src/components/layout/Header.tsx:12-36`; it renders account and cart controls at `src/components/layout/Header.tsx:73-91`.

## One-Level-Deeper Backend Folders

- `src/lib/data`: the app's backend facade. Actions return normalized results with `actionResult` at `src/lib/data/utils.ts:1-18`, mutate cart at `src/lib/data/cart.ts:91-139`, and complete orders at `src/lib/data/payment.ts:79-104`.
- `src/lib/spree`: the SDK boundary. `getClient` creates or returns the singleton Spree client at `src/lib/spree/config.ts:23-36`; `getCartOptions` combines cart and auth tokens at `src/lib/spree/cookies.ts:125-134`; `withAuthRefresh` retries authenticated requests at `src/lib/spree/auth-helpers.ts:49-77`.
- `src/lib/webhooks`: webhook business handlers. Order completed, canceled, shipped, and password reset handlers are registered by the route at `src/app/api/webhooks/spree/route.ts:21-29` and implemented in `src/lib/webhooks/handlers.ts:46-224`.

## Frontend Entry Point Walkthrough

Source: `src/app/layout.tsx:37-62`

```tsx
export default function RootLayout({
  children, // Every page route is passed here by Next App Router.
}: Readonly<{
  children: React.ReactNode; // TypeScript says "children can be any renderable React tree."
}>) {
  return (
    <html lang="en">
      <head>
        {spreeApiOrigin && ( // If SPREE_API_URL parsed, warm up browser connection to image/API origin.
          <>
            <link rel="preconnect" href={spreeApiOrigin} />
            <link rel="dns-prefetch" href={spreeApiOrigin} />
          </>
        )}
      </head>
      {gtmId && <GoogleTagManager gtmId={gtmId} />} // Analytics only renders when GTM_ID exists.
      <body className={`${geist.variable} antialiased min-h-screen flex flex-col`}>
        <Suspense fallback={null}>{children}</Suspense> // Route content streams inside the global shell.
        <Analytics /> // Vercel analytics.
        <SpeedInsights /> // Vercel speed insights.
      </body>
    </html>
  );
}
```

## Backend Entry Point Walkthrough

Source: `src/app/api/webhooks/spree/route.ts:11-32`

```ts
export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.SPREE_WEBHOOK_SECRET; // Secret comes from env, not client input.

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook endpoint not configured" }, // Fail closed when the webhook secret is missing.
      { status: 503 },
    );
  }

  const handler = createWebhookHandler({
    secret: webhookSecret, // Used by src/lib/spree/webhooks.ts to verify Spree signatures.
    handlers: {
      "order.completed": handleOrderCompleted, // Sends order confirmation email.
      "order.canceled": handleOrderCanceled, // Sends cancellation email.
      "order.shipped": handleOrderShipped, // Sends shipment email.
      "customer.password_reset_requested": handlePasswordReset, // Sends reset email.
    },
  });

  return handler(request); // Delegate parsing, verification, and dispatch to the shared helper.
}
```

## TypeScript Orientation

- Props interfaces describe component inputs, such as `ProductDetailsProps` at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:16-19`.
- Context interfaces describe shared state contracts, such as `CartContextType` at `src/contexts/CartContext.tsx:23-35`.
- Narrow union types prevent invalid strings. `AvailabilityStatus` allows only `"in_stock"` or `"out_of_stock"` at `src/types/filters.ts:1-1`, and `isAvailabilityStatus` narrows runtime strings at `src/types/filters.ts:8-12`.
- `as const` is used to preserve exact literal values in `LISTING_PARAM_KEYS` at `src/lib/utils/listing-search-params.ts:18-26`.
- Server actions return typed success/error envelopes through `actionResult` at `src/lib/data/utils.ts:5-18`.

## React Component Anatomy 1: Simple Product Card

Source: `src/components/products/ProductCard.tsx:22-111`

```tsx
export const ProductCard = memo(function ProductCard({
  product, // Product comes from @spree/sdk and carries name, slug, price, image data.
  basePath = "", // Localized prefix like /us/en.
  categoryId,
  index,
  listId,
  listName,
  fetchPriority,
  currency,
}: ProductCardProps) {
  const t = useTranslations("products"); // UI strings come from messages/*.json.
  const imageUrl = product.thumbnail_url || null; // Product image may be absent.
  const displayPrice = product.price?.display_amount; // Optional chaining protects incomplete data.

  const onSale = /* compare current/original/compare-at cents */; // Sale badge is derived, not stored in React state.

  const handleClick = () => {
    if (index != null && listId && listName && currency) {
      trackSelectItem(product, listId, listName, index, currency); // Analytics is optional and guarded.
    }
  };

  return (
    <Link href={`${basePath}/products/${product.slug}${categoryId ? `?category_id=${categoryId}` : ""}`} onClick={handleClick}>
      <ProductImage src={imageUrl} alt={product.name} fill /> {/* Shared image wrapper handles fallback UI. */}
      <h3>{product.name}</h3>
      {displayPrice && <span>{displayPrice}</span>}
      {!product.purchasable && <span>{t("outOfStock")}</span>}
    </Link>
  );
});
```

## React Component Anatomy 2: Complex Product Details

Source: `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:21-253`

```tsx
export function ProductDetails({ product, basePath }: ProductDetailsProps) {
  const { addItem } = useCart(); // Cart mutation comes from CartContext.
  const { currency } = useStore(); // Currency comes from market context.
  const t = useTranslations("products");

  const variants = useMemo(() => {
    return (product.variants || []).filter(Boolean); // Derived list avoids recomputing on unrelated renders.
  }, [product.variants]);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(() => {
    if (product.default_variant) return product.default_variant; // Prefer backend default.
    if (hasVariants) return variants.find((v) => v.purchasable) || variants[0]; // Then first purchasable.
    return product.default_variant || null;
  });

  useEffect(() => {
    trackViewItem(product, currency); // Analytics side effect happens only in browser.
  }, [product, currency]);

  const handleAddToCart = async () => {
    const variantId = selectedVariant?.id || product.default_variant?.id || product.default_variant_id;
    if (!variantId) throw new Error("No variant selected"); // Cannot add a product without a variant.
    setLoading(true);
    await addItem(variantId, quantity); // Calls server action through CartContext.
    setLoading(false);
    trackAddToCart(product, selectedVariant, quantity, currency);
  };
}
```

## React Component Anatomy 3: Client Infinite Product List

Source: `src/components/products/InfiniteProductList.tsx:41-162`

```tsx
export function InfiniteProductList({ initialProducts, initialPage, totalPages, listParams, fetchPage }: InfiniteProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts); // Starts with server-rendered page 1.
  const [currentPage, setCurrentPage] = useState(initialPage); // Client owns scroll progress.
  const [knownPages, setKnownPages] = useState(totalPages); // Server says how many pages exist.
  const [hasError, setHasError] = useState(false); // Error is separate from "no more pages."
  const sentinelRef = useRef<HTMLDivElement>(null); // IntersectionObserver watches this marker.

  const loadNextPage = useCallback(() => {
    const nextPage = currentPageRef.current + 1;
    startTransition(async () => {
      const response = await fetchPage({ ...listParams, page: nextPage }); // Server action fetches next page.
      setProducts((prev) => {
        const existing = new Set(prev.map((p) => p.id)); // Prevent duplicate cards.
        const appended = response.data.filter((p) => !existing.has(p.id));
        return [...prev, ...appended];
      });
    });
  }, [fetchPage, listParams]);
}
```

## Backend Anatomy 1: Cart Route-Like Server Action

Source: `src/lib/data/cart.ts:91-105`

```ts
export async function addToCart(variantId: string, quantity: number) {
  return actionResult(async () => { // Standard success/error envelope from src/lib/data/utils.ts.
    const cart = await getOrCreateCart(); // Guest may not have a cart yet.
    const spreeToken = await getCartToken(); // Cart token from HTTP-only cookie.
    const token = await getAccessToken(); // Customer JWT from HTTP-only cookie, if logged in.

    const updatedCart = await getClient().carts.items.create(
      cart.id,
      { variant_id: variantId, quantity }, // Spree API payload.
      { spreeToken, token }, // Auth/cart credentials passed server-side.
    );

    updateTag("cart"); // Invalidate Next cache entries tagged as cart.
    return { cart: updatedCart }; // CartContext receives this and updates UI.
  }, "Failed to add item to cart");
}
```

## Backend Anatomy 2: Product Read Action

Source: `src/lib/data/products.ts:17-32`

```ts
export async function cachedListProducts(params, options, _userToken) {
  "use cache: remote"; // Next caches this server function remotely.
  cacheLife("tenMinutes"); // Cache policy defined in next.config.ts.
  cacheTag("products"); // Can be invalidated when products change.
  return getClient().products.list(params, options); // Actual Spree SDK call.
}

export async function getProducts(params?: ProductListParams) {
  const options = await getLocaleOptions(); // country/locale from cookies.
  const userToken = await getAccessToken(); // separates authenticated-user cache entries.
  return cachedListProducts(params, options, userToken);
}
```

## Backend Anatomy 3: Webhook Controller Helper

Source: `src/lib/spree/webhooks.ts:55-109`

```ts
const body = await request.text(); // Signature verification needs the raw request body.
const signature = request.headers.get("x-spree-webhook-signature");
const timestamp = request.headers.get("x-spree-webhook-timestamp");

if (!signature || !timestamp) {
  return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
}

if (!verifyWebhookSignature(body, signature, timestamp, secret, toleranceSeconds)) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 }); // Reject forged requests.
}

const event: WebhookEvent = JSON.parse(body); // Now it is safe to parse.
const handler = handlers[eventName || event.name]; // Dispatch by event name.
await handler(event); // Business work happens in src/lib/webhooks/handlers.ts.
```

## Domain Glossary

- Product: sellable catalog item from Spree, displayed by `ProductCard` at `src/components/products/ProductCard.tsx:22-111` and product detail page at `src/app/[country]/[locale]/(storefront)/products/[slug]/page.tsx:46-100`.
- Variant: purchasable product option, selected in `ProductDetails` at `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:34-44`.
- Cart: in-progress order held by Spree and referenced by cart ID/token cookies at `src/lib/spree/cookies.ts:31-60`.
- Line item: cart row with product variant and quantity, counted by `CartContext` at `src/contexts/CartContext.tsx:137-144`.
- Market: Spree selling region that controls country, locale, and currency, validated in `src/app/[country]/[locale]/layout.tsx:49-68`.
- Country/locale prefix: URL structure like `/us/en`, enforced by middleware at `src/lib/spree/middleware.ts:70-105`.
- Category: Spree taxonomy branch for product browsing, loaded in storefront layout at `src/app/[country]/[locale]/(storefront)/layout.tsx:42-50`.
- Checkout: order completion flow where address, delivery, payment, and policy consent are handled in `src/app/[country]/[locale]/(checkout)/checkout/[id]/CheckoutPageContent.tsx:702-781`.
- Payment session: Spree payment abstraction for Stripe/PayPal/Adyen session payments, created at `src/lib/data/payment.ts:10-29`.
- Webhook: server-to-server event from Spree, received by `src/app/api/webhooks/spree/route.ts:11-32`.

## Junior Socratic Checkpoint

1. Why does `ProductDetails` need both `useCart` and `useStore`?
2. What happens if `SPREE_API_URL` or `SPREE_PUBLISHABLE_KEY` is missing?
3. Where is the cart token stored?
4. Why does product listing state belong in the URL?
5. Why is `addToCart` a server action instead of a client fetch?
6. What makes `ProductCard` a typed contract?
7. Which file would you open first for a webhook bug?

How to self-grade:

- Strong answers cite `src/app/[country]/[locale]/(storefront)/products/[slug]/ProductDetails.tsx:21-24`, `src/lib/spree/config.ts:23-36`, `src/lib/spree/cookies.ts:43-60`, `src/lib/utils/listing-search-params.ts:1-13`, `src/lib/data/cart.ts:91-105`, `src/components/products/ProductCard.tsx:10-20`, and `src/app/api/webhooks/spree/route.ts:11-32`.
- A strong answer explains cause and effect, not just file names.
- A weak answer says "React handles it" or "the backend does it" without naming the repo-specific path.

