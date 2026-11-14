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
