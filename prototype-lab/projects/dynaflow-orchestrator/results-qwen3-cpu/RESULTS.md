# Real-model measured results

Backend: openai; model: Qwen3-0.6B-Q4_K_M; tokens: provider reported.

Dataset: public AIME 2024 and HotpotQA subset; tiny convenience sample, not full-paper evaluation. Zero local API fees exclude hardware/energy. Invalid generated plans count as model/orchestration failures and incorrect answers; provider errors are separate technical failures. All successful call tokens, including unsolved tasks and invalid-plan outputs, are charged.

| Benchmark | Arm | Correct | Invalid plans | Provider errors | Length-capped calls | Calls | Tokens | Tokens / solved | API fees / solved |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| aime2024 | solo | 0/6 | 0 | 0 | 0 | 6 | 1676 | undefined | undefined |
| aime2024 | fixed | 0/6 | 0 | 0 | 6 | 18 | 9481 | undefined | undefined |
| aime2024 | generated | 0/6 | 0 | 0 | 0 | 24 | 7660 | undefined | undefined |
| hotpotqa | solo | 0/6 | 0 | 0 | 0 | 6 | 9612 | undefined | undefined |
| hotpotqa | fixed | 1/6 | 0 | 0 | 0 | 18 | 29744 | 29744.0 | $0.000000 |
| hotpotqa | generated | 0/6 | 3 | 0 | 0 | 15 | 26601 | undefined | undefined |

Grader normalization: XML answer wrappers accepted uniformly after inference. Correctness changes: 1. Initial derived scores retained in `results.before-xml-answer-normalization.json`; all raw responses unchanged.
