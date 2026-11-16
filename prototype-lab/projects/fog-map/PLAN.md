# Fog Map plan

Architecture: a dependency-free Python CLI reads numbered Markdown lines, makes three
independent requests (backend, frontend, QA), validates structured interpretations,
and compares decisions by source line and topic. Reports include each persona's
models, endpoint sketches, assumptions, and severity-ranked disagreements.

Choices: OpenAI-compatible chat completion API or Ollama. No usable API credential
is configured here, so the CPU smoke demo uses a transparent deterministic rules
backend with distinct persona policies. It is not an LLM result. The live backend
is available for new specs. Local target: Ollama qwen3:4b at Q4 on 16 GB VRAM.

Milestones:
1. Implement structured independent interpretations and a deliberately ambiguous spec.
2. Compare per-line decisions; rank disagreement × decision impact.
3. Emit escaped standalone HTML plus Markdown and reproducible JSON evidence.
4. Run offline smoke tests and document live model commands and limitations.

Done: sample flags at least three genuine ambiguities, each attributable to its
source line with all three assumptions, severity, and interpretation artifacts.
New Markdown specs are accepted by the CLI. Offline rules only recognize a small
explicit vocabulary and cannot establish general spec-understanding quality.

## Follow-up: real CPU model run

Replace the unfulfilled live-model check with three independent inference calls to
an OpenAI-compatible localhost llama.cpp endpoint supplied by the coordinator.
Use Qwen3-0.6B/1.7B Q4 as an explicit CPU substitution; retain the 4B Q4 local GPU
target and offline example. Preserve raw completions, provider token counts,
model identity, and request latency alongside reports. Validate returned structure
and source lines; fail on malformed output rather than filling in authored
assumptions. The live completion criterion remains >=3 genuine, line-attributed
disagreements. A small model's failure must be reported as a failure.

For the real run, prompts identify line/topic pairs using the documented keyword
catalog and ask concrete policy questions (timezone, duration/frequency,
ownership, retroactive edit effects, notification channel/timing). They supply
no candidate answers. Persona prompts emphasize consistency, user experience,
and testability respectively. Full request/response JSON is persisted before
validation. After two failed 0.6B attempts and a runtime interruption, try the
1.7B Q4 CPU model with JSON prompt instructions and no constrained grammar.
