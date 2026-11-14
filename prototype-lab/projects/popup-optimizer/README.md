# Pop-Up Optimizer

An offline Dallas civic-service planning demo. Select health vans, food banks, or vaccine clinics, choose 1–10 stops and a 5–45 minute travel window, and receive ranked locations with coverage circles and plain-English explanations.

## Run

Python 3.10+ only; no installation, GPU, API key, model, paid service, or internet required.

```bash
cd projects/popup-optimizer
python app.py --port 8003
```

Open http://127.0.0.1:8003. Bind to another interface with `--host` if needed. The app serves all its assets locally. Do not expose this demonstration HTTP server to the public internet.

In a restricted sandbox that disallows socket binding, run:

```bash
python export_demo.py
```

Open `offline-demo.html` directly. It contains the default map and results; changing parameters requires the server. `python app.py --demo` emits the same default results as JSON without a server.

## Data provenance and method

`data.json` bundles 30 approximately positioned real Dallas-area neighborhood names. All population counts, low-income/uninsured/unvaccinated fractions, and nearby-clinic flags are **synthetic**, generated for this demo. No public API was used. No values are Census estimates. The SVG map is a geographic coordinate plot with a schematic Trinity River, not a street map. All recommendations are illustrative neighborhood points, not verified properties or accessible venues.

Weighted k-means uses population × (0.15 + service need fraction + 0.2 if no nearby clinic). Deterministic weighted farthest-first initialization and up to 60 Lloyd updates produce centers, which are snapped to unique sample locations. Stops are greedily ranked by incremental need-weighted coverage; each explanation also gives total and additional residents. Overall coverage and additional counts avoid double-counting. Need counts are rounded fractions of sample populations; overlapping need indicators are not additive.

Travel radius = minutes / 60 × 25 km/h / 1.3 detour factor; at 15 minutes this is 4.808 km. Distances use a Dallas-local geographic approximation. There is no traffic, transit, road routing, capacity constraint, venue check, fairness guarantee, or proof of a global optimum. Clustering is a practical placement heuristic rather than an exact maximum-coverage solver. Population is concentrated at the sample centers.

## Reproduce demo and verification

```bash
python smoke.py
python app.py --demo > results.json
```

Default health/5-stop run covers **96,805 of 269,985 synthetic residents**. These numbers demonstrate computation and do not measure Dallas service coverage. Smoke verification covers nine service/count combinations, unique locations, deterministic results, overlap accounting, travel-window monotonicity, rejected parameters, and five HTTP routes through the real handler without a network dependency.

HTTP example:

```bash
curl 'http://127.0.0.1:8003/api/optimize?city=Dallas&service=food&stops=5&minutes=15'
```

## 60-second demo

1. Start the app and open its local URL (10 seconds).
2. Show the synthetic-data notice and five numbered Dallas locations (10 seconds).
3. Click a map stop; read its coverage, high-need residents, and additional population explanation (15 seconds).
4. Change service to Food bank and stops to 3; click Find locations (15 seconds).
5. Increase travel time to 25 minutes and explain how the unique coverage changes (10 seconds).

## Files

`app.py`: optimizer and HTTP server. `index.html`: responsive map and controls. `data.json`: bundled synthetic sample. `smoke.py`: reproducible verification. `export_demo.py`: static default export. `.env.example`: no secrets required.
