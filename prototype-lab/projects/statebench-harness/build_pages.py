#!/usr/bin/env python3
"""Build the archived research viewer using Python's standard library only."""
from collections import defaultdict
import hashlib
import html
import json
from pathlib import Path
import shutil

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'results-models'
OUT=ROOT/'docs'
LABELS={'raw':'Raw model','model-scratchpad':'Model-written state','model-tool':'Model-delegated tool'}
MODELS=('Qwen3-0.6B-Q4_K_M','Qwen3-1.7B-Q4_K_M')
METHODS=tuple(LABELS)
LEVELS=('immutable','overwrite','self','reference')

def load_records():
    rows=json.loads((SOURCE/'records.json').read_text())
    keys={(r['model'],r['method'],r['level'],r['length'],r['sample'],r['seed']) for r in rows}
    expected={(m,method,level,n,0,42) for m in MODELS for method in METHODS for level in LEVELS for n in (8,32,128)}
    if len(rows)!=72 or keys!=expected:raise ValueError('Expected the finalized, unique 72-record experiment')
    for r in rows:
        if r['correct']!=(r['answer']==r['expected']):raise ValueError('Inconsistent score')
        if r['calls']!=sum(t.get('called',False) for t in r['trace']):raise ValueError('Inconsistent call count')
        for name in ('prompt_tokens','completion_tokens'):
            if r['usage'][name]!=sum(t.get('usage',{}).get(name,0) for t in r['trace']):raise ValueError('Inconsistent token total')
    return rows

def table(rows):
    result=[]
    for model in MODELS:
        for method in METHODS:
            group=[r for r in rows if r['model']==model and r['method']==method]
            cells=[]
            for n in (8,32,128):
                valid=[r for r in group if r['length']==n and not r['error']]
                score=sum(r['correct'] for r in valid)
                cells.append(f'<td>{score}/{len(valid)} <small>({score/len(valid):.0%})</small></td>' if valid else '<td>No valid cases</td>')
            result.append('<tr><th scope="row">'+html.escape(model.replace('-Q4_K_M',''))+'</th><td>'+LABELS[method]+'</td>'+''.join(cells)+f'<td>{sum(r["calls"] for r in group)}</td></tr>')
    return ''.join(result)

def main():
    rows=load_records()
    assets=OUT/'assets';data=OUT/'data'
    assets.mkdir(parents=True,exist_ok=True);data.mkdir(exist_ok=True)
    for name in ('accuracy-overall.png','accuracy.png'):
        shutil.copyfile(SOURCE/name,assets/name)
    for name in ('records.json','config.json','summary.md','AUDIT.md'):
        shutil.copyfile(SOURCE/name,data/name)
    shutil.copyfile(ROOT/'model_sources.json',data/'model_sources.json')
    manifest={'records':len(rows),'model_calls':sum(r['calls'] for r in rows),
              'input_tokens':sum(r['usage']['prompt_tokens'] for r in rows),
              'output_tokens':sum(r['usage']['completion_tokens'] for r in rows),
              'transport_context_errors':sum(bool(r['error']) for r in rows),
              'source_sha256':hashlib.sha256((SOURCE/'records.json').read_bytes()).hexdigest(),
              'inference':'archived CPU inference; no live model runs in this website'}
    (data/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    template=(ROOT/'pages'/'index.html').read_text()
    template=template.replace('<!--RESULT_ROWS-->',table(rows))
    for key in ('records','model_calls','input_tokens','output_tokens'):
        template=template.replace('{{'+key+'}}',f'{manifest[key]:,}')
    (OUT/'index.html').write_text(template)
    for source in ('style.css','app.js','reproduce.html'):
        shutil.copyfile(ROOT/'pages'/source,OUT/source)
    (OUT/'.nojekyll').write_text('')
    print(f'Built {OUT}: {len(rows)} archived records, {manifest["model_calls"]} actual calls; no inference performed.')

if __name__=='__main__':main()
