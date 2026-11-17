# Pop-Up Optimizer

**Hosted demo:** https://veermshah.github.io/popup-optimizer/

The hosted site is published from the account’s existing GitHub Pages deployment. It computes placements in your browser over synthetic data. The `docs/` folder can also be published from this standalone repository or a fork.

An offline Dallas civic-service planning demo. Select health vans, food banks, or vaccine clinics, choose 1–10 stops and a 5–45 minute travel window, and receive ranked locations with coverage circles and plain-English explanations.

## GitHub Pages (fully interactive static app)

The publish-ready site is in `docs/`. It runs weighted k-means entirely in the browser: no Python server, API keys, paid service, CDN, or external map tiles. Its map, service selector, stop count, travel-time controls, and explanations remain interactive after loading. The data remains explicitly **synthetic**. This checkout prepares the deployment; it does not establish that a repository or site has been published.

Rebuild assets and check Python/JavaScript parity from the repository root:

```bash
python build_pages.py
python pages_parity.py
```

The build uses only Python's standard library. Parity verification additionally needs Node.js 16.9+ and checks complete results for all **1,230** supported combinations (3 services × 10 stop counts × 41 integer travel windows), including explanations, need-count rounding, ranking, and coverage. Explicit tests cover ties-to-even rounding and invalid inputs. The JavaScript source is `optimizer.js`; `build_pages.py` copies it plus the bundled dataset into `docs/` and reuses the existing UI. Edit sources and rebuild rather than editing generated assets.

Preview the Pages version locally:

```bash
python -m http.server 8004 --directory docs
```

Open http://127.0.0.1:8004. All asset paths are relative, so a GitHub project URL such as `https://OWNER.github.io/popup-optimizer/` also works. The generated files are committed deployment assets; Pages does not need a build command or Python runtime.

After the separate GitHub repository exists and these files are on its `main` branch, set **Settings → Pages → Build and deployment → Deploy from a branch → main → /docs → Save**. Use the URL displayed by GitHub after deployment completes. Repository creation and deployment have not been performed by these build scripts.

Optional real-browser verification:

```bash
python -m pip install playwright
python -m playwright install chromium
python pages_browser_smoke.py
```

This serves only static assets under `/popup-optimizer/`, then tests all three services, changed stop counts and travel windows, map anchors, and 390-pixel mobile layout. It switches the browser offline before testing the controls and asserts zero API requests and JavaScript errors. Use `CHROMIUM_PATH` to override the browser executable. Verified on 2026-11-17: the complete 1,230-case parity suite and browser smoke passed. The original Python optimizer/server remain unchanged.

## Run

Python 3.10+ only; no installation, GPU, API key, model, paid service, or internet required.

```bash
# Run from this repository root
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

Optional browser verification (development only; the app still has no dependencies):

```bash
python -m pip install playwright
python -m playwright install chromium
python browser_smoke.py
```

The check uses a system `chromium` if present, or Playwright's installed browser. Override with `CHROMIUM_PATH=/path/to/chromium`. It creates and removes a fresh source-file copy, runs its smoke tests and export, starts its live HTTP server on port 18903, and drives the controls in a real browser.

Verified on 2026-11-16 with Chromium: food/3 stops/15 minutes reached **83,650**, vaccine/10/25 reached **269,985**, health/1/5 reached **5,431**, and default health/5/15 reached **96,805 synthetic residents**. Map-to-explanation links and 390-pixel mobile layout passed with no JavaScript errors. The standalone exported HTML rendered five stops without network requests. Managed browser policy blocked `file://` navigation in this environment, so the export was loaded directly as a document for that check; opening the file through the desktop UI was not verified.

## 60-second demo

1. Start the app and open its local URL (10 seconds).
2. Show the synthetic-data notice and five numbered Dallas locations (10 seconds).
3. Click a map stop; read its coverage, high-need residents, and additional population explanation (15 seconds).
4. Change service to Food bank and stops to 3; click Find locations (15 seconds).
5. Increase travel time to 25 minutes and explain how the unique coverage changes (10 seconds).

## Files

`app.py`: optimizer and HTTP server. `index.html`: responsive map and controls. `data.json`: bundled synthetic sample. `smoke.py`: reproducible verification. `export_demo.py`: static default export. `.env.example`: no secrets required. `browser_smoke.py`: optional real-browser verification from a clean source copy.
