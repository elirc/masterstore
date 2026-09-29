# Tier 1: Junior Missions

### Mission 1: The App's Heartbeat
**Tier:** Junior
**Time Estimate:** 25 minutes
**Goal:** Identify how a request becomes a rendered page.
**The Concept:** The app heartbeat is like a shopper entering the storefront: the front door is the root layout, the market desk is the localized layout, and the aisles are route files.
**Design Intent Before You Read the Code:** Read `package.json`, root layout, and localized layout. Scripts own execution, root layout owns global shell, localized layout owns market/i18n/providers. Poor design here would scatter global providers or make routes guess market data.
**Find It In The Code:** Open `package.json:5-14`, `src/app/layout.tsx:37-62`, and `src/app/[country]/[locale]/layout.tsx:43-93`.

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"> {/* Global document shell for every route. */}
      <body className={`${geist.variable} antialiased min-h-screen flex flex-col`}>
        <Suspense fallback={null}>{children}</Suspense> {/* Page content enters here. */}
        <Analytics /> {/* Site-wide analytics is mounted once. */}
      </body>
    </html>
  );
}
```

```tsx
<NextIntlClientProvider messages={messages} locale={locale as "en" | "de" | "pl"}>
  <StoreProvider initialCountry={country} initialLocale={locale} initialMarkets={markets}>
    <AuthProvider>
      <CartProvider>{children}</CartProvider> {/* Route children can use cart/auth/store hooks. */}
    </AuthProvider>
  </StoreProvider>
</NextIntlClientProvider>
```

**The Aha Moment:** Routes do not stand alone; they render inside a provider stack that has already resolved market and locale.
**Socratic Checkpoint:** 1. Which file starts every page? 2. Which file validates market country? 3. Which provider gives cart state? 4. Which script starts dev mode? 5. What would break if `CartProvider` were removed?

How to self-grade: Strong answers cite `src/app/layout.tsx:37-62`, `src/app/[country]/[locale]/layout.tsx:49-68`, `src/app/[country]/[locale]/layout.tsx:83-89`, and `package.json:5-7`.

Example mission note:

```text
The root layout owns document-wide concerns like font, analytics, and the outer body. The localized layout owns country, locale, messages, markets, and providers. A product page can use cart/auth/store hooks because it renders inside this provider stack, not because the product page creates those providers itself.
```

**Connects To:** Mission 2, because folders make sense after entry points; Mission 8, because navigation depends on localized route structure.

### Mission 2: The Folder Mental Map
**Tier:** Junior
**Time Estimate:** 30 minutes
**Goal:** Build a map of where code belongs.
**The Concept:** Think of the repo like a fulfillment center: `src/app` is the storefront floor, `src/components` are shelves and counters, `src/lib/data` is the service desk talking to Spree, and `src/lib/spree` is the shipping label machine.
**Design Intent Before You Read the Code:** Find the top folders and name their ownership. Bad folder discipline makes features hard to trace.
**Find It In The Code:** Open `src/app/layout.tsx:37-62`, `src/components/products/ProductCard.tsx:22-111`, `src/contexts/CartContext.tsx:39-184`, `src/hooks/useCountrySwitch.ts:21-68`, `src/lib/data/cart.ts:21-157`, `src/lib/spree/config.ts:23-36`, and `src/types/filters.ts:1-20`.

```ts
export function getClient(): Client {
  if (!_client) { // SDK client is lazy and shared.
    const baseUrl = process.env.SPREE_API_URL; // Env config belongs at the integration boundary.
    const publishableKey = process.env.SPREE_PUBLISHABLE_KEY;
    if (baseUrl && publishableKey) initSpreeNext({ baseUrl, publishableKey });
  }
  return _client!;
}
```

**The Aha Moment:** A feature usually crosses `app -> components/context -> lib/data -> lib/spree`.
**Socratic Checkpoint:** 1. Where do routes live? 2. Where do reusable UI pieces live? 3. Where do server actions live? 4. Where does SDK setup live? 5. Where should a new filter type live?

How to self-grade: Strong answers cite the folders above and distinguish app-owned types from SDK types.
**Connects To:** Mission 3, because folder ownership supports type ownership.

### Mission 3: TypeScript Is a Contract
**Tier:** Junior
**Time Estimate:** 30 minutes
**Goal:** Understand how TypeScript prevents invalid UI and URL state.
**The Concept:** TypeScript is the product label: it says what can be sold, shipped, or selected before the cashier scans it.
**Design Intent Before You Read the Code:** Read filter types and URL parsing. The type owns allowed values; the parser defends against invalid URLs.
**Find It In The Code:** Open `src/types/filters.ts:1-20` and `src/lib/utils/listing-search-params.ts:65-101`.

```ts
export type AvailabilityStatus = "in_stock" | "out_of_stock"; // Only these two states are valid.

