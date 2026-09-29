# User Story Build Path

This suite gives you ten real feature stories to build in this codebase. The stories are written like tech-lead tickets: enough direction to move, enough ambiguity to make you practice engineering judgment.

## How To Use These Stories

1. Read the story and acceptance criteria.
2. Open every file listed under "Files You'll Likely Touch."
3. Before coding, trace the existing pattern in those files.
4. Implement the smallest working version.
5. Run the relevant checks from `package.json:9-14`.
6. Review your own diff using the "What Could Go Wrong" section.

Before you write code, create a tiny implementation brief. Keep it short enough that you will actually use it:

```text
Story:
User-visible change:
Existing pattern I will copy:
Files I expect to edit:
Files I only need to read:
Translations needed:
Server/client boundary:
Test or manual QA:
Risk I will watch:
```

Example:

```text
Story: Add Empty Search Helper Text
User-visible change: empty search gets search-specific guidance
Existing pattern I will copy: products page chooses empty title/description from listing state
Files I expect to edit: products/page.tsx, messages/*.json
Files I only need to read: ProductListing.tsx and listing-search-params.ts
Translations needed: one products namespace key in every locale
Server/client boundary: no server mutation, route search params only
Test or manual QA: /us/en/products?q=no-such-product
Risk I will watch: generic category empty state accidentally changes
```

## Difficulty Progression

- Stories 1-3 are Easy. They modify existing UI or display logic and should touch one or two files.
- Stories 4-5 are Medium-Easy. They add UI features that read existing data and may require message updates.
- Stories 6-7 are Medium. They require a new state path or server action wrapper.
- Stories 8-9 are Hard. They touch frontend, server actions, and Spree-backed persistence paths.
- Story 10 is Expert. It introduces a SaaS-grade architectural concern and asks you to design carefully.

After Story 10, continue with `../feature-expansion-plan.md`. It expands the same wishlist/auth/cache ideas into a larger customer growth roadmap.

## Definition Of Done

A story is done when every acceptance criterion can be verified, the app still runs, changed UI works in localized routes, no server-first boundary is violated, and risky behavior has either a test or a clearly documented manual test.

Definition of done also includes a self-review pass:

- Does the change follow an existing local pattern?
- Did I update every locale file when adding text?
- Did I keep Spree access on the server?
- Did I avoid adding global state for local UI behavior?
- Did I test both the happy path and one failure or empty state?
- Can I explain the diff in two minutes using file references?

## Getting Unstuck Without Outsourcing The Solution

Use this prompt with Claude or ChatGPT:

```text
I'm working on Story X. I'm stuck on Y. Here is what I've tried: Z. Don't give me the solution -- ask me questions that help me figure it out.
```

Ask for questions first. Then go back to the source files and answer with line references.

Useful follow-up prompts:

```text
Here is my proposed implementation brief. Which assumption should I verify first?
```

```text
Here is my diff summary. Review it like a senior engineer and focus only on bugs, stale state, server/client boundary mistakes, missing translations, and missing tests.
```
