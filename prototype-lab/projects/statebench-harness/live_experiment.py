#!/usr/bin/env python3
"""Real model state tracking: raw answer versus model-produced JSON state.

CPU controls and exact-tool upper bounds remain in harness.py. This driver never
uses the reference state to repair model predictions.
"""
import argparse
import collections
import http.client
import json
import os
from pathlib import Path
import random
import time
import urllib.error
import urllib.request

from harness import State, LEVELS, summarize


def make_task(level, length, seed, variables=4):
    """Low-alphabet, reproducible family. Every assignment counts as one step."""
    if level not in LEVELS or length < variables or variables < 2:
        raise ValueError('unknown level, too few statements, or variables < 2')
    rng = random.Random(seed)
    names = [f'v{i}' for i in range(variables)]
    ops = [{'op':'set', 'x':x, 'value':rng.randrange(10)} for x in names]
    for i in range(variables, length):
        x, y = rng.sample(names, 2)
        if level == 'immutable':
            x = f'v{i}'
            # Several source constants, plus independent literals, avoid an
            # immutable family where every variable has the same value.
            op = ({'op':'set','x':x,'value':rng.randrange(10)} if rng.random()<.25
                  else {'op':'copy','x':x,'y':rng.choice(names)})
            names.append(x)
        elif level == 'overwrite':
            op = ({'op':'set','x':x,'value':rng.randrange(10)} if rng.random()<.5
                  else {'op':'copy','x':x,'y':y})
        elif level == 'self':
            op = ({'op':'add','x':x,'value':rng.choice([-3,-2,-1,1,2,3])} if rng.random()<.7
                  else {'op':'copy','x':x,'y':y})
        else:
            kind = rng.choice(['add','copy','ref','swap'])
            op = {'op':kind,'x':x}
            if kind=='add': op['value']=rng.choice([-3,-2,-1,1,2,3])
            else: op['y']=y
        ops.append(op)
    query = names[-1] if level=='immutable' else names[0]
    return ops, query


def statements(ops):
    lines=[]
    for op in ops:
        kind,x=op['op'],op['x']
        if kind=='set': line=f"{x} = {op['value']}"
        elif kind=='copy': line=f"{x} = {op['y']}"
        elif kind=='add': line=f"{x} += {op['value']}"
        elif kind=='ref': line=f"alias {x} = {op['y']}"
        else: line=f"swap {x}, {op['y']}"
        lines.append(line)
    return '\n'.join(lines)


def oracle(ops):
    state=State()
    for op in ops: state.step(op)
    return state


def public_state(state, reference=False):
    values=state.answer(sorted(state.bindings))
    result={'values':values}
    if reference:
        by_cell=collections.defaultdict(list)
        for x,cell in state.bindings.items():by_cell[cell].append(x)
        result['aliases']=sorted([sorted(group) for group in by_cell.values()])
    return result


def state_names(ops):
    return sorted({o['x'] for o in ops})


def validate_state(result, expected_names, reference):
    """Validate only structure, never compare values to oracle.

    All reference variables must appear exactly once in the alias partition and
    variables in the same group must have equal predicted values.
    """
    if not isinstance(result,dict) or set(result)!=({'values','aliases'} if reference else {'values'}):
        raise ValueError('state must have exactly values and (for references) aliases')
    values=result['values']
    if not isinstance(values,dict) or set(values)!=set(expected_names):
        raise ValueError('state values must contain every live variable, no extras')
    if any(type(v) is not int for v in values.values()):
        raise ValueError('state values must be integers')
    if reference:
        groups=result['aliases']
        if not isinstance(groups,list) or any(not isinstance(g,list) or not g for g in groups):
            raise ValueError('aliases must be a partition of nonempty arrays')
        flat=[x for group in groups for x in group]
        if any(not isinstance(x,str) for x in flat) or sorted(flat)!=sorted(expected_names):
            raise ValueError('aliases must cover all variable names exactly once')
        for group in groups:
            if len({values[x] for x in group})!=1:
                raise ValueError('aliased variables have inconsistent predicted values')
    return result