export function isAvailabilityStatus(value: string): value is AvailabilityStatus {
  return AVAILABILITY_STATUSES.has(value); // Runtime guard upgrades an unknown string to the union.
}
```

```ts
const availabilityRaw = readFirst(params, LISTING_PARAM_KEYS.availability); // URL value is untrusted.
const availability =
  availabilityRaw && isAvailabilityStatus(availabilityRaw)
    ? availabilityRaw // Safe typed value.
    : undefined; // Bad URL input is dropped.
```

**The Aha Moment:** TypeScript works best when runtime parsing protects the boundary.
**Socratic Checkpoint:** 1. Why is URL input untrusted? 2. What values can `AvailabilityStatus` hold? 3. What happens to invalid availability? 4. Why parse prices? 5. Why centralize listing params?

How to self-grade: Strong answers cite `src/types/filters.ts:1-12` and `src/lib/utils/listing-search-params.ts:58-101`.
**Connects To:** Mission 6, because props are another contract; Mission 17, because TypeScript does hidden narrowing work.

### Mission 4: Your First React Component
**Tier:** Junior
**Time Estimate:** 35 minutes
**Goal:** Read a real component from props to rendered UI.
**The Concept:** A product card is a shelf tag: image, name, price, sale signal, and link all come from one product contract.
**Design Intent Before You Read the Code:** `ProductCard` owns display, not fetching. Poor design would make each card fetch its own product.
**Find It In The Code:** Open `src/components/products/ProductCard.tsx:10-111`.

```tsx
interface ProductCardProps {
  product: Product; // Required domain object from Spree SDK.
  basePath?: string; // Optional localized route prefix.
  currency?: string; // Optional analytics context.
}

