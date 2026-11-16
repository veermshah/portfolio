# Measured results

Backend: **surrogate**, model: `surrogate`.

Token units: ceil(characters/4) proxy; NOT model tokens.

Dataset: original toy examples. This is not the paper's complete evaluation. Invalid plans count as model/orchestration failures and incorrect answers; provider errors are separate technical failures. All successful call tokens are charged.

| Benchmark | Arm | Correct | Invalid plans | Provider errors | Length-capped calls | Calls | Token units / correct | Dollars / correct |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| math | solo | 6/6 | 0 | 0 | 0 | 6 | 116.0 | unavailable |
| math | fixed | 6/6 | 0 | 0 | 0 | 18 | 343.3 | unavailable |
| math | generated | 6/6 | 0 | 0 | 0 | 18 | 575.3 | unavailable |
| multihop | solo | 6/6 | 0 | 0 | 0 | 6 | 156.0 | unavailable |
| multihop | fixed | 6/6 | 0 | 0 | 0 | 18 | 468.3 | unavailable |
| multihop | generated | 6/6 | 0 | 0 | 0 | 18 | 697.3 | unavailable |