BASE_RULES='''Track this integer program exactly in order. Variables hold integer cells.
x = 5 writes 5 into x's existing cell; a new x gets its own cell.
x = y copies y's CURRENT VALUE into x's cell; it does not create an alias.
x += k increments the cell of x by k.
alias x = y rebinds x to the SAME cell as y; later writes through either name change both.
swap x, y exchanges their cell bindings simultaneously, not their integer values.
All arithmetic is exact, without overflow. Return JSON only. Do not explain.'''


def raw_prompt(ops,query):
    return (BASE_RULES+'\nProgram:\n'+statements(ops)+
            f'\nWhat is the final integer value of {query}? Return exactly {{"{query}": INTEGER}}.')


def chunk_prompt(ops,state,names,reference):
    schema='{"values":{"v0":INTEGER,"v1":INTEGER,...}}'
    if reference:
        schema='{"values":{"v0":INTEGER,...},"aliases":[["v0","v2"],["v1"],...]}'
    return (BASE_RULES+'\nStarting state (JSON): '+json.dumps(state,separators=(',',':'))+
            '\nContinue with this program chunk:\n'+statements(ops)+
            '\nReturn the FULL new state with exactly these variable names: '+','.join(names)+
            '\nFormat: '+schema+
            ('\nAliases is a partition: list every variable exactly once, grouped by shared cell. All values within an alias group must match.' if reference else '')+
            '\nNever omit an unchanged variable.')


class ModelClient:
    def __init__(self,args):
        self.base_url=args.base_url.rstrip('/')
        self.model=args.model
        self.context=args.context
        self.max_tokens=args.max_tokens
        self.raw_max_tokens=getattr(args,'raw_max_tokens',64)
        self.timeout=args.timeout
        self.key=os.getenv(args.key_env,'')
        self.disable_thinking=args.disable_thinking

    def request(self,path,payload):
        headers={'Content-Type':'application/json'}
        if self.key:headers['Authorization']='Bearer '+self.key
        request=urllib.request.Request(self.base_url+path,json.dumps(payload).encode(),headers)
        try:
            with urllib.request.urlopen(request,timeout=self.timeout) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            body=error.read().decode(errors='replace')[:1000]
            raise RuntimeError(f'HTTP {error.code}: {body}') from error

    def complete(self,prompt,max_tokens=None):
        max_tokens=self.max_tokens if max_tokens is None else max_tokens
        # Explicit tokenizer endpoint is optional, but when supported use actual
        # tokens. Otherwise UTF-8 byte count is a conservative upper bound.
        tokens=None; tokenizer_error=None
        if self.base_url.endswith('/v1'):
            original=self.base_url
            try:
                self.base_url=original[:-3]
                encoded=self.request('/tokenize',{'content':prompt,'add_special':True})
                tokens=len(encoded['tokens'])
            except (urllib.error.URLError,RuntimeError,KeyError,TypeError,http.client.HTTPException,OSError) as error:
                tokenizer_error=str(error)
            finally:self.base_url=original
        bound=tokens if tokens is not None else len(prompt.encode('utf-8'))
        # Reserve 256 for the chat template and max_tokens for generation.
        if bound+256+max_tokens>self.context:
            return {'error':'context_limit: input plus template/output reserve exceeds configured context',
                    'prompt':prompt,'estimated_input_tokens':bound,'tokenizer_error':tokenizer_error,
                    'called':False,'seconds':0,'usage':{}}
        body={'model':self.model,'messages':[{'role':'user','content':prompt}],
              'temperature':0,'max_tokens':max_tokens,'seed':0}
        if self.disable_thinking:
            body['chat_template_kwargs']={'enable_thinking':False}
            # Qwen3's official soft switch is understood even by servers that
            # ignore chat_template_kwargs. It is identical for all methods.
            body['messages'][0]['content']=prompt+'\n/no_think'
        started=time.perf_counter()
        try:
            result=self.request('/chat/completions',body)
            choice=result['choices'][0]
            content=choice['message'].get('content') or ''
            finish=choice.get('finish_reason')
            parsed=parse_response(content)
            return {'error':None,'prompt':prompt,'response':content,'parsed':parsed,
                    'finish_reason':finish,'server_model':result.get('model'),'usage':result.get('usage',{}),
                    'estimated_input_tokens':bound,'called':True,
                    'seconds':time.perf_counter()-started}
        except (urllib.error.URLError,RuntimeError,KeyError,ValueError,TimeoutError,http.client.HTTPException,OSError) as error:
            return {'error':f'{type(error).__name__}: {error}','prompt':prompt,'usage':{},
                    'called':True,'seconds':time.perf_counter()-started}