export const ProductCard = memo(function ProductCard({ product, basePath = "", currency }: ProductCardProps) {
  const imageUrl = product.thumbnail_url || null; // UI tolerates missing image.
  const displayPrice = product.price?.display_amount; // UI tolerates missing price.
  return <Link href={`${basePath}/products/${product.slug}`}>{product.name}</Link>; // Navigation uses product slug.
});
```

**The Aha Moment:** Components should display data they are given; fetching belongs higher.
**Socratic Checkpoint:** 1. Which prop is required? 2. Why is `basePath` optional? 3. Where does analytics happen? 4. How is sale state derived? 5. What happens if no image exists?

How to self-grade: Strong answers cite `src/components/products/ProductCard.tsx:10-20`, `src/components/products/ProductCard.tsx:33-60`, and `src/components/products/ProductCard.tsx:62-110`.
**Connects To:** Mission 6, because props are contracts; Mission 7, because data arrives from server components.

### Mission 5: Your First Node.js Route
**Tier:** Junior
**Time Estimate:** 30 minutes
**Goal:** Understand a backend route handler.
**The Concept:** The webhook route is the receiving dock: it checks the delivery secret before handing packages to email handlers.
**Design Intent Before You Read the Code:** The route should validate config, build a handler, and delegate. Poor design would parse and process unverified webhooks inline.
**Find It In The Code:** Open `src/app/api/webhooks/spree/route.ts:11-32` and `src/lib/spree/webhooks.ts:55-109`.

```ts
export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.SPREE_WEBHOOK_SECRET; // Required shared secret.
  if (!webhookSecret) return NextResponse.json({ error: "Webhook endpoint not configured" }, { status: 503 });
  const handler = createWebhookHandler({ secret: webhookSecret, handlers: { "order.completed": handleOrderCompleted } });
  return handler(request); // Shared helper verifies and dispatches.
}
```

**The Aha Moment:** Backend route files should be thin when shared verification and dispatch logic exist.
**Socratic Checkpoint:** 1. What HTTP method is implemented? 2. What env var is required? 3. Where are event names mapped? 4. Where is signature checked? 5. What status is returned when missing config?

How to self-grade: Strong answers cite `src/app/api/webhooks/spree/route.ts:11-32` and `src/lib/spree/webhooks.ts:55-77`.
**Connects To:** Mission 13, because middleware/handler chains are a backend reading skill.

### Mission 6: Props Are a Typed Contract
**Tier:** Junior
**Time Estimate:** 25 minutes
**Goal:** Explain how parent and child components agree.
**The Concept:** Props are a packing slip: the parent promises to send exactly what the child needs to fulfill its job.
**Design Intent Before You Read the Code:** Read `ProductListingProps` and `InfiniteProductListProps`. A bad contract would mix fetching details, URL state, and UI state without clear ownership.
**Find It In The Code:** Open `src/components/products/ProductListing.tsx:26-50` and `src/components/products/InfiniteProductList.tsx:9-28`.

```ts
interface ProductListingProps {
  state: ListingSearchParams; // URL-derived listing state.
  fetchProducts: (params: ProductListParams) => Promise<PaginatedResponse<Product>>; // Server action contract.
  fetchFilters: (params: Record<string, unknown>) => Promise<ProductFiltersResponse>; // Facet fetch contract.
}
```

**The Aha Moment:** A good props interface tells you what the component owns and what it refuses to own.
**Socratic Checkpoint:** 1. Which prop carries URL state? 2. Which prop fetches products? 3. Which prop fetches filters? 4. Which component owns later pages? 5. Why is `basePath` passed down?

How to self-grade: Strong answers cite `src/components/products/ProductListing.tsx:26-50` and `src/components/products/InfiniteProductList.tsx:9-28`.
**Connects To:** Mission 9, because state needs a home.

### Mission 7: Following Data Into the App
**Tier:** Junior
**Time Estimate:** 40 minutes
**Goal:** Trace product data from server action to UI.
**The Concept:** Product data moves like inventory from the warehouse: Spree sends it, the listing shelf arranges it, and product cards display it.
**Design Intent Before You Read the Code:** Start in the route, follow into listing, then into the server action. Poor design would make the browser fetch Spree directly.
**Find It In The Code:** Open `src/app/[country]/[locale]/(storefront)/products/page.tsx:24-76`, `src/components/products/ProductListing.tsx:96-137`, and `src/lib/data/products.ts:28-32`.

```tsx
const listingState = parseListingSearchParams(rawSearchParams); // URL becomes typed state.
return <ProductListing state={listingState} fetchProducts={getProducts} fetchFilters={getProductFilters} />; // Route injects server actions.
```

```ts
const [productsResponse, filtersResponse] = await Promise.all([
  fetchProducts({ ...listParams, page: 1 }), // First page.
  fetchFilters(filterFetchParams).catch(() => null), // Filters are useful but non-fatal.
]);
```

**The Aha Moment:** Data fetching is high in the tree so UI leaves can stay focused.
**Socratic Checkpoint:** 1. Where is URL parsed? 2. Where is page 1 fetched? 3. Why are filters allowed to fail? 4. Where is cache applied? 5. Which component renders cards?

How to self-grade: Strong answers cite `src/app/[country]/[locale]/(storefront)/products/page.tsx:28-34`, `src/components/products/ProductListing.tsx:131-137`, and `src/components/products/InfiniteProductList.tsx:130-143`.
**Connects To:** Mission 12, because API contracts connect callers and server actions.

### Mission 8: Navigation Is the App's Skeleton
**Tier:** Junior
**Time Estimate:** 35 minutes
**Goal:** Understand localized navigation.
**The Concept:** The URL prefix is the storefront's address label: without country and locale, the app cannot know market, currency, or messages.
**Design Intent Before You Read the Code:** Read middleware and link creation. Poor design would hard-code `/products` and break localized markets.
**Find It In The Code:** Open `src/proxy.ts:1-10`, `src/lib/spree/middleware.ts:70-105`, `src/components/products/ProductCard.tsx:62-66`, and `src/hooks/useCountrySwitch.ts:40-62`.

```ts
const match = pathname.match(HAS_COUNTRY_LOCALE);
if (match) {
  setLocaleCookies(response, match[1].toLowerCase(), match[2].toLowerCase()); // URL syncs cookie state.
  return response;
}
url.pathname = `/${country}/${locale}${pathname === "/" ? "" : pathname}`; // Bare path gets localized.
```

**The Aha Moment:** Navigation is not only links; it is market state.
**Socratic Checkpoint:** 1. What paths does proxy skip? 2. How are locale cookies set? 3. How does `ProductCard` build links? 4. What does country switch do to cart market? 5. Why does basePath matter?

How to self-grade: Strong answers cite `src/lib/spree/middleware.ts:50-68`, `src/lib/spree/middleware.ts:70-105`, `src/components/products/ProductCard.tsx:62-66`, and `src/hooks/useCountrySwitch.ts:45-61`.
**Connects To:** Mission 10, because country switching is a custom hook ecosystem example.
