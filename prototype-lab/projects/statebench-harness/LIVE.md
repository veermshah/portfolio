# Actual model experiment

`live_experiment.py` runs real model calls. Its raw baseline asks for one variable
at the end of a program. Its `model-scratchpad` method asks the **same model** to
write structured state after each chunk, saves that JSON to disk, and passes it
to the next call. No deterministic executor repairs the model's values. The
reference interpreter sees the operations only for scoring after prediction.
Tests explicitly verify that an incorrect predicted state survives unchanged.

A third `model-tool` arm asks the model to request an exact `execute_state` tool,
then asks the model to read the persisted output and answer. The tool executes
the supplied input operations and writes JSON each step; it receives no answer
key. This arm deliberately offloads tracking to a deterministic interpreter.
A wrong tool request prevents execution, and a wrong model reading of correct
tool output is scored wrong. Its gains must not be described as gains in the
model's internal or self-maintained state tracking.

## Reproduce

Install the project requirements. Provision the repository's
[`local_model_server.py`](local_model_server.py) and quantized weights using
the instructions in [MODEL_RUNS.md](MODEL_RUNS.md). Weight provenance
and hashes are in [`model_sources.json`](model_sources.json). The server
can run either model on CPU; both models and their 8192-token contexts are well
below a 16GB GPU target. They substitute for larger Qwen3 4B/8B Q4 targets because
this build environment has no GPU. No paid dependency or API credential is
required for the local server. Weights are downloaded separately, not committed.

With the 0.6B model available on port 8090 and 1.7B on 8091:

```bash
python live_experiment.py --base-url http://127.0.0.1:8090/v1 --model Qwen3-0.6B-Q4_K_M --context 8192 --max-tokens 256 --raw-max-tokens 64 --lengths 8 32 128 --samples 1 --chunk-size 8 --timeout 600 --output results-qwen06
python live_experiment.py --base-url http://127.0.0.1:8091/v1 --model Qwen3-1.7B-Q4_K_M --context 8192 --max-tokens 256 --raw-max-tokens 64 --lengths 8 32 128 --samples 1 --chunk-size 8 --timeout 600 --output results-qwen17
python summarize_live.py results-qwen06 results-qwen17 --output results-models
```

Run one server sequentially if CPU/RAM is constrained; change `--base-url` to the
same port for both calls and configure both model aliases in that server. Model
loading and inference can take minutes on CPU. The experiment prints each result
and saves incremental `records.json`; stopping early preserves completed records.
A run folder contains a complete config, exact generated task files, each prompt,
response, prediction, ground truth, schema failure, finish reason, token counts,
call count, elapsed wall time (including shared-server queue time), and persisted
model-written state. The combined folder
adds `accuracy.png`, `accuracy-overall.png`, level-specific `results.md`, and
aggregate `summary.md`.

For another OpenAI-compatible provider, set `--base-url` and provide its key
through `OPENAI_API_KEY`; add `--no-disable-thinking` to remove Qwen-specific
chat options if the provider rejects them. Such API use may incur provider fees.

## Local RTX 5070 Ti target

The measured CPU substitutions are small enough for 16GB VRAM. To repeat with a
larger target model, Ollama's OpenAI-compatible endpoint can serve Qwen3 4B/8B Q4.
Start/configure its server with `OLLAMA_CONTEXT_LENGTH=8192` and
`OLLAMA_MAX_LOADED_MODELS=1` before these commands:

```bash
ollama pull qwen3:4b
python live_experiment.py --base-url http://127.0.0.1:11434/v1 --model qwen3:4b --context 8192 --lengths 8 32 128 --output results-local4b
ollama stop qwen3:4b
ollama pull qwen3:8b
python live_experiment.py --base-url http://127.0.0.1:11434/v1 --model qwen3:8b --context 8192 --lengths 8 32 128 --output results-local8b
```

