# DynaFlow-style prototype plan

## Scope and paper claim
The DynaFlow paper (Table 1, retrieved by the coordinator) (https://arxiv.org/abs/2610.34467) reports Forced collaboration at 100% on AIME 2024–2026 and 88.08% overall versus 77.18% for the strongest baseline, using trained Qwen3.5-27B orchestration. This prototype tests a narrower hypothesis: can prompted executable coordination improve cost per correct answer over the same frozen model alone and a fixed three-call pipeline? It does not train weights or reproduce the original benchmark suite.

## Architecture and decisions
Python 3.10+, standard library only. OpenAI-compatible and Ollama HTTP adapters share a frozen model across all three arms. Generated Python workflow source is parsed with a strict AST allowlist and interpreted, never passed to exec/eval. Tools receive the original task plus every prior response, without summaries. Parallel solver calls use threads. Workflow planning tokens count toward orchestration cost. Exact normalized answers are scored against separate labels. Bundled math and multi-hop tasks are original toy examples, not AIME or HotpotQA records.

The environment has no configured model API keys or Ollama executable; initial sandboxed outbound and localhost socket calls return EPERM; the coordinator subsequently retrieved the paper with network permissions. Consequently a deterministic symbolic/text-lookup CPU surrogate is the default smoke-test backend. Its results are engineering evidence only, not model or paper evidence. Real model runs are explicit, never silently substituted. Local target: Qwen3 4B Q4_K_M or 8B Q4_K_M on RTX 5070 Ti 16GB, conservative 8192 context; no 27B assumption.

## Milestones
1. Bundle labeled original tasks and implement model adapters with usage/cost accounting.
2. Build solo, fixed planner→solver→reviewer, and generated-program arms with restricted interpretation.
3. Run all arms, save individual traces and aggregate cost/accuracy tables; test parser security and context passing.
4. Document CPU smoke run, real model run, limitations, 60-second demo and reproducible results.

## Done
All three arms execute on both task families from a clean checkout. Output includes accuracy, tokens (or explicitly named surrogate estimates), total dollars when a rate is supplied, dollars/correct, token units/correct, latency and raw traces. Failure to beat solo is a valid result. Actual LLM and published-paper replication remain incomplete when no model is accessible.

Paper verification correction: Table 1 reports the solo CoT Qwen3.5-27B AIME 2026 score as 86.67%, not the approximately 52% supplied in the brief. This prototype uses the verified table value when describing that baseline. Paper numbers are claims, not independently reproduced evidence.
