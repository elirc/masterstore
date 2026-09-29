# Graduated practice

Level one: predict six values before running code: `0`, `0012`, `12px`, `-2`, `1.5`, and `9007199254740992`. Write whether each becomes a filter property. Explain why digit acceptance and safe integer range are separate checks. Then compare your prediction with the five executable tests and add one assertion for a blank value.

Level two: trace a complete query containing `q= shoes `, two `option` values, `price_min=12px`, `price_max=99`, and `sort= price `. Record every transformation: query trimming, repeated option collection, strict numeric parsing, and sort trimming. Your expected output should include the cleaned query and sort, both options, only the valid maximum, and `optionValues` in input order. This exercise tests data shape as well as a branch.

Level three: inspect `src/lib/data/products.ts` and decide whether an omitted price bound is safe for its provider call. State what happens if the product service expects a string, whether server validation exists, and what test would prove it. Do not invent a database or pretend the provider was run. A strong answer separates parser correctness from catalog behavior.

Level four: propose an error-reporting policy for malformed filters. The current parser drops them, matching its existing availability convention. If you would return a 400 response, identify the route and update the contract, user message, and tests. Do not silently change the staged implementation. Self-grade one point each for exact prediction, trace completeness, source link, provider boundary, and a truthful limit statement.

A senior learner should also review whether logging raw query values could expose customer search terms. The parser fix does not add logging, and any future diagnostics should use controlled test fixtures rather than production URLs.
