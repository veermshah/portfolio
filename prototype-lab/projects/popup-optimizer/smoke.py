"""Checks meaningful optimizer and API behavior without requiring socket permissions."""
import io
import json
from app import optimize, Handler, ROOT

for service in ('health','food','vaccine'):
    for count in (1,5,10):
        data=optimize(service,count)
        assert len(data['stops'])==count
        assert len({(p['lat'],p['lon']) for p in data['stops']})==count
        assert sum(p['additional_population'] for p in data['stops'])==data['unique_population_served']
        assert data['unique_population_served'] <= data['sample_population']
        assert data == optimize(service,count)
assert optimize(minutes=45)['unique_population_served']>=optimize(minutes=5)['unique_population_served']
for args in [('bad',5,15),('health',0,15),('health',5,0)]:
    try: optimize(*args)
    except ValueError: pass
    else: raise AssertionError('invalid input accepted')
class FakeHandler:
    do_GET=Handler.do_GET
    send_json=Handler.send_json
    def __init__(self,path): self.path=path;self.wfile=io.BytesIO();self.status=None
    def send_response(self,status): self.status=status
    def send_header(self,*args): pass
    def end_headers(self): pass
    def send_error(self,status): self.status=status
for path,status in [('/api/optimize',200),('/api/optimize?stops=0',400),('/api/optimize?city=Boston',400),('/',200),('/absent',404)]:
    h=FakeHandler(path);h.do_GET();assert h.status==status
    if path.startswith('/api/'): json.loads(h.wfile.getvalue())
print('PASS: 9 optimizer configurations, coverage accounting, determinism, radius, invalid inputs, 5 HTTP routes')
print(json.dumps({k:v for k,v in optimize().items() if k not in ('centers','stops')},indent=2))
