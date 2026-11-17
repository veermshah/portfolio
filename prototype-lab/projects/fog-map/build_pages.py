#!/usr/bin/env python3
"""Build a static GitHub Pages exhibit from the recorded model evidence (stdlib)."""
from pathlib import Path
import html
import json
import shutil

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'output-live-1.7b'
DOCS = ROOT / 'docs'
E = lambda value: html.escape(str(value), quote=True)


def main():
    evidence = json.loads((SOURCE / 'evidence.json').read_text())
    metadata = json.loads((SOURCE / 'run-metadata.json').read_text())
    findings = evidence['findings']
    if evidence['backend'] != 'api' or len(evidence['interpretations']) != 3:
        raise ValueError('Pages requires the recorded three-call actual model run')
    assets = DOCS / 'assets'
    assets.mkdir(parents=True, exist_ok=True)
    for name in ('report.md', 'report.html', 'evidence.json', 'run-metadata.json'):
        shutil.copyfile(SOURCE / name, assets / name)
    (assets / 'sample-spec.md').write_text(evidence['spec'])
    (DOCS / '.nojekyll').touch()
    cards = []
    for rank, finding in enumerate(findings, 1):
        assumptions = ''.join(f'<section class="assumption"><h3>{E(persona)}</h3><p>{E(assumption)}</p></section>'
                              for persona, assumption in finding['assumptions'].items())
        cards.append(f'''<article class="flag" id="flag-{rank}">
<div class="flag-head"><span class="rank">{rank:02}</span><div><p class="eyebrow">SOURCE LINE {finding['line']}</p><h2>{E(finding['topic'])}</h2></div><span class="score">{finding['severity']}<small>/9 severity</small></span></div>
<blockquote>{E(finding['spec'])}</blockquote><div class="assumptions">{assumptions}</div>
<p class="calculation">{finding['disagreeing_pairs']} textually differing agent pairs × impact {finding['impact']} = {finding['severity']}. Candidate disagreement; review the assumptions.</p></article>''')
    details = ''.join(f'<details><summary>{E(a["persona"])} · data model &amp; API sketch</summary><pre>{E(json.dumps({k:a[k] for k in ("data_model", "endpoints")}, indent=2))}</pre></details>' for a in evidence['interpretations'])
    tokens = sum(a['provider_evidence']['usage']['total_tokens'] for a in evidence['interpretations'])
    latency = max(a['provider_evidence']['elapsed_seconds'] for a in evidence['interpretations'])
    page = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Fog Map: inspect six ranked specification ambiguities from three actual CPU model calls. Recorded evidence, limitations, and CLI reproduction.">
