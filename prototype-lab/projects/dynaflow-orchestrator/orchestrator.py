#!/usr/bin/env python3
"""Executable-coordination experiment; standard library only."""
import argparse
import ast
import concurrent.futures
import json
import math
import os
from pathlib import Path
import re
import time
import urllib.request

ROOT = Path(__file__).resolve().parent
WORKFLOW_PROMPT = '''Emit ONLY Python workflow assignments and a final answer variable. No imports, attributes, loops or arbitrary code. Allowed functions:
solve(role_string), parallel(role_string, role_string), verify(previous_variable), aggregate(previous_variable).
All calls automatically receive the complete original task and prior outputs.
Example simple task:
a = solve("careful solver")
answer = aggregate(a)
Example harder task:
a = parallel("algebra solver", "independent checker")
b = verify(a)
answer = aggregate(b)
Choose the smallest useful workflow. Maximum 6 assignments, 8 model tool calls. No markdown.'''

def normalize(value):
    return re.sub(r'\s+', ' ', str(value).strip().casefold().rstrip('.'))

def public_task(task):
    return {k: task[k] for k in ('id', 'benchmark', 'question', 'facts') if k in task}

def parse_program(source):
    source = source.strip()
    if source.startswith('```'):
        source = re.sub(r'^```(?:python)?\s*|\s*```$', '', source)
    tree = ast.parse(source)
    if not 1 <= len(tree.body) <= 6:
        raise ValueError('Workflow requires 1–6 assignments')
    seen = set()
    for node in tree.body:
        if not isinstance(node, ast.Assign) or len(node.targets) != 1 or not isinstance(node.targets[0], ast.Name):
            raise ValueError('Only simple assignments allowed')
        name = node.targets[0].id
        if name in seen or name.startswith('_'):
            raise ValueError('Invalid/reused variable')
        call = node.value
        if not isinstance(call, ast.Call) or not isinstance(call.func, ast.Name) or call.keywords:
            raise ValueError('Only direct allowed calls')
        fn = call.func.id
        if fn in ('solve', 'parallel'):
            if not (len(call.args) == 1 if fn == 'solve' else 2 <= len(call.args) <= 3):
                raise ValueError('Invalid solver count')
            if not all(isinstance(a, ast.Constant) and isinstance(a.value, str) and len(a.value) <= 150 for a in call.args):
                raise ValueError('Solver roles must be short strings')
        elif fn in ('verify', 'aggregate'):
            if len(call.args) != 1 or not isinstance(call.args[0], ast.Name) or call.args[0].id not in seen:
                raise ValueError('Invalid prior-output reference')
        else:
            raise ValueError('Function not allowed')
        seen.add(name)
    if tree.body[-1].targets[0].id != 'answer':
        raise ValueError('Final assignment must be answer')
    return tree

