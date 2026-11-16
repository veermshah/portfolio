import json
from pathlib import Path
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch
import orchestrator as o
import regrade

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

    def test_explicit_answer_extraction(self):
        self.assertEqual(o.extract_answer('Reasoning: 6 * 11 = 66.\nFINAL: 66'),'66')
        self.assertEqual(o.extract_answer('<think>wrong</think>\nFINAL: Bellora'),'Bellora')
        self.assertEqual(o.extract_answer('FINAL: \\boxed{42}'),'42')
        self.assertEqual(o.extract_answer('<answer>42</answer>'),'42')
        self.assertEqual(o.extract_answer('Brief reasoning. <answer>42</answer>'),'42')
        self.assertEqual(o.extract_answer('I think 42 but maybe 41'),'I think 42 but maybe 41')

    def test_public_benchmark_grading(self):
        self.assertTrue(o.grade({'benchmark':'hotpotqa','answer':'The Chief of Protocol'},'FINAL: Chief of Protocol.'))
        self.assertFalse(o.grade({'benchmark':'hotpotqa','answer':'yes'},'FINAL: no'))
        self.assertTrue(o.grade({'benchmark':'aime2024','answer':'7'},'FINAL: 007'))
        tasks=json.loads((o.ROOT/'benchmark_tasks.json').read_text())
        self.assertEqual(len(tasks),12)
        self.assertTrue(all('solution' not in o.public_task(t) and 'answer' not in o.public_task(t) for t in tasks))

    def test_intermediate_roles_request_reasoning(self):
        self.assertIn('plan',o.role_prompt('planner'))
        self.assertIn('step by step',o.role_prompt('verifier'))
        self.assertIn('reasoning',o.role_prompt('solo solver'))
        self.assertIn('Return only FINAL',o.role_prompt('aggregator'))

    def test_real_provider_usage_is_required_and_preserved(self):
        args=SimpleNamespace(backend='openai',model='test',max_tokens=64,plan_max_tokens=64,timeout=5)
        model=o.Model(args)
        response={'choices':[{'message':{'content':'FINAL: 66'},'finish_reason':'stop'}],
                  'usage':{'prompt_tokens':37,'completion_tokens':5}}
        with patch.dict('os.environ',{'OPENAI_BASE_URL':'http://127.0.0.1:8081/v1'}), patch.object(model,'request',return_value=response):
            self.assertEqual(model.call({'id':'x','question':'pairs','benchmark':'math'},'solo solver',[]),'FINAL: 66')
        self.assertEqual(model.trace[0]['input_tokens'],37)
        self.assertEqual(model.trace[0]['output_tokens'],5)
        self.assertEqual(model.trace[0]['finish_reason'],'stop')
        response.pop('usage')
        with patch.dict('os.environ',{'OPENAI_BASE_URL':'http://127.0.0.1:8081/v1'}), patch.object(model,'request',return_value=response), self.assertRaisesRegex(RuntimeError,'omitted token usage'):
            model.call({'question':'pairs'},'solo solver',[])

    def test_provider_failure_stops_and_checkpoints(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch('sys.argv',['orchestrator.py','--backend','openai','--model','x','--output',folder]), patch.object(o.Model,'call',side_effect=ConnectionError('endpoint stopped')), self.assertRaises(SystemExit) as exit:
                o.main()
            self.assertEqual(exit.exception.code,2)
            partial=json.loads((Path(folder)/'partial.json').read_text())
            self.assertEqual(len(partial['runs']),1)
            self.assertIsNotNone(partial['runs'][0]['error'])

    def test_regrade_preserves_failed_task_cost_and_raw_outputs(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder); task={'id':'t','benchmark':'math','question':'q','answer':'42'}
            tasks=root/'tasks.json';tasks.write_text(json.dumps([task]))
            rows=[{'id':'t','benchmark':'math','arm':'generated','answer':'<answer>42</answer>','expected':'42','correct':False,'error':None,'trace':[]},
                  {'id':'t','benchmark':'math','arm':'generated','answer':'','expected':'42','correct':False,'error':'ValueError: invalid plan','trace':[]}]
            data={'backend':'openai','model':'fixture','token_measurement':'provider reported','runs':rows,
                  'summary':[{'benchmark':'math','arm':'generated','tasks':2,'calls':2,'token_units':130,'dollars':0,'errors':1}]}
            result=root/'results.json';result.write_text(json.dumps(data))
            with patch('sys.argv',['regrade.py',str(result),'--tasks',str(tasks)]): regrade.main()
            updated=json.loads(result.read_text())
            self.assertEqual(updated['summary'][0]['units_per_solved'],130)
            self.assertEqual(updated['summary'][0]['protocol_errors'],1)
            self.assertEqual(updated['summary'][0]['infrastructure_errors'],0)
            self.assertEqual(updated['runs'][0]['answer'],'<answer>42</answer>')
            self.assertTrue((root/'results.before-xml-answer-normalization.json').exists())

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