<title>Fog Map · Where interpretations diverge</title><link rel="stylesheet" href="assets/site.css"></head>
<body><a class="skip" href="#findings">Skip to findings</a><header><a class="brand" href="./" aria-label="Fog Map home"><span class="mark">◌</span> FOG MAP</a><nav aria-label="Main"><a href="#findings">Findings</a><a href="#evidence">Evidence</a><a href="#run">Run your spec</a></nav></header>
<main><section class="hero"><p class="eyebrow">ONE SPEC. THREE READINGS. THE GAPS MATTER.</p><h1>See the ambiguity<br>before you build.</h1><p class="intro">A backend engineer, a frontend engineer, and a QA engineer interpret the same habit-tracking spec. Their conflicting choices become a map of decisions you need to make.</p>
<div class="status"><span class="dot"></span><strong>Recorded actual CPU model run</strong><span>Qwen3-1.7B Q4_K_M · 16 November 2026</span></div>
<p class="honesty">This static site presents saved model outputs. It does not call a model or generate new analyses in your browser. The offline authored-rules demo is separate.</p></section>
<section class="metrics" aria-label="Recorded run metrics">''' + f'''<div><strong>{len(findings)}</strong><span>ranked line/topic flags</span></div><div><strong>3</strong><span>independent model calls</span></div><div><strong>{tokens:,}</strong><span>total provider tokens</span></div><div><strong>{latency:.1f}s</strong><span>longest request, including queue</span></div></section>''' + '''
<aside class="notice"><h2>Evidence, with limits</h2><p>Six flags cover five topics; team ownership appears twice. Text comparison overflags equivalent frontend/QA team phrasing, and the QA timezone policy is unclear. At least four concrete conflicts are visible: timezone, grace frequency, streak recomputation, and notification timing. Treat scores as review priorities, not semantic proof.</p><p>The 1.7B CPU model substitutes for a Qwen3-4B Q4 local target sized for a 16 GB RTX 5070 Ti. No GPU performance was measured. Earlier failed model and runtime attempts remain in the repository.</p></aside>
<section id="findings" class="section"><div class="section-heading"><div><p class="eyebrow">THE DIVERGENCE REPORT</p><h2>Six decisions to clarify.</h2></div><a href="assets/sample-spec.md" download>Download source spec ↗</a></div><p class="muted">Ranked by textually differing agent pairs × highest model-reported impact. Assumptions below are the unmodified recorded model text.</p>''' + ''.join(cards) + '''</section>
<section id="evidence" class="section"><p class="eyebrow">TRACE EVERY CHOICE</p><h2>Open the evidence.</h2><p>The source lines, three complete interpretations, token counts, timing, and raw model output are preserved in the evidence JSON. This one-spec demonstration does not establish general detector accuracy.</p>
<div class="downloads"><a href="assets/report.md" download>Markdown report ↓</a><a href="assets/evidence.json" download>Full evidence JSON ↓</a><a href="assets/run-metadata.json" download>Model provenance ↓</a><a href="assets/report.html">Original HTML report ↗</a></div>''' + details + '''<p class="muted">API sketches are not generated applications; the recorded model omitted HTTP methods. Topic discovery uses a limited keyword catalog. Source code and failed attempts ship with the repository.</p></section>
<section id="run" class="section run"><p class="eyebrow">BRING YOUR OWN SPEC</p><h2>New analyses run in the CLI.</h2><p>Clone this repository and use Python 3.10+. The dependency-free offline demo runs immediately and is clearly labeled as authored rules:</p><pre><code>python fog.py sample-spec.md --backend offline --out output</code></pre><p>For three actual model calls on your own spec, install Ollama, pull the quantized 4B model, then run:</p><pre><code>ollama pull qwen3:4b
python fog.py your-spec.md --backend ollama --out output-new</code></pre><p>See the repository README for CPU reproduction, optional API configuration, and failure logs. API keys stay in shell environment variables; this site collects nothing.</p></section>
</main><footer>FOG MAP <span>Recorded choices. Visible uncertainty. Better questions.</span><a href="#">Back to top ↑</a></footer></body></html>'''
    (DOCS / 'index.html').write_text(page)
    (assets / 'site.css').write_text(CSS)
    print(f'Built docs/index.html: {len(findings)} recorded flags, {tokens} tokens, {latency:.3f}s max request.')


CSS = '''
:root{color-scheme:light;--ink:#172d29;--muted:#526760;--paper:#f7f8f3;--line:#d7e0d6;--green:#255b47}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--green);text-underline-offset:4px}a:focus-visible,summary:focus-visible{outline:3px solid #94692a;outline-offset:5px}header,main,footer{max-width:1160px;margin:auto;padding:0 36px}header{min-height:104px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);gap:24px}.brand{font-weight:800;letter-spacing:2px;text-decoration:none;color:var(--ink);display:flex;align-items:center;gap:12px}.mark{font-size:38px;font-weight:400}nav{display:flex;gap:24px;font-size:14px}nav a{text-decoration:none}.hero{padding:72px 0 36px;max-width:920px}.eyebrow{font-size:11px;letter-spacing:1.8px;font-weight:750;color:var(--green);margin:0 0 14px}h1{font-size:clamp(42px,6.5vw,78px);letter-spacing:-3px;line-height:1.07;margin:20px 0 28px;font-weight:650}h2{line-height:1.25;letter-spacing:-.6px;margin:0 0 20px;font-size:32px}.intro{font-size:20px;max-width:760px;color:var(--muted)}.status{display:flex;align-items:center;flex-wrap:wrap;gap:8px 12px;margin-top:32px;font-size:13px}.status span:last-child{color:var(--muted)}.dot{width:8px;height:8px;border-radius:50%;background:#357e54}.honesty{font-size:13px;color:var(--muted);max-width:760px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin:16px 0 30px;padding:26px 0}.metrics div{padding:0 22px;border-right:1px solid var(--line)}.metrics div:first-child{padding-left:0}.metrics div:last-child{border:0}.metrics strong{display:block;font-size:32px;font-weight:600;line-height:1.4}.metrics span{font-size:12px;color:var(--muted);display:block}.notice{background:#eaf0e5;border-left:3px solid #6d8a5d;padding:24px 28px;font-size:14px}.notice h2{font-size:18px;margin-bottom:8px}.notice p{margin:8px 0}.section{padding-top:64px}.section-heading{display:flex;justify-content:space-between;align-items:end;gap:20px}.section-heading a{font-size:13px;margin-bottom:24px}.muted{font-size:14px;color:var(--muted)}.flag{border:1px solid var(--line);background:#fff;margin:24px 0;padding:28px;border-radius:10px}.flag-head{display:flex;align-items:center;gap:20px}.rank{font:24px ui-monospace,monospace;color:#7b8d80}.flag-head .eyebrow{margin-bottom:3px;font-size:10px}.flag h2{font-size:24px;margin:0;text-transform:capitalize}.score{margin-left:auto;flex-shrink:0;font:600 28px system-ui;color:#855925;text-align:right}.score small{display:block;font-size:10px;font-weight:500;letter-spacing:.3px}blockquote{margin:24px 0;padding:14px 18px;background:#f4f6f1;border-left:2px solid #9cafa1;font-size:15px}.assumptions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.assumption h3{font-size:11px;text-transform:uppercase;letter-spacing:.8px;margin:0 0 10px;color:var(--green)}.assumption p{font-size:14px;margin:0;overflow-wrap:anywhere}.calculation{border-top:1px solid #edf0e9;padding-top:16px;margin:24px 0 0;font-size:11px;color:var(--muted)}.downloads{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}.downloads a{font-size:13px;padding:10px 15px;border:1px solid var(--line);border-radius:5px;text-decoration:none;background:white}details{border-top:1px solid var(--line);padding:18px 0}summary{cursor:pointer;font-weight:600;font-size:14px}pre{padding:20px;background:#eaf0e8;font:13px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;border-radius:6px}.run{max-width:850px;margin-bottom:72px}footer{display:flex;flex-wrap:wrap;gap:18px;justify-content:space-between;border-top:1px solid var(--line);padding-top:24px;padding-bottom:32px;font-size:11px;letter-spacing:1px}footer span{letter-spacing:0;color:var(--muted)}.skip{position:absolute;left:8px;top:-80px;background:white;padding:12px;z-index:10}.skip:focus{top:8px}@media(max-width:700px){header,main,footer{padding-left:20px;padding-right:20px}header{min-height:90px;gap:12px;align-items:flex-start;padding-top:20px;padding-bottom:18px;flex-wrap:wrap}.brand{font-size:13px}nav{gap:18px;font-size:12px}.hero{padding-top:42px}h1{letter-spacing:-1.6px}.intro{font-size:17px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 0}.metrics div{padding:0 14px}.metrics div:nth-child(3){padding-left:0}.metrics div:nth-child(2){border-right:0}.metrics strong{font-size:28px}.section{padding-top:44px}.section-heading{align-items:start;flex-direction:column;gap:0}.section-heading a{margin-bottom:4px}h2{font-size:27px}.flag{padding:20px}.flag-head{gap:12px}.rank{font-size:18px}.flag h2{font-size:19px}.score{font-size:24px}.assumptions{grid-template-columns:1fr;gap:20px}.assumption p{font-size:14px}.notice{padding:20px}.status{align-items:start}.status span:last-child{flex-basis:100%}.dot{margin-top:7px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}'''

if __name__ == '__main__':
    main()