This GPU deployment path is provided for local use; the build measurements use
the pinned CPU models instead. Verify the installed Ollama model is Q4 and its
server context matches the driver's 8192 budget. Keep one model loaded at a time
and measure runtime overhead/KV cache on the actual card. No 24GB assumption or
64K live-context promise is made.

## Protocol and limits

- Fixed seed 42, temperature zero, four initial variables, integer literals 0–9,
  one queried variable, all four levels. Both methods use identical operations
  and queries. Default one sample per level/length means only four cases per
  aggregate point. This is a smoke reproduction, not a precise population estimate.
- Qwen3 thinking is disabled for every method with `/no_think` and the local
  server's explicit empty thinking block. Final measurements use **no JSON
  grammar**: JSON instructions, strict parsing, and removal of enclosing code
  fences/empty thinking blocks only. A preliminary generic-grammar generation
  stalled; its interrupted artifact is preserved separately and excluded. Both
  servers use one CPU thread, an 8192-token context, and the same temperature.
  Raw/tool answers have 64 generated tokens; state calls have 256.
- Immutable instructions allocate fresh variables, using random previous values
  or new literals. Overwrite uses value copies and sets. Self adds arithmetic.
  Reference adds persistent aliases and binding swaps. These are our explicit
  synthetic semantics, not an import of the official StateBench dataset.
- The model writes the entire currently retained state. For reference tasks it
  must also write a partition of names into shared-cell alias groups. Validation
  checks types, name coverage, alias consistency and JSON schema only. Wrong
  integers or wrong but well-formed alias groups remain wrong; they are never
  corrected from the reference interpreter.
- Immutable state is pruned after each chunk using static liveness: discard a
  name only if it is never read again and is not the query. This uses future
  operand names, not expected values. Mutable tasks retain all variables.
- A malformed model state stops that method on that task and counts as incorrect,
  rather than retrying until it succeeds. Invalid answer JSON is also incorrect.
  Output-token exhaustion is visible in `finish_reason` and is not hidden.
  Transport/context failures have separate error counts and are excluded from
  valid-answer accuracy. Read error counts before interpreting any curve.
- The client uses an actual tokenizer endpoint if available, otherwise an upper
  bound from UTF-8 bytes, reserving the output budget and chat overhead. The
  supplied local server additionally checks exact tokens and refuses overlong
  requests; it never silently truncates. 64K generation is supported and tested,
  but live 64K inference on an 8192-token server is intentionally not claimed.
- `harness.py` CPU replay controls and exact-tool scratchpad/chunking rows remain
  separate artifacts. They are not model evidence, and their richer final-state
  query metric must not be compared directly with this driver's single query.

## Research interpretation

The brief's “frontier at most 13% on longest/hardest tasks” refers to a different
model scale, task distribution, length range and metric. These small-model,
short-context measurements cannot confirm that exact percentage or a theoretical
transformer ceiling. Errors can reflect arithmetic, instruction following, or
structured-output failures as well as state retention; this protocol does not
isolate architecture as the causal factor. No Gated DeltaNet/recurrent hybrid, QLoRA training, frontier
API or official dataset reproduction is included. A measured scratchpad gain
would show only that externalizing state helped this fixed synthetic sample.
Only `model-scratchpad` improvements reflect model-produced state; `model-tool`
improvements reflect delegating execution to a deterministic tool and reading
its output. Since the input is a formal program, an ordinary interpreter alone
already solves it perfectly; adding an LLM is unnecessary for execution. This
arm measures successful tool delegation and reading, not a new tracking algorithm. Calls and token costs can be much higher than the raw baseline.

## 60-second demo

1. Open `results-models/accuracy.png` and aggregate `summary.md`.
2. Compare raw and model-scratchpad rows, including cost in calls/tokens.
3. Open any `results-qwen17/state/*.json` and its record's `trace`: the model
   actually produced the persisted values.
4. Run `python -m unittest test_live_experiment -v` to verify semantic checks,
   64K generation and propagation of deliberately wrong predicted state.
5. Explain the small sample and benchmark substitutions before drawing conclusions.
