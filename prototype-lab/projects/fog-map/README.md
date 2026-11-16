# Fog Map

Compare three independent interpretations of a Markdown specification. Each
persona produces a data model, API sketch, and line-attributed assumptions;
ranked HTML and Markdown reports show where their implementation choices differ.
Python 3.10+; standard library only.

## Actual model result

**Three real Qwen3-1.7B Q4_K_M CPU calls produced 6 flagged line/topic pairs
covering 5 unique topics**, with at least four clear implementation conflicts:

| Source | Backend interpretation | Frontend interpretation | QA interpretation |
|---|---|---|---|
| Line 3: daily | Fixed UTC-8 end of day | User's timezone | UTC-8 end of day plus user timezone (internally unclear) |
| Line 4: grace period | 7 days, once per team | 7 days, once per missed day | 7 days, once per missed day |
| Line 6: edit past check-ins | Recompute only within grace period | Recompute streaks | Do not recompute streaks |
| Line 7: notifications | Email all team members at day end | Email 24 hours before risk | Email 24 hours before risk |

These are model-produced policies, not authored choices inserted into responses.
The team ownership topic also differs (team leader versus habit creator), and
appears on both lines 2 and 5. This is six report entries, not six independent
product issues. The run used **2876 provider tokens (1444 input, 1432 output)**;
longest queue-inclusive request latency **183.033 seconds**. Local API fees $0;
this excludes hardware/electricity. See [the HTML report](output-live-1.7b/report.html),
[JSON evidence](output-live-1.7b/evidence.json), raw request/response files, and
[run metadata](output-live-1.7b/run-metadata.json).

The build VM has no GPU. A small **1.7B CPU model substitutes for the intended
Qwen3-4B Q4 GPU target**. This is one small spec, not a validated general ambiguity
detector. Earlier 0.6B schema/quality failures and a constrained-decoding runtime
stall are retained in [LIVE_ATTEMPTS.md](LIVE_ATTEMPTS.md) and their artifact folders.
No live output was manually repaired. No paid API was used.

## Setup and offline demo

No packages, GPU, or network needed for the explicitly authored rules demo:

```sh
python fog.py sample-spec.md --backend offline --out output
python -m unittest -v
python -m http.server 8081 --bind 127.0.0.1
```

Open http://127.0.0.1:8081/output-live-1.7b/report.html for the actual model report,
or `/output/report.html` for the separately labeled offline rules demo. Each run
also writes Markdown, full interpretations, and reproducible JSON evidence.
Offline policies yield 6 flags but are **not independent LLM inference**.

## Reproduce the actual three model calls

Install/download/start the CPU inference server using
[the repository's model instructions](../../MODEL_RUNS.md). A server hosting the
1.7B alias must be running. From this project directory, for the measured
separate-port setup:

```sh
OPENAI_API_KEY=local OPENAI_BASE_URL=http://127.0.0.1:8091/v1 \
FOG_MODEL=Qwen3-1.7B-Q4_K_M \
python fog.py sample-spec.md --backend api --out output-reproduced
```

If using the single server in the repository instructions, use port **8090**
instead. `local` is a dummy localhost placeholder, not a secret. Requests carry
full numbered input and role priorities: storage consistency, intuitive UX, and
edge-case testability. The prompt supplies source/topic questions but **no
candidate answers**. Requests do not share outputs. The coordinator adapter uses
CPU llama.cpp, seed 42, 8192 context, one thread, Qwen nonthinking formatting;
client temperature 0.7 and max 1800 completion tokens. JSON is prompt-instructed,
not grammar-constrained. Exact requests and responses are saved before parsing;
malformed responses fail loudly. Queue ordering and sampling can affect exact
wording, scores, and timing.

## New specs and local 16 GB GPU target

Install Ollama separately and run `ollama pull qwen3:4b`, then:

```sh
python fog.py /path/to/spec.md --backend ollama --out output-new
```

`OLLAMA_MODEL=qwen3:4b` and `OLLAMA_HOST=http://localhost:11434` are the defaults.
The quantized 4B model is a conservative RTX 5070 Ti **16 GB** target; modest
context is advised. Three requests may serialize; avoid three resident copies.
Long specs are not chunked automatically and may exceed the model context.
The GPU model was not benchmarked here.

For another OpenAI-compatible provider (possibly paid), export `OPENAI_API_KEY`,
optionally `OPENAI_BASE_URL` and `FOG_MODEL`, then use `--backend api`.
`.env.example` documents variables; it is **not automatically loaded**. Export
variables in the shell. Keys never enter reports or code. No provider failure
silently substitutes the offline backend.

## Ranking and limits

The prototype recognizes five topic families (daily/day boundary, grace,
team ownership, historical edits, notifications). Recognized source lines become
common topic questions for all three models, allowing attributable comparison.
When no families match, the prompt requests open-ended ambiguity discovery.
This catalog is limited; new domains can need additional topic rules.

Decisions group by exact source line and normalized topic. Assumptions compare
after case/whitespace normalization. Severity = number of differing agent pairs
(up to 3) × maximum model-reported impact (1 cosmetic, 2 UX, 3 data/correctness).
Missing coverage is not a conflicting assumption. All original text is preserved.

**Textual difference is a candidate signal, not semantic proof.** In the measured
team entries frontend/QA paraphrases are scored as different, inflating their
pair count; the repeated team topic is not deduplicated across lines. Models also
underestimate some impacts and QA gives an unclear timezone policy. Review the
actual assumptions, not only the rank. There is no semantic judge or independent
quality evaluation. APIs are sketches (the measured model omitted HTTP methods),
not runnable app builds. The product produces interpretation reports, not apps.

## 60-second demo

1. Read the sample's vague “daily”, “grace period”, and “past check-ins” requirements.
2. Run `python fog.py sample-spec.md --backend offline` for an immediate smoke demo;
   point out its authored-rules label.
3. Open `output-live-1.7b/report.html` to inspect the bundled actual model run.
4. Contrast “recompute streaks” with “do not recompute streaks” at line 6.
5. Compare grace frequency and notification timing beside each source sentence.
6. Inspect raw request/response evidence, then rerun with the CPU endpoint or
   point Ollama at a new spec.
