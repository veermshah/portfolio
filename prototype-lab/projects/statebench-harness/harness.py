#!/usr/bin/env python3
"""StateBench-style state tracking; CPU controls are not language models."""
import argparse, collections, json, os, random, time, urllib.request
from pathlib import Path

LEVELS = ('immutable', 'overwrite', 'self', 'reference')

def generate(level, n, seed):
    rng = random.Random(seed)
    ops = []
    if level == 'immutable':
        for i in range(n):
            ops.append({'op': 'set', 'x': f'v{i}', 'value': rng.randrange(-99,100)} if i == 0 else
                       {'op':'copy','x':f'v{i}','y':f'v{rng.randrange(i)}'})
        return ops, [f'v{i}' for i in range(max(0,n-4),n)]
    names = [f'v{i}' for i in range(8)]
    for i in range(n):
        x = names[i] if i < 8 else rng.choice(names)
        if i < 8 or rng.random() < .2:
            op = {'op':'set', 'x':x, 'value':rng.randrange(-99,100)}
        else:
            options = ['set','copy'] if level == 'overwrite' else ['copy','add'] if level == 'self' else ['ref','swap','add','copy']
            kind = rng.choice(options)
            op = {'op':kind,'x':x}
            if kind in ('set','add'): op['value'] = rng.randrange(-9,10)
            else: op['y'] = rng.choice(names)
        ops.append(op)
    return ops, names

class State:
    def __init__(self, saved=None):
        self.bindings = {} if saved is None else saved['bindings']
        self.cells = {} if saved is None else saved['cells']
        self.next = 0 if saved is None else saved['next']
    def snapshot(self): return {'bindings':self.bindings,'cells':self.cells,'next':self.next}
    def read(self,x): return self.cells[self.bindings[x]]
    def step(self,o):
        k,x = o['op'],o['x']
        if k == 'ref': self.bindings[x] = self.bindings[o['y']]
        elif k == 'swap': self.bindings[x],self.bindings[o['y']] = self.bindings[o['y']],self.bindings[x]
        else:
            value = o['value'] if k == 'set' else self.read(o['y']) if k == 'copy' else self.read(x)+o['value']
            if x not in self.bindings:
                self.bindings[x] = str(self.next); self.next += 1
            self.cells[self.bindings[x]] = value
    def answer(self,query):
        return {x:self.read(x) if x in self.bindings else None for x in query}

def execute(ops,query):
    s=State()
    for op in ops: s.step(op)
    return s.answer(query)

def bounded(ops,query,window):
    # Deliberately limited replay control. Missing dependencies are unknown.
    s=State()
    for op in ops[-window:]:
        try:s.step(op)
        except KeyError:pass
    return s.answer(query)

def scratchpad(ops,query,path):
    # Each operation reads persisted state and commits the full new state.
    path.write_text(json.dumps(State().snapshot()))
    for op in ops:
        s=State(json.loads(path.read_text())); s.step(op)
        path.write_text(json.dumps(s.snapshot()))
    return s.answer(query)

def chunked(ops,query,size):
    s=State()
    for start in range(0,len(ops),size):
        s=State(json.loads(json.dumps(s.snapshot())))
        for op in ops[start:start+size]: s.step(op)
    return s.answer(query)

RULES='''Execute all operations in order. set(x,value) updates x's existing cell, allocating only if x is new. copy(x,y) assigns y's current numeric value into x's cell. add(x,value) increments x's cell. ref(x,y) rebinds x to y's cell: later updates through either alias affect both. swap(x,y) swaps bindings, not cell contents. Return only a JSON object mapping each queried name to its final integer. No tools. '''

def call_model(backend,model,ops,query):
    prompt=RULES+'\nOperations: '+json.dumps(ops,separators=(',',':'))+'\nQuery: '+json.dumps(query)
    if backend=='ollama':
        context=int(os.getenv('OLLAMA_NUM_CTX','8192'))
        # UTF-8 byte count is a conservative token upper bound for this ASCII prompt.
        # Reserve chat-template overhead and output; never measure silent truncation.
        if len(prompt.encode('utf-8'))+2048 > context:
            raise ValueError('context_limit: conservative byte-token bound plus 2048 reserve exceeds OLLAMA_NUM_CTX; skipped before request')
        url=os.getenv('OLLAMA_HOST','http://localhost:11434').rstrip('/')+'/api/chat'
        body={'model':model,'messages':[{'role':'user','content':prompt}], 'stream':False,'think':False,'format':'json','options':{'temperature':0,'num_ctx':context,'num_predict':512}}
        headers={}
    else:
        url=os.getenv('OPENAI_BASE_URL','https://api.openai.com/v1').rstrip('/')+'/chat/completions'
        body={'model':model,'messages':[{'role':'user','content':prompt}],'temperature':0}
        headers={'Authorization':'Bearer '+os.environ['OPENAI_API_KEY']}
    request=urllib.request.Request(url,json.dumps(body).encode(),{'Content-Type':'application/json',**headers})
    with urllib.request.urlopen(request,timeout=300) as r: result=json.load(r)
    if backend=='ollama':
        content=result['message']['content']; usage={'input_tokens':result.get('prompt_eval_count'), 'output_tokens':result.get('eval_count')}
    else: content=result['choices'][0]['message']['content']; usage=result.get('usage',{})
    try:
        answer=json.loads(content.strip().removeprefix('```json').removeprefix('```').removesuffix('```'))
    except (ValueError,TypeError): answer=None
    return answer, {'usage':usage,'response':content}

