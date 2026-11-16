#!/usr/bin/env python3
"""Recompute exact-match scores from raw responses; makes no inference calls.

The original result file is preserved before accepting the model's explicit
<answer>...</answer> wrapper in addition to FINAL: and boxed answers.
"""
import argparse
import json
from pathlib import Path
from orchestrator import extract_answer, grade


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('result', type=Path)
    parser.add_argument('--tasks', type=Path, default=Path(__file__).with_name('benchmark_tasks.json'))
    args = parser.parse_args()
    data = json.loads(args.result.read_text())
    tasks = {t['id']: t for t in json.loads(args.tasks.read_text())}
    backup = args.result.with_name('results.before-xml-answer-normalization.json')
    if not backup.exists():
        backup.write_text(args.result.read_text())
    changed = 0
    for row in data['runs']:
        task = tasks[row['id']]
        if str(task['answer']) != row['expected']:
            raise ValueError('Stored label differs from task dataset')
        correct = row['error'] is None and grade(task, row['answer'])
        changed += int(correct != row['correct'])
        row['correct'] = correct
        row['extracted_answer'] = extract_answer(row['answer'])
        row['error_kind'] = ('model_protocol_failure' if row['arm']=='generated' and row['error'] and row['error'].startswith(('ValueError:', 'SyntaxError:')) else 'infrastructure_provider_failure' if row['error'] else None)
        row['truncated_calls'] = sum(t.get('finish_reason')=='length' for t in row['trace'])
    for summary in data['summary']:
        rows = [r for r in data['runs'] if r['benchmark'] == summary['benchmark'] and r['arm'] == summary['arm']]
        solved = sum(r['correct'] for r in rows)
        summary.update(solved=solved, accuracy=solved/len(rows),
                       protocol_errors=sum(r['error_kind']=='model_protocol_failure' for r in rows),
                       infrastructure_errors=sum(r['error_kind']=='infrastructure_provider_failure' for r in rows),
                       successful_wrong=sum(r['error'] is None and not r['correct'] for r in rows),
                       truncated_calls=sum(r['truncated_calls'] for r in rows),
                       units_per_solved=summary['token_units']/solved if solved else None,
                       dollars_per_solved=summary['dollars']/solved if solved and summary['dollars'] is not None else None)
    data['scoring_note'] = {'change':'Accept explicit XML <answer>...</answer> wrapper uniformly, without consulting labels; no model reruns or label changes.',
                            'initial_grader_backup':backup.name,'correctness_changes':changed}
    args.result.write_text(json.dumps(data, indent=2)+'\n')
    lines = ['# Real-model measured results', '', f"Backend: {data['backend']}; model: {data['model']}; tokens: {data['token_measurement']}.", '',
             f"Dataset: {data.get('dataset_kind','see tasks file')}; tiny convenience sample, not full-paper evaluation. Zero local API fees exclude hardware/energy. Invalid generated plans count as model/orchestration failures and incorrect answers; provider errors are separate technical failures. All successful call tokens, including unsolved tasks and invalid-plan outputs, are charged.", '',
             '| Benchmark | Arm | Correct | Invalid plans | Provider errors | Length-capped calls | Calls | Tokens | Tokens / solved | API fees / solved |',
             '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|']
    for s in data['summary']:
        units = 'undefined' if s['units_per_solved'] is None else f"{s['units_per_solved']:.1f}"
        dollars = 'undefined' if s['dollars_per_solved'] is None else f"${s['dollars_per_solved']:.6f}"
        lines.append(f"| {s['benchmark']} | {s['arm']} | {s['solved']}/{s['tasks']} | {s['protocol_errors']} | {s['infrastructure_errors']} | {s['truncated_calls']} | {s['calls']} | {s['token_units']} | {units} | {dollars} |")
    lines += ['', f'Grader normalization: XML answer wrappers accepted uniformly after inference. Correctness changes: {changed}. Initial derived scores retained in `{backup.name}`; all raw responses unchanged.', '']
    (args.result.parent/'RESULTS.md').write_text('\n'.join(lines))
    print('\n'.join(lines))

if __name__ == '__main__':
    main()
