#!/usr/bin/env python3
"""Build a static recorded-results explorer. Standard library; no inference/network."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent


def build(output):
    output = Path(output)
    if output.resolve() == ROOT:
        raise ValueError('Output must be a separate directory, not the project root')
    output.mkdir(parents=True, exist_ok=True)
    data_dir = output / 'data'
    data_dir.mkdir(exist_ok=True)
    for name in ('index.html', 'app.js', 'style.css', 'favicon.svg'):
        shutil.copyfile(ROOT / 'pages' / name, output / name)
    (output / '.nojekyll').write_text('')
    sources = {
        'official.json': 'results-qwen3-cpu/results.json',
        'calibration.json': 'results-qwen3-toy/results.json',
        'official-before-wrapper-normalization.json': 'results-qwen3-cpu/results.before-xml-answer-normalization.json',
        'calibration-before-wrapper-normalization.json': 'results-qwen3-toy/results.before-xml-answer-normalization.json',
        'interrupted-attempt.json': 'results-qwen3-cpu-interrupted/ATTEMPT.json',
        'README.md': 'README.md', 'DATA.md': 'DATA.md', 'DATA_PROVENANCE.json': 'DATA_PROVENANCE.json',
        'RUN_METADATA.json': 'RUN_METADATA.json', 'MODEL_RUNS.md': 'MODEL_RUNS.md',
    }
    manifest = {'kind': 'recorded experiment explorer; no live model calls', 'artifacts': []}
    for target, source in sources.items():
        raw = (ROOT / source).read_bytes()
        if target in ('official.json', 'calibration.json'):
            record = json.loads(raw)
            if record['token_measurement'] != 'provider reported' or record['backend'] == 'surrogate':
                raise ValueError('Pages evidence must use real provider-reported inference')
            if len(record['runs']) != 36:
                raise ValueError('Expected all three arms on twelve tasks')
            for row in record['summary']:
                runs = [r for r in record['runs'] if r['benchmark'] == row['benchmark'] and r['arm'] == row['arm']]
                if row['solved'] != sum(r['correct'] for r in runs):
                    raise ValueError('Inconsistent recorded score')
                if row['token_units'] != sum(r['input_tokens'] + r['output_tokens'] for r in runs):
                    raise ValueError('Inconsistent token accounting')
        (data_dir / target).write_bytes(raw)
        manifest['artifacts'].append({'path': 'data/' + target, 'source': source,
                                      'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)})
    (data_dir / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Built {output}: static HTML/CSS/JS + exact saved records; no model calls.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'docs')
    build(parser.parse_args().output)
