#!/usr/bin/env python3
"""Combine actual model run folders without rerunning inference."""
import argparse
import json
from pathlib import Path
from harness import summarize
from live_experiment import write_summary

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('inputs',nargs='+',type=Path)
    p.add_argument('--output',type=Path,default=Path('results-models'))
    a=p.parse_args()
    records=[];configs=[]
    for folder in a.inputs:
        source=json.loads((folder/'records.json').read_text())
        config=json.loads((folder/'config.json').read_text())
        expected={(config['model'],method,level,length,config['seed']+sample)
                  for method in config['methods'] for level in config['levels']
                  for length in config['lengths'] for sample in range(config['samples'])}
        actual={(r['model'],r['method'],r['level'],r['length'],r['seed']) for r in source}
        if actual!=expected or len(source)!=len(expected):
            p.error(f'{folder}: incomplete or duplicated run ({len(source)} records; expected {len(expected)}); wait for the run to finish')
        records.extend(source)
        configs.append({'source':str(folder),'config':config})
    # Prevent accidental double inclusion or mismatched task families.
    seen=set()
    families=set()
    for entry in configs:
        c=entry['config']
        families.add((c['variables'],c['seed'],c['samples'],c['chunk_size'],
                      c['max_tokens'],c.get('raw_max_tokens',64),c['context'],
                      c['disable_thinking'],tuple(c['levels']),tuple(c['lengths']),
                      tuple(c['methods'])))
    if len(families)!=1:p.error('input runs differ in tasks, sampling, context, or decoding protocol')
    for r in records:
        key=(r['model'],r['method'],r['level'],r['length'],r['seed'])
        if key in seen:p.error(f'duplicate measurement: {key}')
        seen.add(key)
    a.output.mkdir(parents=True,exist_ok=True)
    (a.output/'records.json').write_text(json.dumps(records,indent=2))
    (a.output/'config.json').write_text(json.dumps(configs,indent=2))
    summarize(records,a.output,'openai',title='Real model accuracy: raw, model-written state, and model-delegated tool')
    write_summary(records,a.output)
