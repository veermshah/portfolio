#!/usr/bin/env python3
"""HTTP checks, plus optional real Chromium checks with --browser."""
import argparse
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import shutil
import tempfile
import threading
import urllib.request

ROOT=Path(__file__).resolve().parent
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser',action='store_true')
    parser.add_argument('--screenshot',type=Path)
    args=parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='.pages-smoke-',dir=ROOT) as temp:
        (Path(temp)/'statebench-harness').symlink_to(ROOT/'docs',target_is_directory=True)
        server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=temp))
        worker=threading.Thread(target=server.serve_forever,daemon=True);worker.start()
        base=f'http://127.0.0.1:{server.server_port}/statebench-harness/'
        try:
            for resource in ('','style.css','app.js','reproduce.html','assets/accuracy-overall.png','assets/accuracy.png','data/config.json','data/summary.md','data/AUDIT.md','data/model_sources.json'):
                with urllib.request.urlopen(base+resource,timeout=5) as response:
                    assert response.status==200
                    response.read()
            with urllib.request.urlopen(base+'data/records.json',timeout=5) as response:rows=json.load(response)
            assert len(rows)==72
            with urllib.request.urlopen(base+'data/manifest.json',timeout=5) as response:manifest=json.load(response)
            assert manifest['records']==72 and manifest['model_calls']==171
            print('PASS HTTP: project subpath, both charts, relative assets, reproducibility page, all evidence and72 real records')
            if args.browser:
                from playwright.sync_api import sync_playwright
                with sync_playwright() as pw:
                    executable=os.getenv('CHROMIUM_PATH') or shutil.which('chromium')
                    options={'headless':True,'args':['--no-sandbox']}
                    if executable:options['executable_path']=executable
                    browser=pw.chromium.launch(**options)
                    page=browser.new_page(viewport={'width':1440,'height':1000})
                    errors=[];bad=[];external=[]
                    page.on('pageerror',lambda e:errors.append(str(e)))
                    page.on('response',lambda r:bad.append((r.status,r.url)) if r.status>=400 else None)
                    page.on('request',lambda r:external.append(r.url) if not r.url.startswith(base) else None)
                    page.goto(base,wait_until='networkidle')
                    page.wait_for_selector('#interactive-chart svg')
                    assert page.locator('#results-body tr').count()==6
                    assert page.locator('#case-select option').count()==72
                    assert not page.locator('#fallback-chart').is_visible()
                    assert page.locator('.chart-svg polyline').count()==6
                    # Known measured tool result: 1.7B has 100% on all four levels.
                    page.select_option('#model-filter','Qwen3-1.7B-Q4_K_M')
                    page.select_option('#level-filter','reference')
                    assert page.locator('#results-body tr').count()==3
                    assert page.locator('#case-select option').count()==9
                    tool=page.locator('#results-body tr').nth(2).inner_text()
                    assert tool.count('1/1 (100%)')==3,tool
                    assert '1 synthetic case per point' in page.locator('#filter-note').inner_text()
                    # Inspect a real model-written-state failure; values are text, not executable markup.
                    pick=next(i for i,r in enumerate(rows) if r['model']=='Qwen3-1.7B-Q4_K_M' and r['level']=='reference' and r['method']=='model-scratchpad' and r['length']==32)
                    page.select_option('#case-select',str(pick))
                    assert 'Incorrect' in page.locator('#case-card').inner_text()
                    assert 'invalid_state_json' in page.locator('#case-card').inner_text()
                    page.locator('#case-card summary').first.click()
                    assert page.locator('#case-card pre').count()>=3
                    # Reset for the aggregate screenshot and check the narrower viewport.
                    page.select_option('#model-filter','all');page.select_option('#level-filter','all')
                    if args.screenshot:page.screenshot(path=str(args.screenshot),full_page=True)
                    page.set_viewport_size({'width':390,'height':844})
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),page.evaluate('[document.documentElement.scrollWidth,innerWidth]')
                    page.select_option('#level-filter','self')
                    assert page.locator('#case-select option').count()==18
                    if args.screenshot:
                        mobile=args.screenshot.with_name(args.screenshot.stem+'-mobile'+args.screenshot.suffix)
                        page.locator('#results').screenshot(path=str(mobile))
                    page.goto(base+'reproduce.html',wait_until='networkidle')
                    assert '64K live inference is claimed' in page.locator('body').inner_text()
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                    fallback=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
                    static=fallback.new_page();static.goto(base,wait_until='networkidle')
                    assert static.locator('#results-body tr').count()==6
                    assert static.locator('#fallback-chart').is_visible()
                    assert static.locator('#model-filter').is_disabled()
                    assert static.locator('noscript').is_visible()
                    fallback.close()
                    assert not errors,errors
                    assert not bad,bad
                    assert not external,external
                    browser.close()
                print('PASS Chromium: filters, actual failure trace, no hidden duplicate figure, mobile layout, project paths, no-JavaScript fallback, zeroJS/HTTP errors, no external requests')
        finally:
            server.shutdown();server.server_close();worker.join(timeout=5)

if __name__=='__main__':main()
