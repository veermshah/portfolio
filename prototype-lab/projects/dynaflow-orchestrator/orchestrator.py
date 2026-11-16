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
import string
import time
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parent
WORKFLOW_PROMPT = '''You are a workflow programmer. Return ONLY valid Python code, no explanation. /no_think
Available functions: solve("role"), parallel("role1", "role2"), verify(variable), aggregate(variable).
Choose a small workflow suited to the task. Assign the final result to answer. Only assignments and these calls are allowed. Maximum 6 assignments and 8 tool calls. Each call receives the original task and complete prior outputs. Do not solve the question yourself.
Example 1, straightforward arithmetic:
a = solve("careful mathematician")
answer = aggregate(a)
Example 2, modular arithmetic needing independent checking:
a = parallel("modular arithmetic solver", "independent arithmetic checker")
b = verify(a)
answer = aggregate(b)
Example 3, evidence from several facts:
a = solve("trace evidence through all facts")
b = verify(a)
answer = aggregate(b)
Return only the code for this task.'''

def role_prompt(role):
    if role == 'workflow designer':
        return WORKFLOW_PROMPT
    common = 'Use the complete original task and supplied history. Do not invent facts. /no_think '
    if role == 'planner':
        return common + 'Propose a brief concrete solution plan, including relevant equations or evidence links. Do not simply state an answer.'
    if role == 'verifier':
        return common + 'Independently check the selected solver outputs step by step. Identify any errors and recompute or trace the facts. Give concise verification reasoning, ending with FINAL: <answer>.'
    if role in ('reviewer','aggregator'):
        return common + 'Review the preceding reasoning, resolve disagreements using the original question, and give the final answer. Return only FINAL: <answer>.'
    return common + 'Solve the task with brief explicit reasoning or evidence links, then end with FINAL: <answer>. For math give an integer; for fact questions give only the requested entity after FINAL.'

def extract_answer(output):
    """Only explicit answer markers are stripped; no search for the expected label."""
    output = re.sub(r'<think>.*?</think>', '', str(output), flags=re.S).strip()
    matches = re.findall(r'(?im)^\s*(?:FINAL|FINAL ANSWER)\s*:\s*(.+)$', output)
    if matches:
        output = matches[-1].strip()
    tagged = re.findall(r'<answer>\s*(.*?)\s*</answer>', output, flags=re.S|re.I)
    if tagged:
        output = tagged[-1]
    boxed = re.fullmatch(r'\\boxed\{([^{}]+)\}', output)
    if boxed:
        output = boxed.group(1)
    return output.strip().strip('`').strip()

def normalize(value):
    return re.sub(r'\s+', ' ', str(value).strip().casefold().rstrip('.'))

def grade(task, output):
    predicted, expected = extract_answer(output), str(task['answer'])
    if task['benchmark'] == 'hotpotqa':
        # HotpotQA official-style exact-match normalization.
        def clean(value):
            value = value.lower().translate(str.maketrans('', '', string.punctuation))
            return ' '.join(re.sub(r'\b(a|an|the)\b', ' ', value).split())
        return clean(predicted) == clean(expected)
    if task['benchmark'] == 'aime2024' and predicted.isdigit() and expected.isdigit():
        return int(predicted) == int(expected)
    return normalize(predicted) == normalize(expected)

def public_task(task):
    return {k: task[k] for k in ('id', 'benchmark', 'question', 'facts') if k in task}