def parse_response(content):
    # Some Qwen3 chat templates emit an empty thinking block even with /no_think.
    # Strip only that block and an enclosing Markdown fence, not arbitrary text.
    if content.lstrip().startswith('<think>') and '</think>' in content:
        content=content.split('</think>',1)[1]
    content=content.strip()
    if content.startswith('```') and content.endswith('```'):
        content=content.split('\n',1)[1].rsplit('```',1)[0].strip()
    try:return json.loads(content)
    except (ValueError,TypeError):return None


def raw_prediction(client,ops,query):
    call=client.complete(raw_prompt(ops,query),max_tokens=client.raw_max_tokens)
    calls=[call]
    value=call.get('parsed')
    valid=isinstance(value,dict) and set(value)=={query} and type(value[query]) is int
    return (value if valid else None),calls,None if valid else ('transport_or_context' if call.get('error') else 'invalid_answer_json')


def model_scratchpad(client,ops,query,chunk_size,path):
    reference=any(op['op'] in ('ref','swap') for op in ops)
    # Preserve reference schema even on short programs before their first alias.
    state={'values':{}}
    if reference:state['aliases']=[]
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(state))
    calls=[]
    immutable=len({op['x'] for op in ops})==len(ops)
    for start in range(0,len(ops),chunk_size):
        chunk=ops[start:start+chunk_size]
        state=json.loads(path.read_text())
        observed_names=set(state['values']) | {o['x'] for o in chunk}
        prompt=chunk_prompt(chunk,state,sorted(observed_names),reference)
        call=client.complete(prompt);calls.append(call)
        if call.get('error'):return None,calls,'transport_or_context'
        try:state=validate_state(call.get('parsed'),sorted(observed_names),reference)
        except ValueError as error:
            call['validation_error']=str(error)
            return None,calls,'invalid_state_json'
        # The model prediction is persisted unchanged. No oracle state reaches
        # this function; errors can propagate exactly as they would in an agent.
        if immutable:
            # Static liveness pruning reads only future operand NAMES, never
            # their values or oracle state. Keep every future dependency.
            needed={query} | {op['y'] for op in ops[start+len(chunk):] if 'y' in op}
            state['values']={x:v for x,v in state['values'].items() if x in needed}
        path.write_text(json.dumps(state,sort_keys=True))
    return {query:state['values'][query]},calls,None


