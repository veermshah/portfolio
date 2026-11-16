# Plan

## Architecture and choices
Python standard-library generator, reference interpreter, JSON scratchpad executor,
chunked executor, HTTP adapters for Ollama and OpenAI-compatible APIs; matplotlib
exports measured accuracy curves. No GPU needed for the smoke benchmark. Target
local inference is Qwen3 4B/8B Q4 in Ollama, one model at a time on 16GB VRAM.

The user-supplied StateBench claim is ≤13% accuracy for frontier models on the
longest/hardest tasks and better recurrent-hybrid state tracking. We will test
exact final-state accuracy versus assignment count with four explicit semantics.
This is a StateBench-style synthetic benchmark, not the official dataset.

## Milestones
1. Generate deterministic chains (8–64,000 assignments) and exact reference states.
2. Implement real model HTTP backends plus clearly named offline CPU baselines.
3. Measure raw, JSON scratchpad, and chunked execution; save per-example evidence.
4. Export chart/table and document reproduction and limitations.

## Assumptions and done
No credentials/model runtime were found initially. Offline measurements will use
exact CPU interpreter and deliberately bounded replay baselines, never be labeled
LLM measurements or evidence of transformer collapse. Online model runs remain
available with explicit backend selection. Missing two-model reproduction will be
reported as incomplete. Done means tests pass, a seeded measured curve and fix
comparison exist, and README commands reproduce them without network access.

## Completion pass (2026-11-16)
The coordinator is provisioning two actual CPU GGUF models (Qwen3 0.6B and 1.7B,
Q4) behind an OpenAI-compatible server. Add a separate live experiment driver;
preserve original CPU controls and their provenance. Local 4B/8B Q4 remain the
16GB deployment targets, while smaller models are explicitly CPU substitutions.

Live measurements use deterministic low-alphabet chains with a configurable
number of mutable variables and a single queried variable (full query correctness
is additionally reported), compact statement syntax and a fixed prompt per model.
The four-level generator supports 8–64,000 statements, but actual inference will
only cover prompts that fit the server context and CPU time budget. Raw calls
must compete against genuinely model-produced state at chunk boundaries: the
harness validates JSON shape/types/aliases and persists the prediction, without
correcting it from the oracle. The oracle is used only after prediction for scoring.
Record every prompt/response, model call, token use, error and elapsed time; use
identical tasks/seeds across methods and models. Do not tune seeds or prompts to
force degradation. If accuracy does not collapse or recovery does not occur,
report those actual results and the remaining limitation.

Milestones: implement model-state validation and transport; test semantics and
absence of oracle correction; hand off exact sequential measurement commands;
then summarize actual two-model evidence and honest paper comparison.

### Completion-pass evidence
- The generic JSON-grammar attempt was interrupted after a stalled state call;
  it is preserved in `results-qwen17-interrupted-grammar` and excluded.
- Final protocol uses single-thread CPU inference without grammar, strict JSON
  parsing, 64-token raw/tool answers and 256-token state outputs. No task seed,
  query, or prompt was retuned after observing test accuracy.
- The 1.7B run completed all 36 task-method rows: raw 4/12, model-written state
  3/12, model-delegated exact tool 12/12. Thus self-maintained state did not help,
  while explicitly delegating input-program execution did. The latter is a
  practical deterministic-tool fix, not intrinsic model-state recovery.
- Additional tests validate malformed-state rejection, alias partitions,
  propagation of wrong predicted state, model-selected tool execution, model
  misreading of correct tool output, context preflight and server disconnects.
- Both actual-model runs finished: 72 unique case-method rows, 171 real model
  calls, zero transport/context errors. Both raw curves were 75%/25%/0% at
  8/32/128 assignments. The 0.6B model-state arm scored 2/12 and model-tool 1/12;
  the 1.7B arm scored 3/12 and model-tool 12/12. Final two-model curves and honest
  negative results are in `results-models` and `MEASUREMENTS.md`.
- Integrity audit checked paired task bytes, seeded truths, correctness flags,
  model-call counts and token sums. Merge tooling refuses incomplete, duplicate,
  or mismatched-protocol runs. No official frontier percentage is claimed.
