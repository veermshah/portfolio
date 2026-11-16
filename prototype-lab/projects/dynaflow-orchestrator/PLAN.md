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

## Follow-up completion pass (2026-11-16)
The coordinator is provisioning CPU llama.cpp and Qwen3 0.6B/1.7B Q4 GGUF weights, exposed through a loopback OpenAI-compatible endpoint. This replaces unavailable API access with actual local inference; it does not substitute the original 27B trained model. Benchmark the same frozen model on all 12 original style tasks and all three arms, with provider token counts and zero local API fees (hardware/electricity excluded). Intermediate planners, solvers and verifiers now produce concrete reasoning/evidence; only final review/aggregation requests a concise marked answer. No synthetic response is substituted in real-model runs. Explicit FINAL markers are extracted without consulting labels. Few-shot code examples improve tiny-model workflow syntax; invalid programs still count as errors with no hidden correction or retries. Incremental raw traces preserve completed runs. Real inference waits for the coordinator's CPU allocation.

The follow-up retrieved actual public data successfully with network permission: `benchmark_tasks.json` now freezes the first six AIME 2024 rows and first six HotpotQA distractor-validation rows before inference. These replace toy tasks for the real run. Every Hotpot distractor paragraph is retained and labels/reference solutions remain outside prompts. See DATA.md and DATA_PROVENANCE.json. Original toy tasks remain solely for deterministic smoke tests. Full inference was started after the coordinator allocated the CPU endpoint. Shared-server queuing makes wall-clock times operational observations, not isolated throughput comparisons.


## Completed measurements (2026-11-16)
The final official subset ran all 36 arms with 87 successful provider calls / 84,774 real tokens: AIME 0/6 in every arm; HotpotQA solo 0/6, fixed 1/6, generated 0/6 with three invalid generated plans (model failures, not transport failures). Local API fees total $0. The first infrastructure-interrupted attempt is retained separately and contributes no accuracy evidence. Uniform explicit XML answer-wrapper normalization changed one derived official score without rerunning inference; original scores/raw outputs remain.

An additional separately named real-model calibration used the complete original toy set at a different, disclosed 128-token solver / 192-token plan budget on a spare CPU server. All three math arms scored 1/6, with tokens/correct 1039, 4875 and 3257 for solo/fixed/generated. Multi-hop scored 4/6, 4/6 and 1/6, with tokens/correct 292, 1060.5 and 2915. Generated workflows failed protocol validation on 2 math and 4 multi-hop tasks; all tokens were charged. No provider errors occurred. This is a measured orchestration loss, not an original-paper replication. Clean isolated-copy smoke/test verification passed all ten tests without network, models, caches or existing results. Local GPU VRAM and larger-model original-paper results remain unmeasured.
