"""Optional Chromium check of static Pages under a repository URL prefix."""
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import shutil
import tempfile
import threading
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix='.pages-verify-',dir=ROOT) as temp:
    shutil.copytree(ROOT/'docs',Path(temp)/'popup-optimizer')
    handler=functools.partial(SimpleHTTPRequestHandler,directory=temp)
    server=ThreadingHTTPServer(('127.0.0.1',0),handler)
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        with sync_playwright() as pw:
            options={'headless':True,'args':['--no-sandbox']}
            executable=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium')
            if executable: options['executable_path']=executable
            browser=pw.chromium.launch(**options)
            context=browser.new_context(locale='en-US')
            page=context.new_page();errors=[];requests=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.on('request',lambda request:requests.append(request.url))
            page.goto(f'http://127.0.0.1:{server.server_port}/popup-optimizer/')
            page.wait_for_selector('#stop-5')
            assert '96,805' in page.locator('#summary').inner_text()
            # No backend and no network required once the three static files are loaded.
            context.set_offline(True)
            for service,count,minutes,population in [('food',3,15,'83,650'),('vaccine',10,25,'269,985'),('health',1,5,'5,431'),('health',5,15,'96,805')]:
                page.select_option('[name=service]',service)
                page.fill('[name=stops]',str(count));page.fill('[name=minutes]',str(minutes));page.click('button')
                assert page.locator('#results article').count()==count
                assert page.locator('circle.stop').count()==count
                assert population in page.locator('#summary').inner_text()
                assert not page.locator('#error').inner_text()
            page.locator('#map a').first.click()
            assert page.url.endswith('#stop-1')
            page.set_viewport_size({'width':390,'height':844})
            assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
            page.select_option('[name=service]','food');page.click('button')
            assert page.locator('#results article').count()==5
            assert all(urlparse(url).path.startswith('/popup-optimizer/') for url in requests),requests
            assert not any('/api/' in url for url in requests)
            assert not errors,errors
            browser.close()
            print('PASS Pages /popup-optimizer/ subpath: all services, stop/time controls while offline, anchors, 390px mobile, zero API requests or JavaScript errors')
    finally:
        server.shutdown();server.server_close();thread.join()
