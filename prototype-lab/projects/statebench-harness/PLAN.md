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