def model_tool(client,ops,query,path):
    """Model chooses an exact tool, then reads its persisted output.

    The tool is a disclosed deterministic interpreter, not a model-written state
    recovery result. Tool execution only occurs after a valid model request.
    """
    prompt=(BASE_RULES+'\nProgram:\n'+statements(ops)+
            '\nAn execute_state tool can run this complete supplied program and persist its state. '
            'Request that tool by returning exactly {"tool":"execute_state"}. Do not execute mentally.')
    choice=client.complete(prompt,max_tokens=client.raw_max_tokens)
    calls=[choice]
    if choice.get('error'):return None,calls,'transport_or_context'
    if choice.get('parsed')!={'tool':'execute_state'}:return None,calls,'invalid_tool_request'
    path.parent.mkdir(parents=True,exist_ok=True)
    state=State()
    path.write_text(json.dumps(state.snapshot()))
    for op in ops:
        # Deterministic tool semantics operate on the INPUT operations only.
        # This is independent of the expected answer held by the caller.
        state=State(json.loads(path.read_text()))
        state.step(op)
        path.write_text(json.dumps(state.snapshot(),sort_keys=True))
    values=state.answer(sorted(state.bindings))
    calls.append({'called':False,'event':'execute_state','operations':len(ops),
                  'persisted_path':str(path),'usage':{},'error':None})
    answer_call=client.complete('Read the tool output JSON and return the queried integer. '
                               'Tool output: '+json.dumps(values,separators=(',',':'))+
                               f'\nQuery: {query}. Return exactly {{"{query}": INTEGER}}. JSON only.',
                               max_tokens=client.raw_max_tokens)
    calls.append(answer_call)
    if answer_call.get('error'):return None,calls,'transport_or_context'
    answer=answer_call.get('parsed')
    valid=isinstance(answer,dict) and set(answer)=={query} and type(answer[query]) is int
    return (answer if valid else None),calls,None if valid else 'invalid_answer_json'


def save(records,args,out):
    (out/'records.json').write_text(json.dumps(records,indent=2))
    (out/'config.json').write_text(json.dumps(vars(args),indent=2))


def run(args):
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    client=ModelClient(args)
    records=[]
    for level in args.levels:
      for n in args.lengths:
       for sample in range(args.samples):
        seed=args.seed+sample
        ops,query=make_task(level,n,seed,args.variables)
        # Truth is computed for scoring only; never sent to either predictor.
        truth=oracle(ops).answer([query])
        task_path=out/'tasks'/f'{level}-{n}-{seed}.json'
        task_path.parent.mkdir(exist_ok=True)
        task_path.write_text(json.dumps({'level':level,'seed':seed,'operations':ops,'query':query},indent=2))
        for method in args.methods:
            started=time.perf_counter()
            if method=='raw':answer,calls,failure=raw_prediction(client,ops,query)
            elif method=='model-scratchpad':answer,calls,failure=model_scratchpad(client,ops,query,args.chunk_size,out/'state'/f'{level}-{n}-{seed}.json')
            else:answer,calls,failure=model_tool(client,ops,query,out/'tool-state'/f'{level}-{n}-{seed}.json')
            errors=[c['error'] for c in calls if c.get('error')]
            usage={'prompt_tokens':sum(c.get('usage',{}).get('prompt_tokens',0) for c in calls),
                   'completion_tokens':sum(c.get('usage',{}).get('completion_tokens',0) for c in calls)}
            record=dict(level=level,length=n,sample=sample,seed=seed,model=args.model,
                        method=method,correct=answer==truth,error='; '.join(errors) if errors else None,
                        failure=failure,answer=answer,expected=truth,query=query,
                        calls=sum(c.get('called',False) for c in calls),usage=usage,
                        seconds=time.perf_counter()-started,trace=calls)
            records.append(record)
            save(records,args,out)
            print(f'{args.model} {level} {n} seed={seed} {method}: correct={record["correct"]} calls={record["calls"]} failure={failure}',flush=True)
    summarize(records,out,'openai',title='Real model accuracy: raw, model-written state, and model-delegated tool')
    write_summary(records,out)


def write_summary(records,out):
    groups=collections.defaultdict(list)
    for row in records:groups[(row['model'],row['method'],row['length'])].append(row)
    lines=['# Actual model measurements','',
           'Single queried variable; all four levels. Invalid model JSON is incorrect. Transport/context errors are counted separately and excluded from valid accuracy.', '',
           '|Model|Method|Assignments|Correct / valid|Errors|Calls|Input tokens|Output tokens|Seconds|',
           '|---|---|---:|---:|---:|---:|---:|---:|---:|']
    for (model,method,length),rows in sorted(groups.items()):
        valid=[r for r in rows if not r['error']]
        lines.append(f'|{model}|{method}|{length}|{sum(r["correct"] for r in valid)} / {len(valid)}|{len(rows)-len(valid)}|{sum(r["calls"] for r in rows)}|{sum(r["usage"]["prompt_tokens"] for r in rows)}|{sum(r["usage"]["completion_tokens"] for r in rows)}|{sum(r["seconds"] for r in rows):.1f}|')
    (out/'summary.md').write_text('\n'.join(lines)+'\n')
    plot_overall(records,out)