class Model:
    def __init__(self, args):
        self.args = args
        self.trace = []

    def call(self, task, role, history):
        prompt = json.dumps({'task': public_task(task), 'role': role, 'full_history': history}, ensure_ascii=False)
        system = WORKFLOW_PROMPT if role == 'workflow designer' else 'Solve the task. Use all original context and prior outputs. Return ONLY the final answer, no explanation. /no_think'
        started = time.perf_counter()
        if self.args.backend == 'surrogate':
            output = self.surrogate(task, role)
            inp, out = math.ceil(len(system + prompt)/4), math.ceil(len(output)/4)
        elif self.args.backend == 'ollama':
            data = self.request(os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434') + '/api/chat', {
                'model': self.args.model, 'messages': [{'role':'system','content':system}, {'role':'user','content':prompt}],
                'stream': False, 'think': False, 'options': {'temperature':0, 'num_ctx':self.args.context, 'num_predict':1024}})
            output = data['message']['content']
            inp, out = data['prompt_eval_count'], data['eval_count']
        else:
            key = os.environ.get('OPENAI_API_KEY')
            if not key:
                raise RuntimeError('OPENAI_API_KEY is missing; no automatic fallback')
            data = self.request(os.environ.get('OPENAI_BASE_URL','https://api.openai.com/v1').rstrip('/') + '/chat/completions', {
                'model': self.args.model, 'messages':[{'role':'system','content':system}, {'role':'user','content':prompt}],
                'temperature':0, 'max_tokens':1024}, key)
            output = data['choices'][0]['message']['content']
            usage = data.get('usage')
            if not usage or not all(k in usage for k in ('prompt_tokens','completion_tokens')):
                raise RuntimeError('Provider omitted token usage; cannot report measured token costs')
            inp, out = usage['prompt_tokens'], usage['completion_tokens']
        self.trace.append({'role':role,'input':json.loads(prompt),'output':output,'input_tokens':inp,'output_tokens':out,'seconds':time.perf_counter()-started})
        return output.strip()

    @staticmethod
    def request(url, payload, key=None):
        headers={'Content-Type':'application/json'}
        if key: headers['Authorization']='Bearer '+key
        req = urllib.request.Request(url,data=json.dumps(payload).encode(),headers=headers)
        with urllib.request.urlopen(req,timeout=180) as response:
            return json.load(response)

    @staticmethod
    def surrogate(task, role):
        if role == 'workflow designer':
            return 'a = solve("symbolic solver")\nanswer = aggregate(a)'
        q = task['question']
        if task['benchmark'] == 'multihop':
            # Greedy graph traversal is a deterministic substitute, not an LLM.
            facts = task['facts']
            current = next((s for s, _, _ in facts if s in q), '')
            visited = set()
            while current not in visited:
                visited.add(current)
                links = [o for s, _, o in facts if s == current]
                if not links: return current
                current = links[0]
            return 'UNKNOWN'
        if 'remainder' in q:
            a,b,c = map(int,re.findall(r'\d+',q)); return str(pow(a,b,c))
        if 'unordered pairs' in q:
            return str(math.comb(int(re.search(r'\d+',q).group()),2))
        if 'progression' in q:
            a,d,n=map(int,re.findall(r'\d+',q)); return str(n*(2*a+(n-1)*d)//2)
        if 'greatest common divisor' in q:
            a,b=map(int,re.findall(r'\d+',q)); return str(math.gcd(a,b))
        if 'die' in q:
            return str(sum(a+b==8 for a in range(1,7) for b in range(1,7)))
        if 'coefficient' in q:
            k,_,n=map(int,re.findall(r'\d+',q)); return str(math.comb(n,k))
        return 'UNKNOWN'

def run_arm(task, arm, model):
    history=[]
    def call(role):
        if len(model.trace) >= 9: raise ValueError('Model call budget exceeded')
        result=model.call(task,role,list(history))
        history.append({'role':role,'output':result})
        return result
    if arm == 'solo': return call('solo solver'), None
    if arm == 'fixed':
        call('planner'); call('solver'); return call('reviewer'), None
    source=call('workflow designer')
    tree=parse_program(source)
    values={}
    for node in tree.body:
        fn=node.value.func.id
        if fn == 'solve': value=call(node.value.args[0].value)
        elif fn == 'parallel':
            # Both calls see identical complete prior history.
            prior=list(history)
            roles=[a.value for a in node.value.args]
            if len(model.trace)+len(roles)>9: raise ValueError('Model call budget exceeded')
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
                value=list(pool.map(lambda role:model.call(task,role,prior), roles))
            history.extend({'role':r,'output':v} for r,v in zip(roles,value))
        elif fn == 'verify':
            history.append({'tool':fn,'selected_input':values[node.value.args[0].id]})
            value=call('verifier')
        else:
            # Aggregation is a real frozen-model call, charged like every other call.
            history.append({'tool':fn,'selected_input':values[node.value.args[0].id]})
            value=call('aggregator')
        values[node.targets[0].id]=value
    return values['answer'],source

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--backend',choices=['surrogate','ollama','openai'],default='surrogate')
    p.add_argument('--model',default=None)
    p.add_argument('--tasks',type=Path,default=ROOT/'tasks.json')
    p.add_argument('--output',type=Path,default=ROOT/'results')
    p.add_argument('--input-per-million',type=float)
    p.add_argument('--output-per-million',type=float)
    p.add_argument('--context',type=int,default=8192)
    args=p.parse_args()
    if args.model is None:
        args.model=os.environ.get('OLLAMA_MODEL','qwen3:4b') if args.backend=='ollama' else os.environ.get('MODEL',args.backend)
    if args.backend=='openai' and args.model=='openai': p.error('Specify --model or MODEL')
    if (args.input_per_million is None)!=(args.output_per_million is None): p.error('Supply both price rates')
    args.output.mkdir(parents=True,exist_ok=True)
    tasks=json.loads(args.tasks.read_text())
    rows=[]
    for task in tasks:
        for arm in ('solo','fixed','generated'):
            model=Model(args); start=time.perf_counter(); error=None; workflow=None
            try: answer,workflow=run_arm(task,arm,model)
            except Exception as exc: answer=''; error=f'{type(exc).__name__}: {exc}'
            inp=sum(t['input_tokens'] for t in model.trace); out=sum(t['output_tokens'] for t in model.trace)
            dollars=None if args.input_per_million is None or args.backend=='surrogate' else (inp*args.input_per_million+out*args.output_per_million)/1e6
            row={'id':task['id'],'benchmark':task['benchmark'],'arm':arm,'answer':answer,'expected':task['answer'],
                 'correct':error is None and normalize(answer)==normalize(task['answer']),'input_tokens':inp,'output_tokens':out,
                 'dollars':dollars,'seconds':time.perf_counter()-start,'error':error,'workflow':workflow,'trace':model.trace}
            rows.append(row)
    summary=[]
    for benchmark in sorted({t['benchmark'] for t in tasks}):
        for arm in ('solo','fixed','generated'):
            group=[r for r in rows if r['benchmark']==benchmark and r['arm']==arm]
            n=len(group); solved=sum(r['correct'] for r in group); units=sum(r['input_tokens']+r['output_tokens'] for r in group)
            dollars=None if any(r['dollars'] is None for r in group) else sum(r['dollars'] for r in group)
            summary.append({'benchmark':benchmark,'arm':arm,'tasks':n,'solved':solved,'accuracy':solved/n,'calls':sum(len(r['trace']) for r in group),
                            'token_units':units,'units_per_solved':units/solved if solved else None,
                            'dollars':dollars,'dollars_per_solved':dollars/solved if dollars is not None and solved else None,
                            'seconds':sum(r['seconds'] for r in group),'errors':sum(r['error'] is not None for r in group)})
    result={'backend':args.backend,'model':args.model,'token_measurement':'ceil(characters/4) proxy; NOT model tokens' if args.backend=='surrogate' else 'provider reported',
            'prices_per_million':{'input':args.input_per_million,'output':args.output_per_million},'summary':summary,'runs':rows}
    (args.output/'results.json').write_text(json.dumps(result,indent=2)+'\n')
    lines=['# Measured results',f"Backend: **{args.backend}**, model: `{args.model}`.",f"Token units: {result['token_measurement']}.",
           'Original toy tasks; these are NOT published AIME/HotpotQA scores. Errors denote execution/provider failures, not demonstrated reasoning failures.',
           '| Benchmark | Arm | Correct | Errors | Calls | Token units / correct | Dollars / correct |', '|---|---|---:|---:|---:|---:|---:|']
    for s in summary:
        u='undefined' if s['units_per_solved'] is None else f"{s['units_per_solved']:.1f}"
        d='unavailable' if s['dollars_per_solved'] is None else f"{s['dollars_per_solved']:.6f}"
        lines.append(f"| {s['benchmark']} | {s['arm']} | {s['solved']}/{s['tasks']} | {s['errors']} | {s['calls']} | {u} | {d} |")
    text='\n\n'.join(lines[:4])+'\n\n'+'\n'.join(lines[4:])+'\n'
    (args.output/'RESULTS.md').write_text(text)
    print(text)
    print('Raw traces:',args.output/'results.json')
    if all(r['error'] is not None for r in rows): raise SystemExit(1)

if __name__=='__main__': main()
