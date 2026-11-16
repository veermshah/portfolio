# AI Prototype Lab

Four working Python prototypes: Fog Map, a DynaFlow-style executable orchestrator, Pop-Up Optimizer, and a StateBench-style tracking harness, with actual CPU language-model measurements.

Start with the [build report and exact run commands](projects/README.md). Each project includes a plan, setup instructions, reproducible demo or measurement, environment variable example, and a 60-second demo script.

**Measured models:** real Qwen3 0.6B/1.7B Q4 CPU runs now accompany the separately labeled deterministic controls. The DynaFlow experiment includes published AIME/HotpotQA questions and a distinct easy-task calibration. StateBench includes two-model curves, model-written JSON state and a model-delegated execution tool. These small experiments do not reproduce either paper's headline score, training protocol or model scale. No GPU memory or frontier-model result is claimed; local GPU instructions target modest-context Qwen3 4B/8B Q4 on a 16GB RTX 5070 Ti.

Provision the free CPU backend with [MODEL_RUNS.md](MODEL_RUNS.md). Model weights are downloaded separately and checksum-verified; no model API key is required. All project READMEs include exact run commands, evidence, limits and demo scripts.

- [Fog Map](projects/fog-map/README.md): ranked spec ambiguity reports.
- [DynaFlow-style orchestrator](projects/dynaflow-orchestrator/README.md): generated workflows versus solo and fixed pipelines.
- [Pop-Up Optimizer](projects/popup-optimizer/README.md): weighted placement over explicitly synthetic Dallas data.
- [StateBench-style harness](projects/statebench-harness/README.md): assignment chains, exact tools, and honest accuracy curves.
