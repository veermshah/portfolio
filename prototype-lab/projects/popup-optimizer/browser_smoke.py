"""Optional clean-copy browser verification. Requires Playwright and Chromium."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from playwright.sync_api import sync_playwright

source = Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix='.verify-', dir=source) as td:
    copy = Path(td) / 'popup-optimizer'
    copy.mkdir()
    for item in source.iterdir():
        if item.is_file():
            shutil.copy2(item, copy / item.name)
    for command in ([sys.executable, 'smoke.py'], [sys.executable, 'export_demo.py']):
        subprocess.run(command, cwd=copy, check=True)
    server = subprocess.Popen([sys.executable, 'app.py', '--port', '18903'], cwd=copy, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    try:
        for _ in range(50):
            try:
                urllib.request.urlopen('http://127.0.0.1:18903', timeout=1)
                break
            except Exception:
                if server.poll() is not None:
                    raise RuntimeError(server.stderr.read().decode())
                time.sleep(.1)
        else:
            raise RuntimeError('Server did not become ready')
        with sync_playwright() as pw:
            executable = os.environ.get('CHROMIUM_PATH') or shutil.which('chromium')
            options = {'headless': True, 'args': ['--no-sandbox']}
            if executable:
                options['executable_path'] = executable
            browser = pw.chromium.launch(**options)
            page = browser.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto('http://127.0.0.1:18903')
            page.wait_for_selector('#stop-5')
            assert '96,805' in page.locator('#summary').inner_text()
            for service, count, minutes in [('food', 3, 15), ('vaccine', 10, 25), ('health', 1, 5), ('health', 5, 15)]:
                page.select_option('[name=service]', service)
                page.fill('[name=stops]', str(count))
                page.fill('[name=minutes]', str(minutes))
                with page.expect_response(lambda r: '/api/optimize?' in r.url) as response:
                    page.click('button')
                data = response.value.json()
                page.wait_for_function('(n)=>document.querySelectorAll("#results article").length===n', arg=count)
                assert len(data['stops']) == count
                assert page.locator('circle.stop').count() == count
                assert not page.locator('#error').inner_text()
                print('PASS browser controls:', service, count, minutes, data['unique_population_served'])
            page.locator('#map a').first.click()
            assert page.url.endswith('#stop-1')
            page.set_viewport_size({'width': 390, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
            # Managed Chromium can block file:// navigation; load the exact standalone
            # document into a fresh browser page and forbid network requests instead.
            page.close()
            page = browser.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            requests = []
            page.on('request', lambda request: requests.append(request.url))
            page.set_content((copy / 'offline-demo.html').read_text())
            page.wait_for_selector('#stop-5')
            assert page.locator('circle.stop').count() == 5
            assert '96,805' in page.locator('#summary').inner_text()
            assert 'Offline saved default' in page.locator('#controls').inner_text()
            assert not requests, requests
            assert not errors, errors
            browser.close()
            print('PASS clean-copy live HTTP, all services, anchor, mobile layout, standalone export; no JavaScript errors')
    finally:
        server.terminate()
        server.wait(timeout=10)
