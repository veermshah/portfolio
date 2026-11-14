# Four-project prototype session

Four parallel agents built isolated projects, each with a PLAN, README, environment-variable example, and runnable CPU demo. **The two research reproductions remain incomplete:** no model credentials, local weights, Ollama, or GPU were available. Their shipped CPU controls are explicitly labeled and are not LLM results.

Run commands below from the `prototype-lab/` directory (Python 3.10+).

| Project | Command | Verified result |
|---|---|---|
| [Fog Map](fog-map/README.md) | `cd projects/fog-map && python fog.py sample-spec.md --backend offline --out output` | Six ranked ambiguities across five topics; HTML, Markdown, full JSON evidence. Three authored policies substitute for live interpretations. |
| [DynaFlow](dynaflow-orchestrator/README.md) | `cd projects/dynaflow-orchestrator && python orchestrator.py --backend surrogate` | Executable constrained workflows and three benchmark arms; coordination loses on proxy cost. |
| [Pop-Up Optimizer](popup-optimizer/README.md) | `cd projects/popup-optimizer && python app.py --port 8003` | Five ranked Dallas points at http://127.0.0.1:8003; 96,805 / 269,985 synthetic residents covered. |
| [StateBench](statebench-harness/README.md) | `cd projects/statebench-harness && python -m pip install -r requirements.txt && python harness.py --backend offline --output results` | Accuracy chart, per-example evidence, two bounded replay controls and exact tools. |

## Research measurements

DynaFlow's paper reports 88.08% overall versus 77.18% and 100% on three AIME years. Its Table 1 gives solo CoT AIME 2026 as 86.67%, rather than the brief's approximately 52%. Our twelve original toy questions are not official AIME/HotpotQA items. All CPU-surrogate arms solve 6/6 per family:

| Family | Solo proxy units/solved | Fixed pipeline | Generated workflow |
|---|---:|---:|---:|
| Math | 78.0 | 257.2 | 440.0 |
| Multi-hop | 118.0 | 381.5 | 562.3 |

Units are ceil(characters/4), not measured model tokens. Dollar costs are unavailable. This does not establish any real-model advantage or reproduce the paper.

StateBench's brief cites at most 13% frontier accuracy on the hardest/longest tasks. The paper confirms degradation toward chance; the precise 13% was not confirmed in searchable text. Our inspired generator is not the official benchmark. Across four levels and three seeds:

| Assignments | Replay last 32 | Replay last 128 | JSON scratchpad | Chunked tool |
|---|---:|---:|---:|---:|
| 8 | 100% | 100% | 100% | 100% |
| 32 | 100% | 100% | 100% | 100% |
| 128 | 25% | 100% | 100% | 100% |
| 512 | 16.7% | 58.3% | 100% | 100% |
| 2048 | 0% | 50% | 100% | 100% |

These deliberately bounded algorithms are not models. Both fixes are deterministic interpreters, not LLM-maintained memory. The two-model transformer failure curve and model-mediated recovery are outstanding.

## Verification and limits

The coordinator copied each project to a fresh temporary directory without generated results or Python caches, regenerated outputs, and ran its documented checks. Fog and DynaFlow each pass four tests; StateBench checks all four generators through 64,000 assignments and its tool semantics. Pop-Up checks nine optimizer configurations and five handler routes; an independent live HTTP check confirmed five returned stops and the served SVG page. Matplotlib was already installed. Browser interaction was not tested because the installed Playwright package had no browser executable.

All live LLM adapters remain unverified against real providers. No training, recurrent hybrid, official research benchmark score, or GPU memory measurement is claimed. Local instructions target Qwen3 4B/8B Q4 with modest context on a 16GB RTX 5070 Ti; long contexts need separate memory checks. Fog's offline rules cover only the documented sample concepts. Pop-Up uses synthetic demographics and clinic flags, approximate neighborhood coordinates, a schematic map, and heuristic travel times; recommendations are not validated venues.

Each project README contains its full setup, reproduction steps, limitations, and 60-second demo script. No real secrets are included.
