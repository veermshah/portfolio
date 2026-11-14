# Fog Map

A dependency-free CLI comparing three interpretations of a Markdown spec. Each
interpretation includes a data model, API sketch, and line-attributed assumptions.
Disagreements become ranked HTML and Markdown reports with per-agent evidence.

**Build-session result:** the bundled offline rules demo produces **6 flagged
line/topic ambiguities** (5 topics) from 3 explicitly authored persona policies.
These are genuine choices left unspecified by the sample, but **they are not LLM
measurements**. No API credential, Ollama installation, or reachable model was
available in this environment. Live independent LLM calls are implemented but
were not exercised against a model. No quality claim on arbitrary specs is made.

## Setup and offline demo

Python 3.10+; no pip packages, GPU, paid service, or network needed. From this folder:

```sh
python fog.py sample-spec.md --backend offline --out output
python -m unittest -v
python -m http.server 8081 --bind 127.0.0.1
```

Open http://127.0.0.1:8081/output/report.html. `output/report.md` is the Markdown
version; `output/evidence.json` preserves input, all interpretations, assumptions,
and scores. Generated sample artifacts are bundled for immediate inspection.

## Point at a new spec

```sh
python fog.py /path/to/spec.md --backend ollama --out output-new
```

For local inference, install Ollama separately and run `ollama pull qwen3:4b`.
Then set `OLLAMA_MODEL=qwen3:4b` (the default) and optionally `OLLAMA_HOST`.
The standard quantized 4B model is a conservative target for an RTX 5070 Ti with
16 GB VRAM. Three concurrent requests may be serialized by Ollama; use a modest
context window and avoid configuring three separate resident model copies.
Long specs can exceed the model context and are not automatically chunked.

For an OpenAI-compatible provider (possibly paid), set `OPENAI_API_KEY`, optionally
`OPENAI_BASE_URL` and `FOG_MODEL`, then:

```sh
python fog.py /path/to/spec.md --backend api --out output-live
```

`.env.example` lists variables; it is documentation, **not auto-loaded**. Export
variables in the shell. Keys never enter reports or code. Provider/network/schema
errors fail loudly; no silent substitution to offline rules occurs. A run sends
three independent requests with full input; personas never see another answer.

## How ranking works

Decisions cluster by exact source line and normalized topic. Within each cluster,
assumptions are compared after case/whitespace normalization. Severity is the
number of differing pairs (up to 3) × maximum impact (1 cosmetic, 2 UX, 3
correctness/data/security). Missing coverage is shown when other agents disagree,
but is not counted as a competing interpretation. All original assumptions are
preserved, including in the full interpretation appendix.

The sample exposes day boundaries, grace rules, team ownership, historical edit
semantics, and notification channels/timing. Team ownership appears on two lines.
A high score means a decision deserves clarification, not that any persona is
correct. The comparison does not semantically merge differently worded topics or
equivalent assumptions; live outputs can therefore overflag or miss disagreement.
There is no second LLM judge, deployment agent, or generated application build.
The offline backend only recognizes five documented keyword families and is an
authored demonstration of the report pipeline, not general interpretation.

## 60-second demo

1. Read `sample-spec.md`; note that “daily”, “grace period”, and “share habits” lack precise rules.
2. Run `python fog.py sample-spec.md --backend offline`.
3. Open the HTML report and point out the prominent offline label.
4. Compare UTC, local calendar day, and rolling-window interpretations at line 3.
5. Show how retrospective edits could recalculate streaks, affect display only,
   or be time-limited, with all three assumptions beside the source sentence.
6. Inspect `output/evidence.json`, then use `--backend ollama` on a new spec once
   the local model is installed.
