# Trace lab: follow a malformed listing query

Use this input: `q=%20shoes%20&price_min=12px&price_max=99&option=red&option=large&sort=%20price%20`. Predict the returned object before opening the solution. The first step is `readFirst` for `q`, followed by trim, so the query is `shoes`. `price_min` reaches `parsePositiveInt` and fails because the complete string is not digits. `price_max` passes and becomes the safe number `99`. `readAll` returns two option values in arrival order. Sort is trimmed to `price`.

Trace table:

| Step | Input | Decision | Output |
| --- | --- | --- | --- |
| query | ` shoes ` | trim and keep | `shoes` |
| minimum | `12px` | reject suffix | omitted |
| maximum | `99` | digits and safe | `99` |
| options | `red`, `large` | collect all | same order |
| sort | ` price ` | trim and keep | `price` |

Now alter one field at a time. Change minimum to `12`; it should appear. Change maximum to `1.5`; it should disappear. Change minimum to `9007199254740992`; it should disappear even though it contains digits. Change query to spaces only; it becomes undefined. These predictions are useful because they identify whether a bug belongs to parsing or to downstream filtering.

For a senior trace, continue into `src/lib/data/products.ts` and mark the point where the parsed object becomes a provider request. Write a second table with any serialization or cache key transformation you find. If that file cannot be executed without dependencies, label the trace static. The focused evidence supports the first table only; it does not validate provider results.
