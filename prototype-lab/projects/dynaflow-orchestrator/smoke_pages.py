#!/usr/bin/env python3
"""Optional browser smoke test (requires Playwright + Chromium, not a site dependency)."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import shutil
import tempfile
import threading
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent


def main():
    from playwright.sync_api import sync_playwright
    with tempfile.TemporaryDirectory(prefix='dynaflow-pages-') as folder:
        nested = Path(folder) / 'dynaflow-orchestrator'
        shutil.copytree(ROOT / 'docs', nested)
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=folder))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f'http://127.0.0.1:{server.server_port}/dynaflow-orchestrator/'
        try:
            for path in ('', 'style.css', 'app.js', 'data/official.json', 'data/calibration.json', 'data/manifest.json'):
                with urlopen(base + path) as response:
                    assert response.status == 200
                    response.read()
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(headless=True, executable_path=shutil.which('chromium') or None)
                page = browser.new_page(viewport={'width': 1440, 'height': 1000})
                errors = []
                external = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.on('request', lambda request: external.append(request.url) if not request.url.startswith(base) else None)
                page.goto(base)
                page.wait_for_function("document.querySelectorAll('#metrics tr').length===8")
                assert '84,774' in page.locator('#stats').inner_text()
                assert '256' in page.locator('#budget').inner_text()
                assert page.locator('#call-list button').count() == 4
                page.locator('#call-list button').nth(2).click()
                page.locator('#call-details details').first.locator('summary').click()
                assert 'full_history' in page.locator('#call-details').inner_text()
                assert page.locator('#call-details [aria-pressed=true]').count() == 0
                page.get_by_role('tab', name='Accessible calibration').click()
                assert '128' in page.locator('#budget').inner_text() and '192' in page.locator('#budget').inner_text()
                assert '3.13×' in page.locator('#finding').inner_text()
                assert '9.98×' in page.locator('#finding').inner_text()
                assert '1,039' in page.locator('#metrics').inner_text()
                page.select_option('#arm-select', 'solo')
                assert page.locator('#call-list button').count() == 1
                page.select_option('#task-select', 'math-02')
                assert 'CORRECT' == page.locator('#outcome').inner_text().split(' · ')[0]
                preview=ROOT / '.pages-preview'
                preview.mkdir(exist_ok=True)
                page.screenshot(path=str(preview / 'desktop.png'), full_page=True)
                page.set_viewport_size({'width': 390, 'height': 844})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                page.screenshot(path=str(preview / 'mobile.png'), full_page=True)
                assert not errors, errors
                assert not external, external
                browser.close()
            print(json.dumps({'http': 'all local assets 200 under /dynaflow-orchestrator/',
                              'browser': 'cohort switch, exact metrics, trace/context, arm/task selectors, mobile overflow passed',
                              'external_requests': external, 'page_errors': errors}, indent=2))
        finally:
            server.shutdown()
            server.server_close()


if __name__ == '__main__':
    main()
