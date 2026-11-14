# Measured results

Backend: **surrogate**, model: `surrogate`.

Token units: ceil(characters/4) proxy; NOT model tokens.

Original toy tasks; these are NOT published AIME/HotpotQA scores. Errors denote execution/provider failures, not demonstrated reasoning failures.

| Benchmark | Arm | Correct | Errors | Calls | Token units / correct | Dollars / correct |
|---|---|---:|---:|---:|---:|---:|
| math | solo | 6/6 | 0 | 6 | 78.0 | unavailable |
| math | fixed | 6/6 | 0 | 18 | 257.2 | unavailable |
| math | generated | 6/6 | 0 | 18 | 440.0 | unavailable |
| multihop | solo | 6/6 | 0 | 6 | 118.0 | unavailable |
| multihop | fixed | 6/6 | 0 | 18 | 381.5 | unavailable |
| multihop | generated | 6/6 | 0 | 18 | 562.3 | unavailable |
