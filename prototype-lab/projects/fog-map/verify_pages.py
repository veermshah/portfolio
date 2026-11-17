#!/usr/bin/env python3
"""Check static assets under a GitHub Pages project path; optionally use Chromium."""
import argparse
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import shutil
from pathlib import Path
import tempfile
import threading
from urllib.parse import urljoin
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []
        self.flags = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('a', 'link') and 'href' in attrs:
            self.paths.append(attrs['href'])
        if tag == 'article' and attrs.get('class') == 'flag':
            self.flags += 1


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', action='store_true', help='Requires optional Playwright and Chromium')
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='.pages-check-', dir=ROOT) as td:
        (Path(td) / 'fog-map').symlink_to(ROOT / 'docs', target_is_directory=True)
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=td))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f'http://127.0.0.1:{server.server_port}/fog-map/'
        try:
            with urlopen(base) as response:
                page = response.read().decode()
            links = Links()
            links.feed(page)
            assert links.flags == 6
            assets = [p for p in links.paths if p and not p.startswith('#') and p != './']
            for asset in assets:
                assert not asset.startswith(('/', 'http:','https:')), asset
                with urlopen(urljoin(base, asset)) as response:
                    assert response.status == 200
            with urlopen(base + 'assets/evidence.json') as response:
                evidence = json.load(response)
            assert len(evidence['findings']) == 6
            assert (ROOT / 'docs/assets/sample-spec.md').read_text() == evidence['spec']
            assert (ROOT / 'docs/assets/evidence.json').read_bytes() == (ROOT / 'output-live-1.7b/evidence.json').read_bytes()
            print(f'HTTP project-path check passed: /fog-map/, {len(assets)} relative asset links, six recorded flags.')
            if args.browser:
                from playwright.sync_api import sync_playwright
                with sync_playwright() as playwright:
                    browser = playwright.chromium.launch(headless=True, executable_path=shutil.which('chromium'))
                    try:
                        for width, height in [(1280, 900), (375, 812)]:
                            tab = browser.new_page(viewport={'width': width, 'height': height})
                            errors = []
                            tab.on('pageerror', lambda error: errors.append(str(error)))
                            tab.goto(base, wait_until='networkidle')
                            assert tab.locator('article.flag').count() == 6
                            assert tab.locator('article.flag .assumption').count() == 18
                            assert tab.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Horizontal overflow at {width}px'
                            assert tab.locator('h1').is_visible()
                            assert not errors, errors
                            tab.locator('summary').first.click()
                            assert tab.locator('details').first.get_attribute('open') is not None
                            print(f'Chromium {width}×{height}: no overflow/errors, six flags, 18 assumptions, disclosure opens.')
                            tab.close()
                    finally:
                        browser.close()
        finally:
            server.shutdown()
            server.server_close()


if __name__ == '__main__':
    main()
