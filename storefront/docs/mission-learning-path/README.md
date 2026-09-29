# Mission Learning Path

This suite is a training campaign. You are not reading docs; you are practicing codebase navigation, tracing, annotation, debugging, review, and explanation.

Recommended pacing:

- Missions 1-8: one per day or two short sessions per day.
- Missions 9-17: one per day with notes.
- Missions 18-24: one every two days, because these require judgment.
- Mission 25: use as working references while building real changes.

Each mission should produce an artifact. For early missions, the artifact can be five lines of notes. For mid-level missions, it should be a trace or diagram. For senior missions, it should be a review comment, test plan, or risk memo. The point is to leave evidence that your understanding changed.

How to self-grade:

- Answer every checkpoint before looking at the rubric.
- A strong answer cites file paths and line ranges.
- A stronger answer explains what would break if the code changed.

Mission answer template:

```text
Mission:
Files inspected:
What starts the flow:
What owns the state:
What crosses the server/client boundary:
What would break if this changed:
One test or manual check:
Confidence level:
```

Example answer shape:

```text
Mission: State Has a Home and a Reason
Files inspected: CartContext.tsx, cart.ts, cookies.ts
What starts the flow: ProductDetails calls addItem from CartContext
What owns the state: Spree owns durable cart, cookies hold tokens, React Context mirrors current UI state
What crosses the server/client boundary: addToCartAction calls server-side cart data helpers
What would break if this changed: removing router.refresh could leave server-rendered cart-dependent UI stale
One test or manual check: add product, reload, confirm cart persists
Confidence level: medium, because checkout uses cart state in a more complex way
```

How this differs from normal documentation:

- Normal docs tell you what exists.
- These missions make you trace why it exists, where it starts, what it touches, and how to reason about changes under pressure.

Evidence rule used throughout: each mission points to exact repo files and line ranges, such as `src/contexts/CartContext.tsx:62-100`.

When you get stuck, do not reread everything. Narrow the question. Replace "I do not understand checkout" with "Which function changes shipping rate, and how does the UI know it changed?" That smaller question has a file, a call site, a return value, and a test shape.

After Mission 25, move to `../feature-expansion-plan.md` for a capstone roadmap. It combines the same tracing, review, and testing skills into one larger feature suite.
