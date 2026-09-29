# Solutions and review rubric

Solution to level one: `0` and `0012` are accepted as safe digit strings; `12px`, `-2`, and `1.5` are rejected by the digit check; `9007199254740992` converts to an unsafe integer and is rejected. A blank value fails the digit check. The key distinction is that a prefix parser answers "what number starts this string?" while this contract asks "is the entire string a non-negative integer?"

Solution to level two: the query becomes `shoes`; both options remain in order; `price_min` disappears; `price_max` is `99`; sort becomes `price`. The parser returns an `ActiveFilters` object whose `optionValues` always exists. No catalog call is implied by this result. Solution to level three: the reviewer must inspect the provider adapter and add a provider-facing test if omission changes request semantics. The current check proves only the parser's output.

Review rubric: identity and contract, 2 points; branch coverage for valid, malformed, and overflow values, 2; preserving existing accepted shapes, 2; source-linked evidence, 2; limits about Next, Spree, and Vitest, 2. A strong review also asks whether digit strings with leading zeros are intentionally accepted and whether price bounds need an ordering rule. Neither question should be answered by guessing.

Before approving, compare [the snapshot](snapshots/src/lib/utils/listing-search-params.ts) with the staged file, verify the test imports the production module, and read the JSON result. Reject claims that the loader proves server authorization or that parser strictness makes webhook processing durable. The bounded change is valuable precisely because its contract and evidence stay small.

A score below the threshold should lead to one focused revision: add a case, rerun the same command, and update the evidence only if the terminal result changes. Do not inflate coverage by counting static reading as an executed test.

For the newline review extension, /\D/ finds the final line terminator and rejects the bound. A repeated bound ["12px", "8"] is absent because readFirst selects the malformed first entry; the parser does not search later entries for a valid number. A missing minimum and maximum "0" produce only priceMax: 0. These answers separate omission from falsy numeric values and are asserted in the refreshed suite.
