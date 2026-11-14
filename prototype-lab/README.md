# AI Prototype Lab

Four working Python prototypes: Fog Map, a DynaFlow-style executable orchestrator, Pop-Up Optimizer, and a StateBench-style tracking harness.

Start with the [build report and exact run commands](projects/README.md). Each project includes a plan, setup instructions, reproducible demo or measurement, environment variable example, and a 60-second demo script.

**Research status:** the DynaFlow and StateBench model reproductions are incomplete. Shipped measurements use explicitly labeled deterministic CPU controls, not language models. No GPU memory or frontier-model result is claimed. Live Ollama and API adapters target modest-context Qwen3 4B/8B Q4 on a 16GB RTX 5070 Ti.

- [Fog Map](projects/fog-map/README.md): ranked spec ambiguity reports.
- [DynaFlow-style orchestrator](projects/dynaflow-orchestrator/README.md): generated workflows versus solo and fixed pipelines.
- [Pop-Up Optimizer](projects/popup-optimizer/README.md): weighted placement over explicitly synthetic Dallas data.
- [StateBench-style harness](projects/statebench-harness/README.md): assignment chains, exact tools, and honest accuracy curves.
