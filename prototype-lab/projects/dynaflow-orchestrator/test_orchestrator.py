import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import orchestrator as o

class HarnessTests(unittest.TestCase):
    def test_reject_executable_escape(self):
        for source in ['import os\nanswer = solve("x")', 'answer = __import__("os")', 'answer = solve.__call__("x")', 'answer = aggregate(missing)', 'answer = solve("x")\nwhile True: pass', 'answer = solve(open("/etc/passwd"))']:
            with self.subTest(source=source), self.assertRaises((ValueError,SyntaxError)):
                o.parse_program(source)

    def test_real_parallel_and_full_context(self):
        class Fake:
            trace=[]
            def call(self,task,role,history):
                self.trace.append((role,history))
                return 'a = parallel("left", "right")\nb = verify(a)\nanswer = aggregate(b)' if role == 'workflow designer' else '42'
        fake=Fake()
        result,_=o.run_arm({'question':'original'},'generated',fake)
        self.assertEqual(result,'42')
        self.assertEqual(len(fake.trace),5)
        verifier=next(h for r,h in fake.trace if r=='verifier')
        self.assertTrue(any(v.get('selected_input')==['42','42'] for v in verifier))
        self.assertEqual({v.get('role') for v in verifier if 'role' in v},{'workflow designer','left','right'})

    def test_labels_not_in_prompts(self):
        task=json.loads((o.ROOT/'tasks.json').read_text())[0]
        self.assertNotIn('answer',o.public_task(task))
        self.assertNotIn('expression',o.public_task(task))

    def test_cpu_all_arms_score_and_cost(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch('sys.argv',['orchestrator.py','--output',folder]): o.main()
            data=json.loads((Path(folder)/'results.json').read_text())
            self.assertEqual(len(data['runs']),36)
            self.assertTrue(all(r['correct'] for r in data['runs']))
            self.assertTrue(all(r['dollars'] is None for r in data['runs']))
            for b in ('math','multihop'):
                arms={s['arm']:s for s in data['summary'] if s['benchmark']==b}
                self.assertGreater(arms['generated']['units_per_solved'],arms['solo']['units_per_solved'])

if __name__=='__main__': unittest.main()