def run(args):
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    models=args.models.split(',') if args.backend!='offline' else ['bounded-replay-32','bounded-replay-128']
    records=[]
    for level in LEVELS:
      for n in args.lengths:
       for sample in range(args.samples):
        ops,query=generate(level,n,args.seed+sample)
        expected=execute(ops,query)
        for model in models:
         started=time.perf_counter(); extra={}
         try:
            if args.backend=='offline': answer=bounded(ops,query,int(model.rsplit('-',1)[1]))
            else: answer,extra=call_model(args.backend,model,ops,query)
            error=None
         except Exception as e: answer=None;error=f'{type(e).__name__}: {e}'
         records.append(dict(level=level,length=n,sample=sample,model=model,method='raw',correct=answer==expected,error=error,answer=answer,expected=expected,seconds=time.perf_counter()-started,**extra))
        # These are deterministic tool upper bounds, not extra model calls.
        for method in args.fixes:
         started=time.perf_counter()
         answer=scratchpad(ops,query,out/'scratchpad.json') if method=='scratchpad' else chunked(ops,query,args.chunk_size)
         records.append(dict(level=level,length=n,sample=sample,model='exact-tool',method=method,correct=answer==expected,error=None,answer=answer,expected=expected,seconds=time.perf_counter()-started))
    (out/'records.json').write_text(json.dumps(records,indent=2))
    (out/'config.json').write_text(json.dumps(vars(args),indent=2))
    summarize(records,out,args.backend)

def summarize(records,out,backend):
    os.environ.setdefault('MPLCONFIGDIR', '/tmp/statebench-matplotlib')
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    groups=collections.defaultdict(list)
    for r in records: groups[(r['level'],r['model'],r['method'],r['length'])].append(r)
    lines=['# Measured results', '', 'CPU bounded replay controls; NOT LLM results.' if backend=='offline' else 'Live model results; failed calls are errors, excluded from accuracy.', '', '|Level|Backend / method|Length|Correct / valid|Errors|Accuracy|', '|---|---|---:|---:|---:|---:|']
    fig,axs=plt.subplots(2,2,figsize=(12,8))
    for level,ax in zip(LEVELS,axs.flat):
      series=collections.defaultdict(list)
      for (lev,model,method,n),rows in sorted(groups.items()):
        if lev!=level:continue
        valid=[r for r in rows if not r['error']];correct=sum(r['correct'] for r in valid)
        accuracy=correct/len(valid) if valid else float('nan')
        lines.append(f'|{level}|{model} / {method}|{n}|{correct} / {len(valid)}|{len(rows)-len(valid)}|{accuracy:.1%}|')
        series[model+' / '+method].append((n,accuracy))
      for name,points in series.items():
        points.sort();ax.plot([p[0] for p in points],[p[1] for p in points],marker='o',label=name)
      ax.set(title=level,xlabel='Assignments',ylabel='Exact final-state accuracy',ylim=(-.05,1.05),xscale='log');ax.legend(fontsize=7);ax.grid(alpha=.3)
    fig.suptitle('CPU control experiment — not transformer failure curves' if backend=='offline' else 'State-tracking model experiment with deterministic tool upper bounds')
    fig.tight_layout();fig.savefig(out/'accuracy.png',dpi=140);plt.close(fig)
    (out/'results.md').write_text('\n'.join(lines)+'\n')
    print('\n'.join(lines))

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--backend',choices=['offline','ollama','openai'],default='offline')
    p.add_argument('--models',default='qwen3:4b,qwen3:8b')
    p.add_argument('--lengths',type=int,nargs='+',default=[8,32,128,512,2048])
    p.add_argument('--samples',type=int,default=3);p.add_argument('--seed',type=int,default=42)
    p.add_argument('--fixes', choices=['scratchpad','chunked'], nargs='+', default=['scratchpad','chunked'])
    p.add_argument('--chunk-size',type=int,default=128);p.add_argument('--output',default='results')
    a=p.parse_args()
    if any(n<8 or n>64000 for n in a.lengths) or a.samples<1 or a.chunk_size<1:p.error('lengths must be 8..64000, samples/chunk-size positive')
    run(a)
