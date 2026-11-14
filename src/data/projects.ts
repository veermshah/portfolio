/**
 * Every project on the site lives here. The home page lists them in array
 * order, and each one gets a page at /projects/<slug>.
 *
 * Images go in src/assets/projects/<slug>/ and are referenced by file name.
 * Astro converts them to responsive WebP at build time.
 */

export interface ProjectLink {
  label: string;
  href: string;
}

export interface ProjectImage {
  /** File name inside src/assets/projects/<slug>/ */
  file: string;
  alt: string;
  caption?: string;
}

export interface Project {
  slug: string;
  title: string;
  /** One line for the home page list. */
  pitch: string;
  award?: string;
  /** Hackathon, course or context, shown next to the role. */
  context?: string;
  role: { kind: 'Solo' } | { kind: 'Team'; size?: number; mine?: string };
  stack: string[];
  live?: string;
  code: string;
  /** Renders "Code (soon)" without a link until the repo is public. */
  codePrivate?: boolean;
  /** Extra links shown on the project page (reports, docs, videos). */
  extra?: ProjectLink[];
  problem: string;
  built: string[];
  results: string[];
  images: ProjectImage[];
}

export const projects: Project[] = [
  {
  "slug": "fog-map",
  "title": "Fog Map",
  "pitch": "Compare interpretations of a spec and rank the decisions that need clarification.",
  "stack": [
    "Python",
    "LLM APIs",
    "Ollama",
    "HTML"
  ],
  "problem": "Small ambiguities in a spec can produce incompatible data models, APIs and behavior. A ranked comparison makes those decisions visible before implementation.",
  "built": [
    "An AI-assisted prototype fans out independent backend, frontend and QA prompts, preserving each interpretation’s data model, endpoint sketch and line-attributed assumptions.",
    "The CLI groups decisions by source line and topic and exports ranked HTML, Markdown and JSON evidence. Severity combines disagreement and impact. Live Ollama and API adapters are implemented."
  ],
  "results": [
    "The authored offline demo flags six line/topic ambiguities across five topics in a habit-tracking spec. These are demonstration policies, not measured independent LLM interpretations.",
    "Four tests pass for attribution, scoring, agreement handling and HTML escaping. Live providers were unavailable and remain unverified."
  ],
  "context": "AI-assisted prototype session",
  "role": {
    "kind": "Solo"
  },
  "code": "https://github.com/veermshah/portfolio/tree/main/prototype-lab/projects/fog-map",
  "images": []
},
  {
  "slug": "dynaflow-orchestrator",
  "title": "DynaFlow-style Orchestrator",
  "pitch": "Executable agent coordination with an honest solo-versus-pipeline cost comparison.",
  "stack": [
    "Python",
    "AST interpreter",
    "Ollama",
    "LLM evaluation"
  ],
  "problem": "Agent teams add calls and context. The useful question is whether task-specific coordination improves cost per solved task against the same model running alone.",
  "built": [
    "An AI-assisted prototype prompts a lead to emit constrained executable Python workflows. Solvers can run in parallel, followed by verification and aggregation, with full original context and prior outputs.",
    "An AST interpreter permits only coordination functions. A benchmark compares solo, fixed planner/solver/reviewer and generated workflows, including planning-call cost and raw traces."
  ],
  "results": [
    "All three deterministic CPU-surrogate arms solve 12/12 original toy tasks. Generated orchestration loses: math proxy units per solved task are 440.0 versus 78.0 solo and 257.2 fixed; multi-hop is 562.3 versus 118.0 and 381.5.",
    "Units are character-based proxies, not model tokens; dollar costs are unavailable. No model was available, so this does not reproduce DynaFlow’s claimed 88.08% overall or 100% AIME accuracy.",
    "Four tests pass, including execution restrictions and parallel full-context handoffs. Training and official benchmark evaluation remain outstanding."
  ],
  "context": "AI-assisted prototype session",
  "role": {
    "kind": "Solo"
  },
  "code": "https://github.com/veermshah/portfolio/tree/main/prototype-lab/projects/dynaflow-orchestrator",
  "images": []
},
  {
  "slug": "popup-optimizer",
  "title": "Pop-Up Optimizer",
  "pitch": "Rank civic-service stops on a Dallas map using need-weighted clustering.",
  "stack": [
    "Python",
    "JavaScript",
    "SVG",
    "Weighted k-means"
  ],
  "problem": "Pop-up health vans, food banks and vaccine clinics need locations that balance population, need and travel distance. A transparent placement heuristic makes those tradeoffs inspectable.",
  "built": [
    "An AI-assisted offline web app offers three services, one to ten stops and adjustable travel windows. Weighted k-means proposes centers, snaps them to sample locations and ranks them by incremental need-weighted coverage.",
    "An SVG geographic map and plain-English explanations show coverage and high-need counts. Shared residents are counted only once in the overall served total."
  ],
  "results": [
    "The default five-stop health demo covers 96,805 of 269,985 synthetic residents. Population, need indicators and clinic flags are invented demo data, not Dallas demographic estimates.",
    "Nine optimizer configurations and five HTTP routes pass checks; independent live HTTP requests confirm five recommendations. The schematic map, approximate travel times and unverified venues limit this to an illustrative demo."
  ],
  "context": "AI-assisted prototype session",
  "role": {
    "kind": "Solo"
  },
  "code": "https://github.com/veermshah/portfolio/tree/main/prototype-lab/projects/popup-optimizer",
  "images": []
},
  {
  "slug": "statebench-harness",
  "title": "StateBench-style Harness",
  "pitch": "State-tracking chains, bounded replay controls and exact memory tools with reproducible curves.",
  "stack": [
    "Python",
    "Matplotlib",
    "Ollama",
    "State tracking"
  ],
  "problem": "Long assignment chains test whether a model can preserve changing state. A useful harness must separate reasoning failure from context truncation and tool-assisted execution.",
  "built": [
    "An AI-assisted generator produces immutable, overwrite, self-referential and aliased-reference/swap chains from 8 to 64,000 assignments, with explicit semantics and an exact interpreter.",
    "The harness supports Ollama and API calls, bounded CPU replay controls, persisted JSON scratchpads and chunked execution. It emits per-example records, tables and a chart. Oversized local prompts are rejected before inference."
  ],
  "results": [
    "Across four levels and three seeds, replay-32 falls from 100% at eight assignments to 0% at 2,048; replay-128 reaches 50%. Exact scratchpad and chunked tools remain at 100%.",
    "These are deliberately bounded algorithms and deterministic interpreters, not two language models or model-mediated fixes. No transformer failure curve or frontier score has been reproduced.",
    "Four tests pass, including aliases/swaps, fixes, context preflight and all four generators at 64,000 assignments. The synthetic task distribution is not the official StateBench dataset."
  ],
  "context": "AI-assisted prototype session",
  "role": {
    "kind": "Solo"
  },
  "code": "https://github.com/veermshah/portfolio/tree/main/prototype-lab/projects/statebench-harness",
  "images": []
},
  {
    slug: 'veer',
    title: 'Veer',
    pitch:
      'A programming language for LLM programs whose compiler proves KV-cache memory, prefill cost and numeric error bounds before anything runs.',
    role: { kind: 'Solo' },
    stack: ['Rust', 'Type systems', 'Abstract interpretation', 'LLM inference'],
    live: 'https://veer-lang.vercel.app',
    code: 'https://github.com/veermshah/veer',
    extra: [
      { label: 'Docs site source', href: 'https://github.com/veermshah/veer-site' },
      { label: 'Release binaries', href: 'https://github.com/veermshah/veer-site/releases' },
    ],
    problem:
      'Agents, RAG pipelines and tree search are limited by KV-cache memory and prefill time. Serving engines guess at cache reuse, editing an agent’s history quietly re-prefills thousands of tokens, and the only way to know whether a quantized model is still accurate enough is to run evals. I wanted those costs to be visible in the program and checked by a compiler.',
    built: [
      'Contexts are linear values. Every operation (append, generate, fork, splice, speculate, drop) consumes its context, so leaks, use-after-free and ambiguous edits are compile errors.',
      'A static planner, written as an abstract interpreter over paged KV segments, proves upper bounds on peak KV bytes, prefill and decode tokens, context length and splice re-prefill cost. `@budget(kv = 2GiB, prefill = 12000)` is a compile-time contract.',
      'Precision types carry a proven error bound through quantization, matmul and activations across FP8, INT8, MXFP4 and NVFP4, so `@accuracy(rel <= 0.25)` is also checked at compile time.',
      'A six-crate Rust workspace: parser and diagnostics, bit-exact quantization simulators, type checker, planner, a runtime with a simulated engine and an OpenAI-compatible HTTP engine, and the `veer` CLI (`check`, `plan`, `run`, `types`, `explain`).',
    ],
    results: [
      'v0.1.0 released with binaries for macOS (arm64, x64), Windows (x64, MSI) and Linux (x64, arm64), plus shell and PowerShell installers.',
      'The test suite includes soundness property tests for the planner and error-bound algebra, and every program in the docs is compiled in CI.',
    ],
    images: [{ file: 'site.webp', alt: 'The Veer documentation site home page', caption: 'Docs and downloads at veer-lang.vercel.app' }],
  },
  {
    slug: 'wander',
    title: 'Wander',
    pitch:
      'Indoor navigation for blind and low-vision people: a chest-worn iPhone, a scanned 3D map of the building, and a voice guide.',
    context: 'Hack the North 2026',
    role: {
      kind: 'Team',
      size: 4,
      mine: 'navigation backend, agent tools, Modal pipeline, assistant chat',
    },
    stack: ['Swift', 'ARKit', 'Python', 'FastAPI', 'Modal', 'Next.js', 'OpenAI', 'Elasticsearch'],
    live: 'https://wander-htn.vercel.app',
    code: 'https://github.com/veermshah/hackthenorth',
    extra: [{ label: 'Devpost', href: 'https://devpost.com/software/wander-hlqxz2' }],
    problem:
      'GPS stops at the door. A white cane finds the ground in front of you, but it can’t say which hallway leads to room 3B. We wanted to add the layer the cane was never meant to cover, and let someone you trust help from anywhere.',
    built: [
      'A sighted helper scans the building once. The scan becomes a Gaussian splat for the web app and a Niantic VPS map that the phone localizes against. The backend proposes a walkable waypoint graph from the mesh, and the helper reviews and publishes it.',
      'The wearer talks to a voice agent (“guide me to room 101”). The model decides what to do; routing is plain A* over the waypoint graph, so no position or path ever comes from a model. Obstacle detection runs on the phone with LiDAR and never touches the network.',
      'My part was mostly the backend. I wrote the first version of the FastAPI navigation backend with the OpenAI Responses agent and its function tools, and the Elasticsearch retrieval layer behind it. I automated the Modal scan pipeline, added self-hosted visual localization and Gaussian splat training on Modal, and set up CI that tests the backend and deploys to Modal when main is green.',
      'In the web app I built the Ask tab: a streaming chat with the building assistant that grounds “what’s in view” in the web camera and has a mobile voice-call mode. I also made detected scene objects turn into searchable note pins.',
      'Caleb Bae led the web app, Alan Roybal led the iOS app and the Niantic SDK integration, and Ayro Escobar built the marketing site.',
    ],
    results: [
      'Built by four people in one weekend; the helper web app is live.',
      'End to end: scan, align, propose the graph, publish, localize at about 5 Hz, route, and speak cues while walking.',
    ],
    images: [
      { file: 'site.webp', alt: 'The Wander landing page', caption: 'wander-htn.vercel.app' },
      { file: 'architecture.webp', alt: 'Architecture diagram: chest-worn iPhone, Niantic VPS, FastAPI backend on Modal, OpenAI, Elasticsearch, Next.js web app', caption: 'Architecture' },
    ],
  },
  {
    slug: 'cambrian',
    title: 'Cambrian',
    pitch:
      'A self-evolving swarm of DeFi trading agents on Solana and Base, written in Go: losing agents are killed, profitable ones reproduce with mutated strategies.',
    role: { kind: 'Solo' },
    stack: ['Go', 'Solana', 'Base', 'PostgreSQL', 'Redis', 'Gin', 'LLM APIs', 'Docker'],
    code: 'https://github.com/veermshah/Cambrian',
    problem:
      'Yield strategies go stale and are tedious to babysit. I wanted to test whether an evolutionary setup could manage itself: many small agents, capital flowing to the ones that make money after their own LLM and infrastructure costs, and mutated copies of the winners, with hard guardrails and devnet only until it proves stable.',
    built: [
      'Each agent is a genome: a task (yield rotation, liquidity provision, liquidation hunting or momentum), a chain, an LLM strategist with its own prompt and model, and economic parameters. A fast deterministic loop trades, with a Thompson-sampling bandit; a slow LLM loop tunes the config.',
      'Once an epoch, an orchestrator settles every agent’s books, kills or pauses the losers, and lets profitable agents reproduce by mutation or crossover. Offspring pass a solvency check, an LLM quality check, an adversarial bull/bear review and a backtest before they get capital.',
      'The LLM never builds transactions. A security layer validates every transaction against per-chain allowlists and encrypts keys with AES-256-GCM. Agents share signals over Redis, weighted by each agent’s track record.',
      'One Go process boots everything: Postgres migrations, chain clients (Jupiter, Kamino and marginfi on Solana; 1inch, Aave and Morpho on Base), a REST and WebSocket API, Telegram alerts and a monthly budget cap.',
    ],
    results: [
      '637 passing tests and subtests across 17 packages, `go vet` clean, in CI on every push.',
      '18 acceptance suites pass (evolution, bandit convergence, budget, transaction validation and more); 5 live suites are waiting on a full devnet run, so there are no trading results yet.',
    ],
    images: [{ file: 'architecture.webp', alt: 'Cambrian architecture: swarm runtime, per-agent loops, orchestrator, chain and security layers, Postgres and Redis', caption: 'Architecture, from the repo README' }],
  },
  {
    slug: 'kaggle-agent',
    title: 'kaggle-agent',
    pitch:
      'An autonomous agent for Kaggle competitions: it profiles the data, freezes validation, runs experiments for hours, and submits only with my approval.',
    role: { kind: 'Solo' },
    stack: ['Python', 'LightGBM', 'XGBoost', 'CatBoost', 'Optuna', 'PyTorch', 'SQLite', 'Streamlit'],
    code: 'https://github.com/veermshah/kaggle-agent',
    problem:
      'Most of the work in a tabular competition is careful bookkeeping: a validation scheme you don’t quietly break, experiments you can compare, and submissions you don’t waste. I wanted an agent to do the grinding while keeping the decisions that can go wrong (rules, submissions) with me.',
    built: [
      'Onboarding pulls metadata from the Kaggle API, profiles the files, detects the task and submission format, and runs integrity checks: target leakage, duplicates, train/test overlap and adversarial validation for distribution shift.',
      'The validation scheme is chosen from the data and frozen. Folds are hashed, scores are only compared within one validation version, and a 10% holdout is hidden from every listing and agent.',
      'A scheduler daemon keeps one GPU job and several CPU jobs running. A bandit over experiment “arms” (baselines, Optuna tuning, feature recipes, ensembling, calibration, seed bagging) picks what to try next. All state is in SQLite, so the loop survives restarts.',
      'Submissions are prepared and validated automatically but need approval from an interactive terminal.',
    ],
    results: [
      'Tabular classification and regression are complete; image classification has a working GPU training adapter.',
    ],
    images: [],
  },
  {
    slug: 'dishbrain-playground',
    title: 'DishBrain Playground',
    pitch:
      'A thousand simulated spiking neurons on a virtual electrode array play Pong in the browser. The paper’s feedback teaches them nothing; feedback the network can switch off itself does.',
    role: { kind: 'Solo' },
    stack: ['TypeScript', 'Vite', 'Canvas', 'Vitest', 'Statistics'],
    live: 'https://veermshah.github.io/dishbrain-playground/',
    code: 'https://github.com/veermshah/dishbrain-playground',
    problem:
      'In 2022 Kagan et al. connected cultured neurons to Pong and reported that cultures given predictable feedback after hits and unpredictable noise after misses rallied longer over time. I wanted to know whether plain spike-timing-dependent plasticity in a generic spiking network is enough to produce that.',
    built: [
      '1000 Izhikevich neurons (80% excitatory) with STDP, sitting under an 8×8 virtual electrode array with sensory and motor regions, place and rate coding for the ball, and a population-rate decoder for the paddle.',
      'The paper’s feedback protocol (a predictable burst after a hit, 4 s of random stimulation after a miss) plus three ablations that change only what follows a miss: predictable, unpredictable and silent.',
      'Two candidate mechanisms as extra modes: stimulation avoidance (stimulation that stops within 1 ms once the paddle steers toward the ball) and reward-modulated STDP with eligibility traces, each with a matched control.',
      'A browser playground with a live raster, electrode map and rally curves with 95% confidence bands, plus a headless `npm run experiment` that runs paired seeds and Mann-Whitney U tests.',
    ],
    results: [
      'Paper protocol, 12 paired seeds, 20 simulated minutes each: no learning. Rally length stayed near 0.3 hits per rally, the same as with plasticity off (DishBrain vs silent, p = 0.30). STDP links spikes about 20 ms apart, and the feedback arrives seconds later regardless of what the network did.',
      'Stimulation avoidance, on held-out seeds after tuning only on separate dev seeds: the correct sensory-to-motor wiring formed (mapping index 0.75 vs 0.01 with STDP off, p < 0.001) and late rallies beat the STDP-off control on 10 of 12 seeds (p = 0.002). The gain is real but modest: median late rally 0.56 vs about 0.35.',
      'Reward-modulated STDP did not beat its shuffled-reward control (p = 0.53). Each reward nudges about 64,000 synapses and a session has only about 230 rewards. I report both nulls as they came out.',
    ],
    images: [
      { file: 'playground.webp', alt: 'DishBrain Playground: the Pong game next to a spike raster and electrode map', caption: 'The playground in the browser' },
    ],
  },
  {
    slug: 'jev-calibration-lab',
    title: 'Jev Calibration Lab',
    pitch:
      'An independent benchmark that checks whether a decision model’s probabilities match human labels, against frontier LLMs and a cheap baseline.',
    role: { kind: 'Solo' },
    stack: ['Python', 'scikit-learn', 'Calibration metrics', 'GitHub Pages'],
    live: 'https://veermshah.github.io/jev-calibration-lab/',
    code: 'https://github.com/veermshah/jev-calibration-lab',
    extra: [{ label: 'Report', href: 'https://github.com/veermshah/jev-calibration-lab/blob/main/report/report.md' }],
    problem:
      'TypeSafe’s Jev returns decisions with a probability attached and is trained for calibration, but its published benchmark defines ground truth as the average of two frontier LLMs. That measures agreement with those LLMs, not whether a 0.8 is right 80% of the time against people. I couldn’t find an independent check, so I wrote one.',
    built: [
      'Five public datasets labeled by people (SST-2, BoolQ, LIAR, banking77, SMS Spam), 300 fixed-seed evaluation items each.',
      'One interface for every model arm: Jev, Claude Haiku and Sonnet with stated probabilities through structured output, and a TF-IDF logistic regression floor. New models are a config entry.',
      'Metrics: accuracy, ECE and adaptive ECE, Brier, NLL, reliability diagrams, risk-coverage curves, latency, cost per 1,000 decisions, and post-hoc recalibration baselines. Results publish to a static leaderboard.',
    ],
    results: [
      'The harness is complete; real Jev and Claude runs are waiting on API keys. Their numbers on the leaderboard come from labeled synthetic generators, not from the APIs.',
      'Real baseline numbers: TF-IDF logistic regression reaches 0.807 accuracy on SST-2 and 0.967 on SMS Spam, and is underconfident on banking77, where temperature scaling cuts ECE from 0.119 to 0.038.',
    ],
    images: [
      { file: 'site.webp', alt: 'The calibration leaderboard page', caption: 'The leaderboard. Jev and Claude rows are synthetic until the real runs happen.' },
    ],
  },
  {
    slug: 'wetware-emulator',
    title: 'Wetware Emulator',
    pitch:
      'A simulated cortical culture on a virtual multi-electrode array, with an SDK, HTTP API and live dashboard for prototyping biocompute experiments without a wet lab.',
    role: { kind: 'Solo' },
    stack: ['Python', 'NumPy', 'HDF5', 'HTTP API', 'pytest', 'mypy'],
    live: 'https://veermshah.github.io/wetware-emulator/',
    code: 'https://github.com/veermshah/wetware-emulator',
    problem:
      'Living neurons on electrode arrays can now be reached over the internet, but access is scarce and slow, and I don’t have a wet lab. I wanted somewhere to write and debug a whole experiment first (stimulation protocol, closed loop, analysis, file handling) against something that fails the way a real culture does.',
    built: [
      'A NumPy simulation core: Izhikevich neurons placed in 2D, distance-dependent wiring, short-term plasticity, STDP and spontaneous bursts.',
      'A virtual MEA that turns spikes into extracellular signals with noise, stimulation artifacts and blanking, plus biphasic stimulation that raises on unsafe waveforms instead of clipping them.',
      'Closed loops on the simulation clock, culture aging (neurons and electrodes die), HDF5 export, YAML protocols, an HTTP server with a matching client, and a live browser dashboard.',
    ],
    results: [
      'A 1000-neuron culture runs about 15× faster than real time on one laptop core.',
      'Frequency tuning: the evoked response falls from 14.8 spikes per pulse at 1 Hz to 2.9 at 10 Hz and 0.4 at 80 Hz, from synaptic depression.',
      'Closed-loop Pong, 6 cultures per condition: no learning (0.57 hits per rally with feedback, 0.48 without). I kept it as an example of wiring a closed loop, not as evidence the model learns.',
    ],
    images: [
      { file: 'dashboard.webp', alt: 'Live dashboard with an electrode heatmap, spike raster and firing rate', caption: 'The live dashboard' },
      { file: 'frequency_tuning.webp', alt: 'Plots of evoked response against stimulation frequency and amplitude', caption: 'Frequency tuning example' },
    ],
  },
  {
    slug: 'organoid-reservoir',
    title: 'Organoid Reservoir',
    pitch:
      'Brainoware-style reservoir computing on a simulated organoid, benchmarked against an echo state network and an LSTM.',
    role: { kind: 'Solo' },
    stack: ['Python', 'NumPy', 'PyTorch', 'scikit-learn'],
    code: 'https://github.com/veermshah/organoid-reservoir',
    extra: [{ label: 'Full report', href: 'https://github.com/veermshah/organoid-reservoir/blob/main/report.md' }],
    problem:
      'In 2023 Cai et al. used a human brain organoid as the reservoir in a reservoir computer and reported vowel recognition and chaotic time-series prediction. I wanted to see how much of that a simulated organoid-like network reproduces, and how it compares with standard reservoirs when the encoding, readout and data splits are held fixed.',
    built: [
      '400 Izhikevich neurons wired inside a sphere with distance-dependent connections, background noise, optional NMDA-like synapses and STDP.',
      'A virtual electrode array on the surface that encodes inputs as pulse trains or DC current; only a linear readout is trained.',
      'Tasks: Japanese Vowels speaker recognition, Hénon, NARMA-10, Mackey-Glass and memory capacity. Baselines: ESN, LSTM, logistic regression and linear autoregression. Ablations on STDP, size, stimulation type and noise.',
    ],
    results: [
      'Vowels: 0.965 accuracy for the spiking reservoir vs 0.981 for the ESN and 0.991 for logistic regression on resampled features (5 seeds).',
      'Memory capacity is about 0.6 vs 10.1 for the ESN, so it does poorly on time series that need history. STDP moves vowels accuracy by about half a point, inside seed noise.',
      '`make reproduce` regenerates every number and figure in about 13 minutes on a laptop CPU.',
    ],
    images: [
      { file: 'reservoir_3d.webp', alt: '3D plot of neurons inside a sphere with electrodes on the surface', caption: 'The simulated organoid and its electrodes' },
      { file: 'vowels_accuracy.webp', alt: 'Bar chart comparing vowel recognition accuracy across models', caption: 'Japanese Vowels accuracy by model' },
    ],
  },
  {
    slug: 'adaptrees',
    title: 'Adaptrees',
    pitch:
      'A C++20 B+tree for variable-length keys, after the SIGMOD 2025 paper “B-Trees Are Back”. Up to 2× faster inserts than a textbook B+tree.',
    context: 'CS 6360, Database Design',
    role: { kind: 'Solo' },
    stack: ['C++20', 'CMake', 'Benchmarking'],
    code: 'https://github.com/veermshah/Adaptrees',
    problem:
      'B-trees with variable-length keys (URLs, titles) waste space and comparisons when nodes store full keys. Müller, Benson and Leis showed that careful node layout closes much of the gap to in-memory structures while keeping pages pageable. I implemented their main techniques to measure them myself.',
    built: [
      'Fixed 4 KB slotted pages with 16-byte slots, static per-node prefix truncation, 4-byte key heads for fast comparison, and a 16-entry hint array to narrow binary search.',
      'Iterative descent with a fixed path stack and a fast path for ascending inserts.',
      'A plain baseline B-tree used as a correctness oracle, synthetic integer, URL and Wikipedia-title datasets, and insert, point-lookup and range-scan benchmarks.',
    ],
    results: [
      'At 1M keys on an Apple M5 Pro (median of 5 runs): 1.3–2.0× faster inserts and 1.2–1.6× faster point lookups than the baseline B+tree.',
      'The gains are largest on long shared-prefix keys: Wikipedia-title inserts run 2.04× faster, URL lookups 1.56×.',
      'Range scans over short integer keys are slower (0.70×) because each row rebuilds the full key into a new string; returning suffix views would likely fix it.',
      'Lookup and scan checksums match the baseline on every dataset.',
    ],
    images: [{ file: 'benchmark.webp', alt: 'Bar charts of throughput for adaptive and baseline B-trees on integer, URL and Wikipedia keys', caption: 'Throughput at 1M keys, million operations per second' }],
  },
  {
    slug: 'destina',
    title: 'Destina',
    pitch:
      'A party game for a table of friends: a robot suggests challenges, a Vision Pro game master approves them, and scores and badges live on Solana.',
    award: 'Meta track 3rd place, HackTX 2026',
    context: 'HackTX 2026',
    role: { kind: 'Team', size: 4, mine: 'Solana program, badge firmware and NFC tooling, WebSocket relay' },
    stack: ['Solana', 'Anchor', 'Rust', 'C++', 'ESP32', 'Raspberry Pi', 'WebSockets', 'React'],
    code: 'https://github.com/veermshah/hacktx_26',
    extra: [
      { label: 'Devpost', href: 'https://devpost.com/software/destina' },
      { label: 'My pull requests', href: 'https://github.com/Dhivyeshp/hacktx_26/pulls?q=is%3Apr+author%3Aveermshah' },
    ],
    problem:
      'Players at a table join from their phones, tap physical relic chips to get prompts, and a game master on Vision Pro runs the round. The hardware, the phones, the headset and the chain all had to agree on game state in real time.',
    built: [
      'Tina, a tabletop robot, listens to the room and suggests challenges built around what the group has in common. Players join by scanning Tina’s QR code and open challenges by tapping NFC “relic” chips. Elijah Walker built the web app and Meta AI pipeline, Arnav Vedula the Vision Pro game master, and Dhivyesh Prithiviraj the robot controls.',
      'I wrote the Solana program: an Anchor program on Token-2022, deployed to devnet, with a table coin, soulbound player badges whose level and achievements update on chain, round attestations with capped, double-pay-proof awards, kudos, a shop that burns coin, a shared table goal and keepsake NFTs. A chain service on Render and a browser SDK expose it to the web app.',
      'I also wrote the ESP32-C3 firmware that turns the Hack the North badge into Tina’s animated face and reads and writes NFC relic tags (refusing to write with two tags in the field, targeting by UID, batch programming), the Raspberry Pi tooling that drives it, and the WebSocket relay between the Pi, the Vision Pro and the game hub.',
    ],
    results: ['Meta track, 3rd place at HackTX 2026.', 'Seven merged pull requests from me covering the chain, relay and badge work. The program is live on devnet at `DqqLyrxUPAiJ2m3Fu4uLL6GirTH2cSXXS9wJHmGngaZX`.'],
    images: [{ file: 'architecture.webp', alt: 'Destina architecture: web app, Vision Pro, Raspberry Pi, ESP32 badges and Solana devnet', caption: 'Architecture' }],
  },
  {
    slug: 'quantumloans',
    title: 'QuantumLoans',
    pitch: 'Overcollateralized crypto lending: borrow cash against BTC or ETH without selling it, and track loan health with live market data.',
    award: 'Winner, Fintech Hackathon Challenge, HackFin 2024',
    context: 'HackFin 2024',
    role: { kind: 'Team', size: 3, mine: 'Landing, Lend, Borrow and Crypto Health pages, the AI risk chat, most of the UI' },
    stack: ['React', 'Vite', 'Tailwind', 'Flask', 'Solidity', 'Hardhat', 'MetaMask SDK'],
    live: 'https://quantumloans.vercel.app',
    code: 'https://github.com/veermshah/QuantumLoans',
    extra: [
      { label: 'Devpost', href: 'https://devpost.com/software/quantumloans' },
      { label: 'Demo video', href: 'https://www.youtube.com/watch?v=nQ28joUHcSc' },
    ],
    problem:
      'Selling crypto to get cash triggers taxes and gives up the position. An overcollateralized loan lets you borrow against more collateral than you take out, with liquidation if the collateral falls too far.',
    built: [
      'Borrow against BTC or ETH with live CoinGecko prices, loan-to-value and the rate shown before you commit. Lend tokens for a fixed term at a rate that rises with the amount. A dashboard with wallet assets, a TradingView chart and transaction history, and MetaMask connection.',
      'Crypto Health scores an asset from its market data and opens a chat that explains the risk in plain language.',
      'My part: the Landing, Lend, Borrow and Crypto Health pages, the AI risk chat, and most of the UI. Alan Roybal built the navbar, dashboard, wallet assets and transaction history; Viswa Kotra built the Flask backend, the protocol model and the Solidity contract that supplies ETH to Compound and borrows USDC.',
    ],
    results: [
      'Won the Fintech Hackathon Challenge at HackFin 2024.',
      'Top contributor on the team (14 of 36 commits).',
      'The hosted demo runs in a labeled demo mode: the backend isn’t hosted, so lend, borrow and history are answered in the browser by a port of its logic. Market data is live.',
    ],
    images: [
      { file: 'borrow.webp', alt: 'Borrow page with live Bitcoin price, loan-to-value and the resulting transaction', caption: 'Borrow' },
      { file: 'home.webp', alt: 'QuantumLoans home page', caption: 'Home' },
    ],
  },
  {
    slug: 'firelens',
    title: 'FireLens',
    pitch:
      'Building-level wildfire damage assessment: Gemini compares pre- and post-fire satellite crops of every building, and the results go on a map with a chat assistant.',
    context: 'CS 4485 capstone, UT Dallas',
    role: { kind: 'Team', size: 6, mine: 'dashboard UI, chatbot integration, live evaluation endpoint, deploys' },
    stack: ['Next.js', 'Mapbox GL', 'FastAPI', 'Gemini', 'Cloudflare R2', 'Vercel', 'Render'],
    live: 'https://firelens-umber.vercel.app',
    code: 'https://github.com/veermshah/CS4485-Capstone',
    problem:
      'After a wildfire, responders and insurers need to know which buildings are gone, which are damaged and which are fine, and much of that is still people comparing aerial photos one building at a time. We tested how far a general-purpose vision-language model gets on that comparison with no task-specific training.',
    built: [
      'A pipeline that crops every building footprint from the xBD Santa Rosa wildfire tiles before and after the fire, and asks Gemini for a damage level, confidence and short reason as strict JSON.',
      'A Next.js and Mapbox dashboard with pre/post imagery layers, footprints colored by predicted damage, a building inspector with the model’s label next to the FEMA label, metrics, and a chat assistant grounded in the results and the current map view. A FastAPI backend serves chat and live evaluation; data lives in Cloudflare R2.',
      'My part (top committer): I built the first dashboard UI (map panel, building list, details drawer, filters), set up the Vercel and Render deployments, added building flagging, summaries and street addresses, integrated the chatbot into the backend and dashboard, added the live `/v1/evaluate` endpoint and rate-limit handling, and fixed the map and pre/post layer rendering.',
    ],
    results: [
      'Zero-shot on 4,214 labeled buildings: 81.6% accuracy. No-damage F1 is 0.89.',
      'When the model calls a building destroyed it is right 74% of the time, but it finds only 47% of destroyed buildings. The minor and major damage classes (28 buildings) are too rare to say anything about.',
      'The live demo’s data backend is currently down, so the map on the live site may be empty. The screenshot is from the repo.',
    ],
    images: [{ file: 'dashboard.webp', alt: 'FireLens dashboard with the map, building list, damage filters and assistant', caption: 'The dashboard (screenshot from the repo)' }],
  },
  {
    slug: 'habla',
    title: 'Habla',
    pitch: 'A Spanish tutor you talk to, in the browser or on a scheduled phone call, that writes reading lessons at your level and remembers you.',
    role: { kind: 'Solo' },
    stack: ['Next.js', 'TypeScript', 'Supabase', 'pg_cron', 'ElevenLabs', 'Twilio', 'Gemini'],
    live: 'https://habla-two.vercel.app/',
    code: 'https://github.com/veermshah/spAInish',
    problem:
      'Apps teach vocabulary, but speaking is the hard part, and practice with a person is expensive or awkward. I wanted a tutor that talks, remembers what you struggled with, and calls you.',
    built: [
      'Voice practice with an ElevenLabs conversational agent on the page, or as an outbound phone call through Twilio. Calls can be scheduled daily, on weekdays or weekly in your timezone; an hourly pg_cron job in Supabase triggers them.',
      'Every conversation is saved with its transcript and audio. Memories you add (your job, a trip) go into the agent’s knowledge base so the tutor brings them up later.',
      'Reading lessons: Gemini writes a 300 to 500 word article at your level, read aloud with word highlighting from timestamped TTS. You write a summary that Gemini grades on accuracy, grammar, vocabulary and coherence, then take a generated quiz.',
      'Supabase auth, a streak dashboard computed in Postgres functions, and analytics over lesson attempts.',
    ],
    results: ['Deployed on Vercel and usable end to end: sign up, practice by voice or phone, take lessons, track streaks.'],
    images: [{ file: 'landing.webp', alt: 'Habla landing page with a 3D globe', caption: 'Landing page' }],
  },
  {
    slug: 'hack-stash',
    title: 'Hack Stash',
    pitch:
      'A getaway driving game through downtown San Antonio, steered with your hands, where each landmark vault opens a challenge on real hardware or a phone call.',
    context: 'RowdyHacks 2026',
    role: {
      kind: 'Team',
      size: 4,
      mine: 'the Alamo vault challenge (Arduino and Raspberry Pi relay, servo, LCD, sensor protocol, server logic and tests), the Render and Vercel deployment, and the architecture diagram',
    },
    stack: ['Python', 'Flask-SocketIO', 'Raspberry Pi', 'Arduino', 'React Three Fiber', 'MediaPipe'],
    live: 'https://sa-night-drive.vercel.app',
    code: 'https://github.com/veermshah/rowdyhacks',
    extra: [{ label: 'Devpost', href: 'https://devpost.com/software/hackstash' }],
    problem:
      'We wanted a heist game that used real San Antonio streets, needed no controller, and spilled out of the browser: each landmark vault opens a challenge on physical hardware or a real phone call.',
    built: [
      'The game: a React Three Fiber city built from OpenStreetMap, MediaPipe hand steering, and a police car that chases you on the same A* road graph used for navigation. Jagadeep Kalluri built the driving game; Ishita Saran built the Riverwalk face-scan challenge, and Dhivyesh Prithiviraj the Tower of the Americas phone-call challenge.',
      'My part was the Alamo vault, end to end: a Simon-says puzzle against a physical rig, where a Raspberry Pi relays an Arduino’s light sensor, joystick, LCD and vault-door servo to the Flask-SocketIO game server. I wrote the relay, the sensor protocol, the server logic and its tests.',
      'I also set up the Render and Vercel deployment and drew the architecture diagram.',
    ],
    results: [
      'Top committer on the repo (41 of 94 commits).',
      'The driving game is live. The vault challenges needed the game server and hardware, which ran on-site, so the hosted version shows “heist server offline” inside each challenge.',
    ],
    images: [
      { file: 'landing.webp', alt: 'Hack Stash start screen', caption: 'Start screen' },
      { file: 'architecture.webp', alt: 'Architecture: browser game, Flask-SocketIO server, Raspberry Pi and Arduino rig, face-scan and phone-call challenges', caption: 'Architecture' },
    ],
  },
  {
    slug: 'hack-odds',
    title: 'Hack Odds',
    pitch: 'A free-to-play prediction market for hackathons on Solana: trade in-app credits on outcomes, settled on devnet.',
    context: 'HackSMU 2026',
    role: { kind: 'Solo' },
    stack: ['Solana', 'Anchor', 'Rust', 'Next.js', 'TypeScript', 'Supabase', 'Gemini'],
    live: 'https://hackodds.vercel.app',
    code: 'https://github.com/veermshah/hacksmu26',
    extra: [
      { label: 'Devpost', href: 'https://devpost.com/software/hackodds' },
      { label: 'Program on Solana Explorer', href: 'https://explorer.solana.com/address/5L1zpnbgDyqcWeqKXp3cBmxhZ3kkX9GmsuZuajSxwme5?cluster=devnet' },
    ],
    problem:
      'Hackathons are full of guesses: will submissions pass 120, which track gets the most entries. I wanted to see what a small market for those questions takes when the chain, not a database, is the source of truth, with no real money involved.',
    built: [
      'An Anchor program with eight instructions (config, market and outcome setup, buy, sell, close, resolve, claim), PDAs per market, outcome and position, and a token vault per market. Prices follow a deterministic linear curve and all arithmetic is checked.',
      'A Next.js app with wallet adapters and a demo wallet, a server-side faucet for the devnet token, portfolio and leaderboard pages linked to Solana Explorer, and Supabase as a cache for search and the activity feed.',
      'Gemini drafts a market from one sentence against a JSON schema, and the draft is validated before it can be published.',
    ],
    results: ['Live on Vercel against the devnet program `5L1zpnbgDyqcWeqKXp3cBmxhZ3kkX9GmsuZuajSxwme5`, with Anchor integration tests and Vitest tests for odds and market drafts.'],
    images: [
      { file: 'home.webp', alt: 'Hack Odds home page', caption: 'Home' },
      { file: 'markets.webp', alt: 'Markets list with binary and multi-outcome markets', caption: 'Markets' },
    ],
  },
  {
    slug: 'chainfund',
    title: 'ChainFund',
    pitch: 'All-or-nothing crowdfunding on Ethereum: creators withdraw only if the goal is met, and backers can reclaim their ETH if it isn’t.',
    context: 'Blockchain course project, UT Dallas',
    role: { kind: 'Team', size: 2, mine: 'the Solidity contract and its tests, the Sepolia deployment, and wiring the frontend to the chain' },
    stack: ['Solidity', 'Hardhat', 'viem', 'wagmi', 'Next.js', 'TypeScript', 'Tailwind'],
    live: 'https://chainfunded.vercel.app',
    code: 'https://github.com/veermshah/CrowdfundingDapp',
    extra: [
      { label: 'Contract on Etherscan (Sepolia)', href: 'https://sepolia.etherscan.io/address/0xe0B93a16313F71B77A73de546557F6483e20B408' },
    ],
    problem:
      'On a normal crowdfunding site the platform holds the money and decides when the creator gets it. We wanted the rules themselves (the goal, the deadline, who can take the money out and when) to be enforced by a contract anyone can read.',
    built: [
      'A Solidity contract where anyone can create a campaign with a goal and deadline. Contributions are tracked per backer. The creator can withdraw once, and only after the goal is reached; if the deadline passes short of the goal, each backer can pull back exactly what they put in. State is updated before ETH is sent, so a second withdraw or refund reverts.',
      'Thirteen Hardhat tests cover the happy paths and every revert: contributing after the deadline, withdrawing early, withdrawing twice, a non-creator withdrawing, and refunds when the goal was met, the campaign is still open, or the caller never contributed.',
      'My part: the contract, the tests, the Sepolia deployment with Hardhat Ignition, and connecting the Next.js app to the chain with wagmi and viem: wallet connection, create and contribute flows, and campaign history read from the contract’s events. Casey Nguyen built the first version of the web UI.',
    ],
    results: [
      'Live on Vercel against the Sepolia contract `0xe0B93a16313F71B77A73de546557F6483e20B408`, with real test-ETH campaigns, backers and USD conversions from CoinGecko.',
    ],
    images: [
      { file: 'explore.webp', alt: 'ChainFund explore page listing three on-chain campaigns with goals, amounts raised and funding progress', caption: 'Campaigns read from the Sepolia contract' },
      { file: 'home.webp', alt: 'ChainFund home page with a featured campaign and totals raised', caption: 'Home' },
    ],
  },
  {
    slug: 'ebby',
    title: 'Ebby',
    pitch: 'A student well-being app: an AI health assistant, anonymous peer support groups, and webcam exercise tracking that counts your reps.',
    award: 'OIT Track winner and MLH Best Use of PropelAuth, HackSMU VI',
    context: 'HackSMU VI (2024)',
    role: { kind: 'Team', mine: 'the Next.js app, PropelAuth login, the design, the support-groups flow and questionnaire, and the exercise pages' },
    stack: ['Next.js', 'TypeScript', 'Tailwind', 'PropelAuth', 'TalkJS', 'Flask-SocketIO', 'MediaPipe', 'OpenAI'],
    code: 'https://github.com/sachi-jh/hacksmu',
    extra: [{ label: 'Devpost', href: 'https://devpost.com/software/ibm-please-hire-us' }],
    problem:
      'Students juggle mental and physical health on their own, and campus resources are scattered across pages nobody reads. We wanted one place to ask questions, find people going through the same thing, and keep moving.',
    built: [
      'Ebby, a chat assistant for wellness questions. Peer support groups: a short questionnaire recommends groups, and members chat anonymously through TalkJS. Exercise tracking: the webcam stream goes over a WebSocket to a Flask server that uses MediaPipe pose landmarks and joint angles to count squats and bends.',
      'My part (top committer): I set up the Next.js app and its design system, added PropelAuth login and route protection, built the questionnaire and the support-groups pages (group recommendations, joining, and the anonymous TalkJS group chat), and reworked the exercise pages and rep-counter UI. Caleb Bae built the pose-detection server and sachi-jh the chat assistant.',
    ],
    results: [
      'Won the OIT Track and MLH’s Best Use of PropelAuth at HackSMU VI.',
      'We also scraped university resources into a retrieval index for the assistant, but didn’t get it wired into the frontend before judging.',
    ],
    images: [
      { file: 'landing.webp', alt: 'Ebby landing page: “Welcome to Ebby, your personal health secretary” above an animated wave', caption: 'Landing page' },
      { file: 'groups.webp', alt: 'Recommended support groups with cards to join depression, anxiety, stress and anger management groups', caption: 'Support groups recommended from the questionnaire' },
    ],
  },
  {
    slug: 'moneyplant',
    title: 'Moneyplant',
    pitch: 'A robo-advisor that turns a risk questionnaire into a sector portfolio, using LSTM forecasts as the views in a Black-Litterman model.',
    award: 'Third place, PIMCO Challenge, TAMUhack X',
    context: 'TAMUhack X (2024)',
    role: { kind: 'Team', mine: 'the React app, the Django REST backend and login, and the risk questionnaire' },
    stack: ['React', 'Django REST Framework', 'Python', 'Keras', 'Black-Litterman', 'IBM watsonx'],
    code: 'https://github.com/veermshah/TAMUhacks',
    extra: [
      { label: 'Devpost', href: 'https://devpost.com/software/moneyplant-vjar92' },
      { label: 'Demo video', href: 'https://www.youtube.com/watch?v=qsREk5vVNe8' },
    ],
    problem:
      'PIMCO’s challenge asked for a robo-advisor. Big firms automate allocation for their clients; we wanted a version anyone could use, which starts from how much risk you can stomach rather than from a ticker list.',
    built: [
      'A risk-tolerance questionnaire sets the investor’s risk aversion. An LSTM trained on historical prices forecasts each of the 11 S&P sectors, and those forecasts become the views in a Black-Litterman model that starts from a near-equal prior and ten years of sector covariance. The output is a set of sector weights.',
      'A React app with the questionnaire, a portfolio page with allocation charts and a TradingView chart, a watsonx Assistant chatbot, and breathing reminders to keep investing calm. A Django REST Framework backend with registration, JWT login and portfolio endpoints.',
      'My part: the whole React frontend, the Django backend and auth, and the questionnaire. Sourish Pasula built the LSTM and Black-Litterman optimizer, and Noel Emmanuel the portfolio API model.',
    ],
    results: [
      'Third place in the PIMCO Challenge at TAMUhack X.',
      'Built in 24 hours. In the submitted code the Advisor page’s call to the portfolio API is commented out, so the optimizer ran as its own script rather than end to end from the questionnaire.',
    ],
    images: [
      { file: 'home.webp', alt: 'Moneyplant home page with a jungle illustration and the watsonx chat assistant open', caption: 'Home, with the chat assistant' },
      { file: 'questionnaire.webp', alt: 'Risk tolerance questionnaire with multiple-choice questions about risk', caption: 'Risk tolerance questionnaire' },
    ],
  },
  {
    "slug": "jev-support-desk",
    "title": "Jev Support Desk",
    "pitch": "Developer-support tooling that routes tickets by confidence, prepares shift handoffs, and diagnoses API requests offline.",
    "role": {
      "kind": "Solo"
    },
    "stack": [
      "Python",
      "TypeSafe Jev",
      "CLI",
      "Evaluation"
    ],
    "code": "https://github.com/veermshah/jev-support-desk",
    "extra": [
      {
        "label": "Evaluation report",
        "href": "https://github.com/veermshah/jev-support-desk/blob/main/results/eval.md"
      }
    ],
    "problem": "Support queues mix judgment calls with rules about priorities, deadlines and escalation. I wanted to measure which decisions a model can handle and send uncertain cases to a person.",
    "built": [
      "One Jev request asks seven typed questions per ticket. Python handles priorities, SLAs and escalation, with a confidence gate before automatic routing.",
      "An offline request doctor checks API request shapes, authentication headers and error responses, then produces a reproduction command without the customer’s key.",
      "A CLI shares cached results across triage, shift handoff and evaluation commands."
    ],
    "results": [
      "On 36 synthetic labeled tickets, Jev routed 33 correctly (92%), versus 27 (75%) for keyword rules. At a 0.8 confidence threshold, 81% were auto-routed with no routing errors in that sample.",
      "This is a small synthetic evaluation, not a production accuracy estimate."
    ],
    "images": []
  },
  {
    "slug": "utdlang",
    "title": "UTDLang Compiler",
    "pitch": "A Java compiler front-end with a generated lexer and parser, an AST, scoped symbol tables and semantic type checking.",
    "role": {
      "kind": "Solo"
    },
    "stack": [
      "Java",
      "JFlex",
      "CUP",
      "Compilers"
    ],
    "code": "https://github.com/veermshah/CompilerProject",
    "problem": "A parser can recognize a program without knowing whether it makes sense. This project connects parsing to scoped name resolution and semantic checks.",
    "built": [
      "Lexer and parser specifications in JFlex and CUP build an abstract syntax tree.",
      "Symbol tables, type information and a semantic-analysis pass check programs after parsing.",
      "A Makefile regenerates the front-end and runs test drivers against sample programs and expected outputs."
    ],
    "results": [
      "The repository includes lexer, scanner and type-checking drivers, plus test inputs and expected semantic-analysis outputs."
    ],
    "images": []
  },
  {
    "slug": "midpoint",
    "title": "Midpoint",
    "pitch": "An AI group travel planner that brings friends’ preferences, budgets and schedules into one trip plan.",
    "context": "HackUPC 2025",
    "award": "MLH Best Use of MongoDB Atlas, HackUPC",
    "role": {
      "kind": "Team"
    },
    "stack": [
      "Next.js",
      "React",
      "Gemini",
      "Auth0",
      "MongoDB"
    ],
    "code": "https://github.com/veermshah/HackUPC",
    "extra": [
      {
        "label": "Devpost",
        "href": "https://devpost.com/software/a-wk0ple"
      }
    ],
    "problem": "Planning with friends means reconciling different budgets, schedules and ideas about where to go.",
    "built": [
      "A shared travel-planning experience that uses AI to recommend destinations and activities from the group’s preferences.",
      "A Next.js and React app with Gemini, Auth0 and MongoDB."
    ],
    "results": [
      "Won the MLH Best Use of MongoDB Atlas prize at HackUPC 2025."
    ],
    "images": [
      {
        "file": "cover.jpg",
        "alt": "Midpoint landing page: Plan your next trip with your friends"
      }
    ]
  },
  {
    "slug": "whatdoesdafoxsay",
    "title": "WhatDoesDaFoxSay",
    "pitch": "A playful reading companion for children with dyslexia, using speech, gaze and emotion-aware feedback.",
    "context": "HackUTA 7",
    "award": "MLH Best Use of Auth0, HackUTA 7",
    "role": {
      "kind": "Team"
    },
    "stack": [
      "Gemini",
      "ElevenLabs",
      "OpenFace",
      "MediaPipe",
      "Firebase"
    ],
    "code": "https://github.com/veermshah/hackuta25",
    "extra": [
      {
        "label": "Devpost",
        "href": "https://devpost.com/software/whatdoesdafoxsay"
      }
    ],
    "problem": "Reading practice can be frustrating for children with dyslexia. We built a companion designed to make that practice calmer and more playful.",
    "built": [
      "A reading companion combining speech with gaze and emotion-aware feedback.",
      "Gemini and ElevenLabs support the reading experience, alongside OpenFace, MediaPipe and Firebase."
    ],
    "results": [
      "Won MLH Best Use of Auth0 at HackUTA 7."
    ],
    "images": [
      {
        "file": "cover.jpg",
        "alt": "WhatDoesDaFoxSay introduction slide with its fox mascot and team credits"
      }
    ]
  },
  {
    "slug": "charity-clarity",
    "title": "Charity Clarity",
    "pitch": "A Solana donation-transparency prototype that gives donors a way to follow where their contributions go.",
    "context": "HackTheChains",
    "award": "GoDaddy and Solana prizes, HackTheChains",
    "role": {
      "kind": "Team",
      "mine": "React interface, Node.js and Express API, wallet integration, and donation charts"
    },
    "stack": [
      "React",
      "Solana",
      "Phantom Wallet",
      "Web3.js",
      "AWS"
    ],
    "code": "https://github.com/jeremiahboban/HackTheChains",
    "extra": [
      {
        "label": "Devpost",
        "href": "https://devpost.com/software/jeremiahisfat"
      }
    ],
    "problem": "Donors often have little visibility into how charities allocate their contributions. We explored a public transaction record as a way to make that flow easier to inspect.",
    "built": [
      "A donation platform built around recording contributions on Solana.",
      "A React interface with Phantom wallet integration and Web3.js."
    ],
    "results": [
      "Won GoDaddy Best Domain Name and a Solana prize at HackTheChains."
    ],
    "images": [
      {
        "file": "cover.jpg",
        "alt": "Charity Clarity project presentation"
      }
    ]
  },
  {
    "slug": "aerovision",
    "title": "Aerovision Pro Max",
    "pitch": "A gesture-controlled robotics prototype inspired by aircraft marshalling, built with computer vision and a Viam rover.",
    "context": "PennApps XXIV",
    "award": "Best Use of Viam Software in Robotics, PennApps",
    "role": {
      "kind": "Team"
    },
    "stack": [
      "Python",
      "OpenCV",
      "MediaPipe",
      "Viam"
    ],
    "code": "https://github.com/RCoder01/pennapps-xxiv",
    "extra": [
      {
        "label": "Devpost",
        "href": "https://devpost.com/software/wordle-wniql2"
      }
    ],
    "problem": "As autonomous and human-operated aircraft share space, familiar marshalling gestures offer an interface between people and machines. We explored the idea on a rover.",
    "built": [
      "A computer-vision prototype that interprets gestures using Python, OpenCV and MediaPipe.",
      "Viam rover integration to translate the gesture interface into a physical robotics demonstration."
    ],
    "results": [
      "Won Best Use of Viam Software in Robotics at PennApps XXIV."
    ],
    "images": [
      {
        "file": "cover.jpg",
        "alt": "Aerovision Pro Max robotics project presentation"
      }
    ]
  },
];

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);
