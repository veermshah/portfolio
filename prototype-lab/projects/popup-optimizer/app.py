#!/usr/bin/env python3
"""Offline, synthetic Dallas civic-service placement demonstration."""
import argparse
import json
import math
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / 'data.json').read_text())
SERVICES = {'health': ('uninsured', 'Health van'), 'food': ('low_income', 'Food bank'), 'vaccine': ('unvaccinated', 'Vaccine clinic')}

def distance(a, b):
    """Local equirectangular distance, kilometers."""
    return math.hypot((a['lon']-b['lon'])*111.32*math.cos(math.radians(32.8)), (a['lat']-b['lat'])*111.32)

def optimize(service='health', stops=5, minutes=15):
    if service not in SERVICES or not 1 <= stops <= 10 or not 5 <= minutes <= 45:
        raise ValueError('Use service health/food/vaccine, 1–10 stops, and 5–45 minutes.')
    field, title = SERVICES[service]
    points = DATA['centers']
    weights = [p['population']*(0.15+p[field]+0.2*(not p['nearby_clinic'])) for p in points]
    chosen = [max(range(len(points)), key=lambda i: weights[i])]
    while len(chosen) < stops:
        chosen.append(max((i for i in range(len(points)) if i not in chosen), key=lambda i: weights[i]*min(distance(points[i],points[j])**2 for j in chosen)))
    centers = [dict(points[i]) for i in chosen]
    for _ in range(60):
        groups = [[] for _ in centers]
        for i,p in enumerate(points):
            groups[min(range(stops),key=lambda j: distance(p,centers[j]))].append(i)
        updated=[]
        for j, group in enumerate(groups):
            if not group:
                updated.append(centers[j]); continue
            total=sum(weights[i] for i in group)
            updated.append({axis:sum(weights[i]*points[i][axis] for i in group)/total for axis in ('lat','lon')})
        shift=max(distance(a,b) for a,b in zip(updated,centers))
        centers=updated
        if shift < .001: break
    # Snap to unique candidate centers; these are illustrative geographic points, not verified venues.
    candidates=[]
    for c in centers:
        idx=min((i for i in range(len(points)) if i not in candidates), key=lambda i: distance(c,points[i]))
        candidates.append(idx)
    radius=minutes/60*25/1.3
    covered=set(); result=[]
    while candidates:
        def coverage(i): return {j for j,p in enumerate(points) if distance(points[i],p) <= radius}
        selected=max(candidates,key=lambda i: sum(points[j]['population']*(.15+points[j][field]) for j in coverage(i)-covered))
        candidates.remove(selected)
        ids=coverage(selected); new=ids-covered
        population=sum(points[j]['population'] for j in ids)
        added=sum(points[j]['population'] for j in new)
        high=sum(round(points[j]['population']*points[j][field]) for j in ids)
        no_clinic=sum(points[j]['population'] for j in ids if not points[j]['nearby_clinic'])
        point=points[selected]
        result.append({'rank':len(result)+1,'name':point['name'],'lat':point['lat'],'lon':point['lon'],'population':population,'additional_population':added,'high_need_population':high,'no_clinic_population':no_clinic,'explanation':f"{point['name']} covers about {population:,} sample residents within an estimated {minutes}-minute trip, including {high:,} with this service’s need indicator. {no_clinic:,} live in sample centers marked as lacking a nearby clinic. This stop adds {added:,} residents beyond higher-ranked stops."})
        covered |= ids
    return {'city':'Dallas, TX','service':title,'minutes':minutes,'radius_km':round(radius,3),'stops':result,'unique_population_served':sum(points[j]['population'] for j in covered),'sample_population':sum(p['population'] for p in points),'data_notice':DATA['notice'],'centers':points}

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed=urlparse(self.path)
        if parsed.path == '/api/optimize':
            q=parse_qs(parsed.query)
            try:
                if q.get('city',['Dallas'])[0] != 'Dallas': raise ValueError('Only Dallas is bundled.')
                result=optimize(q.get('service',['health'])[0],int(q.get('stops',['5'])[0]),int(q.get('minutes',['15'])[0]))
                self.send_json(result)
            except (ValueError,TypeError) as e: self.send_json({'error':str(e)},400)
        elif parsed.path in ('/','/index.html'):
            payload=(ROOT/'index.html').read_bytes()
            self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8'); self.send_header('Content-Length',str(len(payload))); self.end_headers(); self.wfile.write(payload)
        else: self.send_error(404)
    def send_json(self,value,status=200):
        payload=json.dumps(value).encode(); self.send_response(status); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(payload))); self.end_headers(); self.wfile.write(payload)

if __name__ == '__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--host',default='127.0.0.1'); parser.add_argument('--port',type=int,default=8003); parser.add_argument('--demo',action='store_true'); args=parser.parse_args()
    if args.demo: print(json.dumps(optimize(),indent=2))
    else:
        print(f'Pop-Up Optimizer: http://{args.host}:{args.port}',flush=True)
        ThreadingHTTPServer((args.host,args.port),Handler).serve_forever()