def parse_program(source):
    source = re.sub(r'<think>.*?</think>', '', source, flags=re.S).strip()
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
        system = role_prompt(role)
        max_tokens = self.args.plan_max_tokens if role == 'workflow designer' else self.args.max_tokens
        started = time.perf_counter()
        if self.args.backend == 'surrogate':
            output = self.surrogate(task, role)
            inp, out = math.ceil(len(system + prompt)/4), math.ceil(len(output)/4)
        elif self.args.backend == 'ollama':
            data = self.request(os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434') + '/api/chat', {
                'model': self.args.model, 'messages': [{'role':'system','content':system}, {'role':'user','content':prompt}],
                'stream': False, 'think': False, 'options': {'temperature':0, 'num_ctx':self.args.context, 'num_predict':max_tokens}}, timeout=self.args.timeout)
            output = data['message']['content']
            inp, out = data['prompt_eval_count'], data['eval_count']
        else:
            key = os.environ.get('OPENAI_API_KEY')
            base_url = os.environ.get('OPENAI_BASE_URL','https://api.openai.com/v1').rstrip('/')
            from urllib.parse import urlparse
            if not key and urlparse(base_url).hostname not in ('localhost', '127.0.0.1', '::1'):
                raise RuntimeError('OPENAI_API_KEY is missing for a remote provider; no automatic fallback')
            data = self.request(base_url + '/chat/completions', {
                'model': self.args.model, 'messages':[{'role':'system','content':system}, {'role':'user','content':prompt}],
                'temperature':0, 'max_tokens':max_tokens}, key, self.args.timeout)
            output = data['choices'][0]['message']['content']
            usage = data.get('usage')
            if not usage or not all(k in usage for k in ('prompt_tokens','completion_tokens')):
                raise RuntimeError('Provider omitted token usage; cannot report measured token costs')
            inp, out = usage['prompt_tokens'], usage['completion_tokens']
        self.trace.append({'role':role,'input':json.loads(prompt),'output':output,'input_tokens':inp,'output_tokens':out,'system_prompt':system,'finish_reason':data.get('choices',[{}])[0].get('finish_reason') if self.args.backend=='openai' else None,'seconds':time.perf_counter()-started})
        return output.strip()

    @staticmethod
    def request(url, payload, key=None, timeout=180):
        headers={'Content-Type':'application/json'}
        if key: headers['Authorization']='Bearer '+key
        req = urllib.request.Request(url,data=json.dumps(payload).encode(),headers=headers)
        with urllib.request.urlopen(req,timeout=timeout) as response:
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
    p.add_argument('--max-tokens',type=int,default=256,help='Completion cap for each solver/verifier/aggregator')
    p.add_argument('--plan-max-tokens',type=int,default=256)
    p.add_argument('--timeout',type=int,default=300)
    p.add_argument('--continue-on-provider-error',action='store_true',help='Default stops after the first transport/provider failure; syntax failures still count per-task')
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
            model=Model(args); start=time.perf_counter(); error=None; workflow=None; provider_failure=False
            try: answer,workflow=run_arm(task,arm,model)
            except Exception as exc:
                answer=''; error=f'{type(exc).__name__}: {exc}'
                provider_failure=isinstance(exc,(urllib.error.URLError,TimeoutError,ConnectionError,OSError)) or (isinstance(exc,RuntimeError) and not model.trace)
            inp=sum(t['input_tokens'] for t in model.trace); out=sum(t['output_tokens'] for t in model.trace)
            dollars=None if args.input_per_million is None or args.backend=='surrogate' else (inp*args.input_per_million+out*args.output_per_million)/1e6
            row={'id':task['id'],'benchmark':task['benchmark'],'arm':arm,'answer':answer,'expected':task['answer'],
                 'extracted_answer':extract_answer(answer),'correct':error is None and grade(task,answer),'input_tokens':inp,'output_tokens':out,
                 'dollars':dollars,'seconds':time.perf_counter()-start,'error':error,
                 'error_kind':('model_protocol_failure' if arm=='generated' and error and error.startswith(('ValueError:', 'SyntaxError:')) else 'infrastructure_provider_failure' if error else None),
                 'truncated_calls':sum(t.get('finish_reason')=='length' for t in model.trace),
                 'workflow':workflow,'trace':model.trace}
            rows.append(row)
            # Preserve completed work if a long CPU run is interrupted.
            (args.output/'partial.json').write_text(json.dumps({'backend':args.backend,'model':args.model,'runs':rows},indent=2)+'\n')
            print(f"{task['id']} {arm}: {'ERROR' if error else 'correct' if row['correct'] else 'incorrect'}; {inp}+{out} tokens", flush=True)
            if provider_failure and not args.continue_on_provider_error:
                print(f'Provider failure; stopped without retry. Completed records preserved in {args.output}/partial.json: {error}',flush=True)
                raise SystemExit(2)
    summary=[]
    for benchmark in sorted({t['benchmark'] for t in tasks}):
        for arm in ('solo','fixed','generated'):
            group=[r for r in rows if r['benchmark']==benchmark and r['arm']==arm]
            n=len(group); solved=sum(r['correct'] for r in group); units=sum(r['input_tokens']+r['output_tokens'] for r in group)
            dollars=None if any(r['dollars'] is None for r in group) else sum(r['dollars'] for r in group)
            summary.append({'benchmark':benchmark,'arm':arm,'tasks':n,'solved':solved,'accuracy':solved/n,'calls':sum(len(r['trace']) for r in group),
                            'token_units':units,'units_per_solved':units/solved if solved else None,
                            'dollars':dollars,'dollars_per_solved':dollars/solved if dollars is not None and solved else None,
                            'seconds':sum(r['seconds'] for r in group),'errors':sum(r['error'] is not None for r in group),
                            'protocol_errors':sum(r['error_kind']=='model_protocol_failure' for r in group),
                            'infrastructure_errors':sum(r['error_kind']=='infrastructure_provider_failure' for r in group),
                            'truncated_calls':sum(r['truncated_calls'] for r in group),
                            'successful_wrong':sum(r['error'] is None and not r['correct'] for r in group)})
    result={'backend':args.backend,'model':args.model,'token_measurement':'ceil(characters/4) proxy; NOT model tokens' if args.backend=='surrogate' else 'provider reported',
            'tasks_file':str(args.tasks),'dataset_kind':'public AIME 2024 and HotpotQA subset' if any(t['benchmark']=='aime2024' for t in tasks) else 'original toy examples',
            'generation_settings':{'max_tokens':args.max_tokens,'plan_max_tokens':args.plan_max_tokens,'context':args.context,'temperature':0},
            'prices_per_million':{'input':args.input_per_million,'output':args.output_per_million},'summary':summary,'runs':rows}
    (args.output/'results.json').write_text(json.dumps(result,indent=2)+'\n')
    lines=['# Measured results',f"Backend: **{args.backend}**, model: `{args.model}`.",f"Token units: {result['token_measurement']}.",
           f"Dataset: {result['dataset_kind']}. This is not the paper's complete evaluation. Invalid plans count as model/orchestration failures and incorrect answers; provider errors are separate technical failures. All successful call tokens are charged.",
           '| Benchmark | Arm | Correct | Invalid plans | Provider errors | Length-capped calls | Calls | Token units / correct | Dollars / correct |', '|---|---|---:|---:|---:|---:|---:|---:|---:|']
    for s in summary:
        u='undefined' if s['units_per_solved'] is None else f"{s['units_per_solved']:.1f}"
        d=('undefined' if not s['solved'] else 'unavailable') if s['dollars_per_solved'] is None else f"{s['dollars_per_solved']:.6f}"
        lines.append(f"| {s['benchmark']} | {s['arm']} | {s['solved']}/{s['tasks']} | {s['protocol_errors']} | {s['infrastructure_errors']} | {s['truncated_calls']} | {s['calls']} | {u} | {d} |")
    text='\n\n'.join(lines[:4])+'\n\n'+'\n'.join(lines[4:])+'\n'
    (args.output/'RESULTS.md').write_text(text)
    print(text)
    print('Raw traces:',args.output/'results.json')
    if all(r['error'] is not None for r in rows): raise SystemExit(1)

if __name__=='__main__': main()
