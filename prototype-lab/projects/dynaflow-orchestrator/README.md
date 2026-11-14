# DynaFlow-style executable orchestrator

A runnable, dependency-free experiment comparing the **same frozen model** under solo, fixed planner → solver → reviewer, and per-task generated Python workflows. The lead emits executable coordination; independent solvers can run concurrently, then pass full task context and prior responses to a verifier and aggregator. No weights are trained.

**Build result: the harness works; the paper's core LLM result has not been reproduced.** No model keys, local Ollama server, model weights, or GPU were available. The bundled results use a clearly labeled deterministic CPU surrogate (arithmetic and greedy graph traversal). This is an executable smoke test, not evidence about language-model reasoning. No outputs or costs are fabricated, and no LLM backend silently falls back to the surrogate.

## Run from a clean checkout

Python 3.10+ only. No pip install or secrets required.

```bash
cd projects/dynaflow-orchestrator
python orchestrator.py --backend surrogate
python -m unittest -q
```

Read `results/RESULTS.md`; `results/results.json` contains answers, labels, generated programs, full model handoffs, per-call input/output accounting, errors and wall-clock timing. `--output /tmp/dynaflow-run` keeps a separate run. Relative task paths are resolved from your working directory; the bundled default is resolved from the script location.

The 12 bundled tasks are original, deliberately small math and fictional multi-hop examples, **not official AIME or HotpotQA subsets**. Labels never enter model prompts. The surrogate's algorithm is deliberately narrow and receives only the public question/facts; it is not a learned model. Its generated workflow is a deterministic two-call program after the planning call, not learned orchestration.

## Measured CPU run

All arms scored 6/6 on each family. Token units below are **ceil(characters / 4) proxies**, not tokenizer counts. Actual LLM runs require provider-reported token counts. Dollars are unavailable for the surrogate; they are not reported as zero.

| Task family | Arm | Correct | Calls | Proxy token units / solved | Dollars / solved |
|---|---|---:|---:|---:|---|
| Math | Solo | 6/6 | 6 | 78.0 | unavailable |
| Math | Fixed pipeline | 6/6 | 18 | 257.2 | unavailable |
| Math | Generated program | 6/6 | 18 | 440.0 | unavailable |
| Multi-hop | Solo | 6/6 | 6 | 118.0 | unavailable |
| Multi-hop | Fixed pipeline | 6/6 | 18 | 381.5 | unavailable |
| Multi-hop | Generated program | 6/6 | 18 | 562.3 | unavailable |

**Generated coordination loses on proxy units per correct answer in this smoke run.** No dollar-cost or accuracy advantage is established. Full-context handoffs, the workflow-design call, verification and aggregation are all charged. These tasks saturate the surrogate; harder, larger real-model benchmarks are necessary before drawing conclusions. A single deterministic run has no confidence interval or generalization claim.

## Run on RTX 5070 Ti, 16GB

Install Ollama separately, then:

```bash
ollama pull qwen3:4b
python orchestrator.py --backend ollama --model qwen3:4b --context 8192 --output results-qwen3-4b
```

The target is Qwen3 **4B Q4_K_M** (or 8B Q4_K_M if measured memory permits), with 8192 context. Check `ollama show qwen3:4b` for the quantization of your downloaded tag. Four-bit 4B/8B weights leave room for runtime and KV cache on a 16GB card; this environment did not measure GPU VRAM. Keep 4B as the safe default and check actual peak memory locally. Parallel calls can increase runtime/KV memory or be serialized by Ollama; they do not require multiple copies of the weights. No 27B or 24GB-card assumption is used. Ollama counts include all supplied context; server behavior such as truncation must be checked for longer custom tasks. `/no_think` and Ollama `think: false` request concise answers; compatibility depends on server/model versions.

Ollama has no metered API fee. The default deliberately leaves dollar cost unknown; if you want zero *API fees* recorded, supply `--input-per-million 0 --output-per-million 0`, which excludes electricity/hardware costs. Token-per-solved and latency remain useful even when API-fee-per-solved is zero.

## Run an API model

Copy `.env.example` for reference and export variables yourself (the script does not load `.env` automatically). Any OpenAI-compatible chat-completions provider can be used. **API calls may incur paid charges.** Obtain current prices from your provider and supply both rates per million tokens.

```bash
export OPENAI_API_KEY='your-key'
export OPENAI_BASE_URL='https://api.openai.com/v1'
export MODEL='your-available-model'
python orchestrator.py --backend openai --model "$MODEL" \
  --input-per-million 0.15 --output-per-million 0.60 --output results-api
```

Those rates are an **illustrative input**, not a claim about any current model. Provider usage fields are mandatory; no estimated usage substitutes for missing API accounting. All arms use precisely the same configured model. Unsupported model parameters and provider/network failures become visible failed tasks, not replacement answers. A completely failed run exits nonzero. Partial failures count incorrect and appear in JSON; inspect `errors` in summaries before comparing accuracy. Token cost of an HTTP request that fails after provider billing cannot be known from this harness.

## Workflow execution and benchmark extension

Generated programs contain up to six assignments and only `solve`, `parallel`, `verify`, `aggregate` calls. The Python AST is validated and interpreted; arbitrary Python is never executed. A nine-call total budget includes the workflow-design call (at most eight tool calls). Invalid plans fail the task without hidden retries. There is no filesystem, shell, import, attribute access, loop or network primitive in the generated language. Actual network access occurs only through the configured model adapter. The selected predecessor value is explicitly included along with complete prior history at verification/aggregation boundaries. This is a constrained Python subset, not the paper's general JavaScript runtime.

Pass `--tasks mytasks.json` to run labeled tasks with fields `id`, `benchmark`, `question`, `answer` and optional `facts`. Answers are normalized by whitespace/case and a trailing period; this strict simple grader may reject otherwise correct verbose outputs. The benchmark does not execute math supplied by a model. Raw traces include task content; protect them if your custom dataset is sensitive.

## Paper comparison and limitations

[DynaFlow, arXiv:2610.34467](https://arxiv.org/abs/2610.34467), Table 1, reports trained Qwen3.5-27B **Forced** collaboration at 100% for AIME 2024, 2025 and 2026, and 88.08% overall versus the best baseline's 77.18%. The coordinator retrieved the public paper with network permissions. The table's solo CoT AIME 2026 result is **86.67%**, correcting the approximately 52% figure in the supplied brief. These are the paper's claims, not independent confirmations.

This project skips QLoRA and uses few-shot workflow prompting. It does not use the 27B backbone, original training data, original six-benchmark evaluation, official AIME/HotpotQA items, or Vals AI's reported comparisons. Our surrogate's 100% on twelve toy tasks is not comparable to the paper's 100% on AIME. The required real-model cost-per-solved comparison is **incomplete**, with adapters ready for local execution. The experiment reports an orchestration loss honestly instead of forcing a winning result.

## 60-second demo

1. (0–15s) Run `python orchestrator.py --output /tmp/dynaflow-demo`.
2. (15–30s) Read the table: all arms solve the tiny tasks, but generated workflows use more proxy units.
3. (30–45s) Open `/tmp/dynaflow-demo/results.json`, search `workflow`, and inspect the actual Python program and complete handoffs.
4. (45–60s) Run `python -m unittest -q`; point out the rejected execution escapes and the parallel/full-context test. Explain that swapping `--backend ollama --model qwen3:4b` runs the real model experiment locally.
