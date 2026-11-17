# Pop-Up Optimizer plan

Build a dependency-free Python HTTP app with a vanilla JavaScript SVG geographic map, bundled synthetic Dallas-area population centers, and real deterministic weighted k-means. Geographic coordinates and neighborhood labels provide orientation; demographic values are invented demonstration data, not Census estimates. The offline map is schematic, not a navigable road map.

Optimize cluster centers weighted by population times service-specific need, snap centers to candidate sample locations, then rank stops by additional population within an estimated travel radius. Travel time uses straight-line distance at 25 km/h with a 1.3 detour factor, not routing or live traffic. Explain total, high-need, and incremental coverage with overlap removed from the overall served total.

Milestones:
1. Bundle Dallas demonstration centers and implement weighted clustering and coverage.
2. Serve interactive map, service/stop controls, explanations, and JSON API.
3. Run functional smoke checks, document provenance and 60-second demo.

Done: default Dallas/health/5 produces five mapped, ranked stops with explanatory coverage numbers; changes to service and stop count recompute; all assets and functions work offline on CPU with Python 3.10+ and no dependencies or API keys. No GPU or model needed. Recommendations are exploratory synthetic examples, not approved service sites.


## GitHub Pages extension (2026-11-17)

Keep the Python app intact and produce a static `docs/` deployment with the same UI and synthetic data. Port the deterministic optimizer to browser JavaScript with Python-compatible need-count rounding. Rebuild through `build_pages.py`; validate all 1,230 supported integer control combinations against Python and exercise the static site under a repository URL prefix with all controls working offline after load. Publication is a separate repository/Pages operation, not implied by prepared assets.
