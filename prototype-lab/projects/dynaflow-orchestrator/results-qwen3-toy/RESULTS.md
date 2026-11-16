# Real-model measured results

Backend: openai; model: Qwen3-0.6B-Q4_K_M; tokens: provider reported.

Dataset: original toy examples; tiny convenience sample, not full-paper evaluation. Zero local API fees exclude hardware/energy. Invalid generated plans count as model/orchestration failures and incorrect answers; provider errors are separate technical failures. All successful call tokens, including unsolved tasks and invalid-plan outputs, are charged.

| Benchmark | Arm | Correct | Invalid plans | Provider errors | Length-capped calls | Calls | Tokens | Tokens / solved | API fees / solved |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| math | solo | 1/6 | 0 | 0 | 1 | 6 | 1039 | 1039.0 | $0.000000 |
| math | fixed | 1/6 | 0 | 0 | 6 | 18 | 4875 | 4875.0 | $0.000000 |
| math | generated | 1/6 | 2 | 0 | 0 | 14 | 3257 | 3257.0 | $0.000000 |
| multihop | solo | 4/6 | 0 | 0 | 0 | 6 | 1168 | 292.0 | $0.000000 |
| multihop | fixed | 4/6 | 0 | 0 | 0 | 18 | 4242 | 1060.5 | $0.000000 |
| multihop | generated | 1/6 | 4 | 0 | 0 | 10 | 2915 | 2915.0 | $0.000000 |

Grader normalization: XML answer wrappers accepted uniformly after inference. Correctness changes: 0. Initial derived scores retained in `results.before-xml-answer-normalization.json`; all raw responses unchanged.
