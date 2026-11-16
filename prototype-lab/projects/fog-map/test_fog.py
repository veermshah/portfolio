import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch
import io
import json
import fog

class FogTests(unittest.TestCase):
    def test_sample_disagreements_and_lines(self):
        spec = Path('sample-spec.md').read_text()
        answers = [fog.validate(fog.offline(spec, p), len(spec.splitlines())) for p in fog.PERSONAS]
        findings = fog.compare(spec, answers)
        self.assertGreaterEqual(len(findings), 3)
        self.assertTrue(all(f['spec'] == spec.splitlines()[f['line']-1] for f in findings))
        self.assertTrue(all(len(set(f['assumptions'].values())) == 3 for f in findings))
        self.assertEqual([f['severity'] for f in findings], sorted([f['severity'] for f in findings], reverse=True))

    def test_agreement_and_missing_coverage_are_not_disagreements(self):
        answers = [dict(persona=p, decisions=[dict(line=1, topic='x', impact=3, assumption='same')]) for p in fog.PERSONAS]
        self.assertEqual(fog.compare('text', answers), [])
        answers[1]['decisions'] = []
        answers[2]['decisions'] = []
        self.assertEqual(fog.compare('text', answers), [])

    def test_html_escaping(self):
        spec = 'daily <script>alert(1)</script>'
        answers = [fog.offline(spec, p) for p in fog.PERSONAS]
        with tempfile.TemporaryDirectory() as td:
            fog.write_reports(Path(td), spec, answers, fog.compare(spec, answers), 'offline')
            page = (Path(td) / 'report.html').read_text()
            self.assertNotIn('<script>', page)
            self.assertIn('&lt;script&gt;', page)

    def test_live_transport_preserves_evidence(self):
        interpretation = dict(data_model={'Habit': ['id']}, endpoints=['GET /habits'],
                              decisions=[dict(line=1, topic='day boundary', impact=3, assumption='Local midnight.')])
        response = dict(model='test-model', usage={'total_tokens': 123},
                        choices=[{'message': {'content': json.dumps(interpretation)}}])
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'placeholder'}), patch('urllib.request.urlopen', return_value=io.BytesIO(json.dumps(response).encode())) as send:
            answer = fog.remote('daily habits', 'backend engineer', 'api')
        fog.validate(answer, 1)
        self.assertEqual(answer['provider_evidence']['usage']['total_tokens'], 123)
        self.assertEqual(json.loads(answer['provider_evidence']['raw_content']), interpretation)
        request_body = json.loads(send.call_args.args[0].data)
        self.assertIn('Numbered spec:', request_body['messages'][0]['content'])
        self.assertIn('day boundary', request_body['messages'][0]['content'])

    def test_empty_recognized_topics(self):
        self.assertEqual(fog.compare('Build a blue button.', [fog.offline('Build a blue button.', p) for p in fog.PERSONAS]), [])

if __name__ == '__main__':
    unittest.main()