def plot_overall(records,out):
    os.environ.setdefault('MPLCONFIGDIR','/tmp/statebench-matplotlib')
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    groups=collections.defaultdict(list)
    for row in records:groups[(row['model'],row['method'],row['length'])].append(row)
    series=collections.defaultdict(list)
    for (model,method,length),rows in groups.items():
        valid=[r for r in rows if not r['error']]
        score=sum(r['correct'] for r in valid)/len(valid) if valid else float('nan')
        series[(model,method)].append((length,score))
    fig,ax=plt.subplots(figsize=(10,6))
    styles={'raw':'-','model-scratchpad':'--','model-tool':':'}
    model_names=sorted({k[0] for k in series})
    colors={model:f'C{i}' for i,model in enumerate(model_names)}
    markers={model:('o','x','s','^')[i%4] for i,model in enumerate(model_names)}
    for (model,method),points in sorted(series.items()):
        points.sort()
        ax.plot([p[0] for p in points],[p[1] for p in points],marker=markers[model],
                linestyle=styles.get(method,'-'),color=colors[model],label=model+' / '+method)
    ax.set(xlabel='Assignments',ylabel='Single-query accuracy across all four levels',
           xscale='log',ylim=(-.05,1.05),title='Actual CPU model measurements — small synthetic sample')
    lengths=sorted({r['length'] for r in records})
    ax.set_xticks(lengths,labels=[str(n) for n in lengths])
    ax.grid(alpha=.3);ax.legend(fontsize=8)
    counts={len(rows) for rows in groups.values()}
    count_note=f'{next(iter(counts))} cases per point. ' if len(counts)==1 else 'Counts vary; see summary.md. '
    fig.text(.5,.01,count_note+'No frontier/official-dataset reproduction; invalid model outputs count as wrong.',ha='center',fontsize=8)
    fig.tight_layout(rect=(0,.035,1,1));fig.savefig(out/'accuracy-overall.png',dpi=140);plt.close(fig)


def parser():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--base-url',default=os.getenv('OPENAI_BASE_URL','http://127.0.0.1:8000/v1'))
    p.add_argument('--key-env',default='OPENAI_API_KEY')
    p.add_argument('--model',required=True)
    p.add_argument('--context',type=int,default=8192)
    p.add_argument('--max-tokens',type=int,default=256)
    p.add_argument('--raw-max-tokens',type=int,default=64)
    p.add_argument('--timeout',type=int,default=300)
    p.add_argument('--disable-thinking',action=argparse.BooleanOptionalAction,default=True)
    p.add_argument('--levels',choices=LEVELS,nargs='+',default=list(LEVELS))
    p.add_argument('--lengths',type=int,nargs='+',default=[8,32,128])
    p.add_argument('--variables',type=int,default=4)
    p.add_argument('--samples',type=int,default=1)
    p.add_argument('--seed',type=int,default=42)
    p.add_argument('--methods',choices=['raw','model-scratchpad','model-tool'],nargs='+',default=['raw','model-scratchpad','model-tool'])
    p.add_argument('--chunk-size',type=int,default=8)
    p.add_argument('--output',default='results-live')
    return p


if __name__=='__main__':
    p=parser();args=p.parse_args()
    if args.variables<2 or args.variables>8 or any(n<8 or n>64000 for n in args.lengths):p.error('variables 2..8, lengths 8..64000 required')
    if args.samples<1 or args.chunk_size<1 or args.context<1024 or args.max_tokens<1:p.error('positive sample/chunk/token budgets required')
    run(args)
