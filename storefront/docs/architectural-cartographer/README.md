# Architectural Cartographer

This suite is a top-down guide to this storefront as a system. It is written for a product owner becoming an engineer: first understand the shape, then trace real flows, then critique the design with increasing confidence.

Use it in this order:

1. `00-reading-map.md` for the mental model and the files to read first.
2. `01-junior-engineer.md` for setup, folder orientation, entry points, TypeScript, React, and backend route anatomy.
3. `02-mid-level-engineer.md` for system diagrams, API contracts, state ownership, and an end-to-end add-to-cart trace.
4. `03-senior-engineer.md` for critique, risk, testing, performance, security, and ownership decisions.
5. `04-reference-suite.md` as a permanent desk reference while building or reviewing changes.

After you finish this suite, use `../feature-expansion-plan.md` as a capstone. It turns the same architectural ideas into a larger retention-focused product roadmap with wishlist, compare, reviews, reorder, loyalty, notifications, and dashboard work.

How to use checkpoints:

- Answer before reading the self-grade.
- Then compare your answer to the "How to self-grade" notes.
- A strong answer does not need the same wording. It needs the same causal chain and source anchors.

Evidence rule used throughout this suite: codebase claims cite file paths and line ranges, for example `src/lib/data/cart.ts:91-105`.
