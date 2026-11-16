#!/usr/bin/env python3
"""Line-attributed interpretation divergence reports; Python standard library only."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import html
import json
import os
from pathlib import Path
import re
import urllib.request
import time

PERSONAS = ['backend engineer', 'frontend engineer', 'QA engineer']
# Explicit offline policy alternatives, NOT model-generated interpretations.
RULES = [
 ('daily', 'day boundary', 3, ['UTC calendar day', 'user local calendar day', 'rolling 24-hour window']),
 ('grace', 'missed-day grace', 3, ['24 hours after deadline', 'one forgiveness token per week', 'no reset until 48 hours of inactivity']),
 ('team', 'team habit ownership', 3, ['shared team habit with individual check-ins', 'one collective team completion', 'copied personal habits with aggregate progress']),
 ('past', 'historical edits', 3, ['edits recalculate all subsequent streaks', 'edits change calendar display only', 'edits restricted to previous seven days']),
 ('notif', 'notification delivery', 2, ['email at 20:00 UTC', 'in-app banner at local 20:00', 'push two hours before each personal deadline']),
]

def offline(spec, persona):
    i = PERSONAS.index(persona)
    decisions = []
    for line, content in enumerate(spec.splitlines(), 1):
        for word, topic, impact, choices in RULES:
            if word in content.lower():
                decisions.append(dict(line=line, topic=topic, impact=impact, assumption=choices[i]))
    models = [
        {'Habit': ['id', 'owner_id', 'team_id'], 'CheckIn': ['habit_id', 'user_id', 'utc_date']},
        {'HabitCard': ['id', 'team_id', 'collective_done'], 'CalendarEntry': ['habit_id', 'local_day']},
        {'PersonalHabit': ['id', 'source_team_habit'], 'CheckIn': ['habit_id', 'timestamp', 'edit_audit']},
    ]
    endpoints = [
        ['POST /habits/{id}/check-ins', 'PATCH /check-ins/{id}', 'GET /teams/{id}/progress'],
        ['POST /teams/{id}/habits/{habit}/complete', 'GET /calendar', 'GET /notifications'],
        ['POST /personal-habits/{id}/check-ins', 'PATCH /check-ins/{id}', 'GET /streak-audit'],
    ]
    return dict(persona=persona, data_model=models[i], endpoints=endpoints[i], decisions=decisions)

def remote(spec, persona, backend, evidence_dir=None):
    numbered = '\n'.join(f'{i}: {s}' for i, s in enumerate(spec.splitlines(), 1))
    priorities = {
        'backend engineer': 'Prioritize storage consistency and simple server-side implementation.',
        'frontend engineer': 'Prioritize intuitive user experience and user-visible behavior.',
        'QA engineer': 'Prioritize predictable edge cases and testable acceptance criteria.',
    }
    questions = {'day boundary': 'Exactly when does the day end, and in which timezone?',
                 'missed-day grace': 'How long is the grace period, and how often is it available?',
                 'team habit ownership': 'Who owns a shared habit, and whose completion counts?',
                 'historical edits': 'What is the edit time limit, and do edits recompute streaks?',
                 'notification delivery': 'Which channel, recipients, and trigger time?'}
    slots = [dict(line=i, topic=topic, question=questions[topic]) for i, line in enumerate(spec.splitlines(), 1)
             for word, topic, _, _ in RULES if word in line.lower()]
    prompt = (f"You are a {persona}. {priorities[persona]}\n"
              "Independently design the application described below. Make concrete choices wherever the spec is ambiguous.\n"
              "Return one JSON object with keys data_model (object mapping entity names to field lists), "
              "endpoints (list of at most 3 METHOD /path strings, never objects), and decisions (list of objects). Keep data_model to 3 entities with field NAME LISTS, never nested objects. "
              "Each decision must have line (integer), topic (string), impact (integer 1 cosmetic, 2 UX, 3 data/correctness), "
              "and assumption (your concrete implementation choice, at least one full sentence).\n"
              "For every following source/topic pair, produce exactly one decision. Copy only its line and topic; "
              "Answer its question with a concrete implementation policy in <=25 words, using your engineering judgement. Do not paraphrase the requirement or leave the question unanswered. "
              + json.dumps(slots) + "\n" if slots else "")
    if not slots:
        prompt = f"As a {persona}, return JSON with data_model object, endpoints list, and decisions list of line, topic, impact (1-3), assumption. Find ambiguous choices."
    prompt += "\nDo not repeat schema placeholders. No Markdown. /no_think\nNumbered spec:\n" + numbered
    if backend == 'ollama':
        url = os.getenv('OLLAMA_HOST', 'http://localhost:11434').rstrip('/') + '/api/chat'
        body = dict(model=os.getenv('OLLAMA_MODEL', 'qwen3:4b'), stream=False, format='json',
                    messages=[dict(role='user', content=prompt)])
        headers = {'Content-Type': 'application/json'}
    else:
        key = os.getenv('OPENAI_API_KEY')
        if not key:
            raise ValueError('OPENAI_API_KEY is required for --backend api; use --backend offline for labeled rules demo')
        url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1').rstrip('/') + '/chat/completions'
        body = dict(model=os.getenv('FOG_MODEL', 'gpt-4o-mini'), messages=[dict(role='user', content=prompt)],
                    response_format={'type': 'json_object'}, temperature=0.7, max_tokens=1800)
        headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key}
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers)
    started = time.monotonic()
    if evidence_dir is not None:
        evidence_dir.mkdir(parents=True, exist_ok=True)
        (evidence_dir / ('request-' + persona.split()[0] + '.json')).write_text(json.dumps(body, indent=2))
    with urllib.request.urlopen(req, timeout=600) as response:
        result = json.load(response)
    if evidence_dir is not None:
        evidence_dir.mkdir(parents=True, exist_ok=True)
        (evidence_dir / ('raw-response-' + persona.split()[0] + '.json')).write_text(json.dumps(dict(request=body, response=result), indent=2))
    content = result['message']['content'] if backend == 'ollama' else result['choices'][0]['message']['content']
    raw_content = content
    content = re.sub(r'<think>.*?</think>', '', content, flags=re.S).strip()
    content = re.sub(r'^```(?:json)?\s*|\s*```$', '', content.strip())
    answer = json.loads(content)
    answer['persona'] = persona
    answer['provider_evidence'] = dict(model=result.get('model', body['model']), usage=result.get('usage'), elapsed_seconds=round(time.monotonic()-started, 3), raw_content=raw_content)
    return answer

def validate(answer, line_count):
    if not isinstance(answer.get('data_model'), dict) or not isinstance(answer.get('endpoints'), list):
        raise ValueError('Interpretation missing data_model/endpoints')
    if not answer['data_model'] or not all(isinstance(k, str) and ((isinstance(v, list) and all(isinstance(f, str) for f in v)) or isinstance(v, dict)) for k, v in answer['data_model'].items()):
        raise ValueError('Invalid data model fields')
    if not all(isinstance(e, str) or (isinstance(e, dict) and isinstance(e.get('method'), str) and isinstance(e.get('path'), str)) for e in answer['endpoints']):
        raise ValueError('Endpoint sketches must be strings or method/path objects')
    if not isinstance(answer.get('decisions'), list):
        raise ValueError('Interpretation missing decisions')
    seen = set()
    for d in answer['decisions']:
        if type(d.get('line')) is not int or not 1 <= d['line'] <= line_count:
            raise ValueError('Invalid source line')
        if type(d.get('impact')) is not int or d['impact'] not in (1, 2, 3):
            raise ValueError('Invalid impact')
        for field in ('topic', 'assumption'):
            if not isinstance(d.get(field), str) or not d[field].strip():
                raise ValueError('Invalid decision ' + field)
        key = (d['line'], d['topic'].strip().lower())
        if key in seen:
            raise ValueError('Duplicate topic on same source line')
        seen.add(key)
    return answer

def compare(spec, answers):
    groups = {}
    for a in answers:
        for d in a['decisions']:
            key = (d['line'], d['topic'].strip().lower())
            groups.setdefault(key, {})[a['persona']] = d
    result = []
    for (line, topic), values in groups.items():
        choices = {p: values[p]['assumption'] if p in values else '[not addressed]' for p in PERSONAS}
        normalized = {p: ' '.join(s.lower().split()).rstrip('.') for p, s in choices.items()}
        # Missing coverage is not a competing implementation assumption.
        present = [p for p in PERSONAS if p in values]
        disagreements = sum(normalized[a] != normalized[b] for i, a in enumerate(present) for b in present[i+1:])
        if not disagreements:
            continue
        impact = max(d['impact'] for d in values.values())
        result.append(dict(line=line, topic=topic, spec=spec.splitlines()[line-1], assumptions=choices,
                           disagreeing_pairs=disagreements, impact=impact, severity=disagreements * impact))
    return sorted(result, key=lambda r: (-r['severity'], r['line'], r['topic']))

def write_reports(out, spec, answers, findings, backend):
    out.mkdir(parents=True, exist_ok=True)
    label = 'OFFLINE RULES DEMO — no LLM calls or independent model evidence' if backend == 'offline' else f'Live {backend}: three independent model requests'
    md = ['# Fog Map ambiguity report', '', label, '',
          'Severity = differing agent pairs (0–3) × maximum impact (1–3). Textual comparison; semantically equivalent phrasing can be overflagged.', '']
    for rank, f in enumerate(findings, 1):
        md += [f"## {rank}. {f['topic']} — severity {f['severity']}/9", f"Line {f['line']}: {f['spec']}", '']
        md += [f"- **{p}:** {v}" for p, v in f['assumptions'].items()]
        md += ['']
    md += ['## Full interpretations', '']
    for a in answers:
        md += [f"### {a['persona']}", '```json', json.dumps(a, indent=2), '```', '']
    (out / 'report.md').write_text('\n'.join(md))
    cards = []
    for rank, f in enumerate(findings, 1):
        rows = ''.join(f'<tr><th>{html.escape(p)}</th><td>{html.escape(v)}</td></tr>' for p, v in f['assumptions'].items())
        cards.append(f"<article><h2>{rank}. {html.escape(f['topic'])} <small>{f['severity']}/9</small></h2><blockquote>Line {f['line']}: {html.escape(f['spec'])}</blockquote><table>{rows}</table></article>")
    artifacts = ''.join('<h2>'+html.escape(a['persona'])+'</h2><pre>'+html.escape(json.dumps(a, indent=2))+'</pre>' for a in answers)
    page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Fog Map</title><style>body{font:16px system-ui;background:#f1f5f9;color:#172033;max-width:1000px;margin:40px auto;padding:20px}article{background:white;padding:24px;margin:20px 0;border-radius:12px}small{float:right;color:#a32d16}th,td{text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid #ddd}blockquote{margin:20px 0;color:#526172}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>Fog Map</h1><p>''' + html.escape(label) + '</p><p>Severity: differing agent pairs × impact. Textual comparison can overflag equivalent phrasing.</p>' + ''.join(cards) + '<h1>Full interpretations</h1>'+artifacts+'</html>'
    (out / 'report.html').write_text(page)
    (out / 'evidence.json').write_text(json.dumps(dict(backend=backend, label=label, spec=spec, interpretations=answers, findings=findings), indent=2))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('spec', type=Path)
    parser.add_argument('--backend', choices=['offline', 'api', 'ollama'], default='offline')
    parser.add_argument('--out', type=Path, default=Path('output'))
    args = parser.parse_args()
    spec = args.spec.read_text()
    if not spec.strip():
        parser.error('Spec is empty')
    def interpret(persona):
        a = offline(spec, persona) if args.backend == 'offline' else remote(spec, persona, args.backend, args.out)
        return a
    with ThreadPoolExecutor(max_workers=3) as pool:
        answers = list(pool.map(interpret, PERSONAS))
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / 'raw-interpretations.json').write_text(json.dumps(answers, indent=2))
    answers = [validate(a, len(spec.splitlines())) for a in answers]
    findings = compare(spec, answers)
    write_reports(args.out, spec, answers, findings, args.backend)
    print(f'{args.backend}: {len(answers)} interpretations; {len(findings)} ambiguities; {args.out}/report.html')

if __name__ == '__main__':
    main()
