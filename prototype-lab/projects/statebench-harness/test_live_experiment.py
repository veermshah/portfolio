import argparse
import json
import http.client
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from live_experiment import (make_task, oracle, public_state, validate_state,
                             model_scratchpad, raw_prediction, ModelClient,
                             parse_response, statements, model_tool)
from harness import LEVELS


class FakeClient:
    def __init__(self,results):self.results=iter(results);self.prompts=[];self.raw_max_tokens=64
    def complete(self,prompt,**kwargs):
        self.prompts.append(prompt)
        return {'parsed':next(self.results),'error':None,'usage':{},'called':True}


class LiveExperimentTest(unittest.TestCase):
    def test_generator_all_lengths(self):
        for level in LEVELS:
            ops,q=make_task(level,64000,42)
            self.assertEqual(len(ops),64000)
            state=oracle(ops)
            self.assertIs(type(state.read(q)),int)
            if level=='immutable':self.assertEqual(len(state.bindings),64000)

    def test_alias_roundtrip(self):
        ops=[{'op':'set','x':'v0','value':1},{'op':'set','x':'v1','value':2},
             {'op':'ref','x':'v1','y':'v0'},{'op':'add','x':'v1','value':3}]
        result=public_state(oracle(ops),True)
        self.assertEqual(result,{'values':{'v0':4,'v1':4},'aliases':[['v0','v1']]})
        self.assertEqual(validate_state(result,['v0','v1'],True),result)
        for invalid in [
            {'values':{'v0':4,'v1':5},'aliases':[['v0','v1']]},
            {'values':{'v0':4,'v1':4},'aliases':[['v0'],['v0']]},
            {'values':{'v0':True,'v1':4},'aliases':[['v0'],['v1']]}]:
            with self.assertRaises(ValueError):validate_state(invalid,['v0','v1'],True)

    def test_wrong_state_not_corrected(self):
        client=FakeClient([{'values':{'v0':999,'v1':2}}, {'values':{'v0':1000,'v1':2}}])
        ops=[{'op':'set','x':'v0','value':1},{'op':'set','x':'v1','value':2},
             {'op':'add','x':'v0','value':1},{'op':'add','x':'v1','value':0}]
        with tempfile.TemporaryDirectory() as d:
            result,calls,error=model_scratchpad(client,ops,'v0',2,Path(d)/'state.json')
            self.assertEqual(result,{'v0':1000})
            self.assertEqual(json.loads((Path(d)/'state.json').read_text())['values']['v0'],1000)
            self.assertIn('999',client.prompts[1])
            self.assertIsNone(error)
            self.assertEqual(len(calls),2)

    def test_bad_json_is_incorrect_not_transport_error(self):
        client=FakeClient([{'v0':'1'}])
        result,calls,error=raw_prediction(client,[{'op':'set','x':'v0','value':1}],'v0')
        self.assertIsNone(result)
        self.assertEqual(error,'invalid_answer_json')
        self.assertIsNone(calls[0]['error'])

    def test_tool_requires_model_request_and_extraction(self):
        ops=[{'op':'set','x':'v0','value':3},{'op':'add','x':'v0','value':2}]
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'state.json'
            bad=FakeClient([{'tool':'wrong'}])
            result,calls,error=model_tool(bad,ops,'v0',path)
            self.assertEqual(error,'invalid_tool_request')
            self.assertFalse(path.exists())
            good=FakeClient([{'tool':'execute_state'},{'v0':5}])
            result,calls,error=model_tool(good,ops,'v0',path)
            self.assertEqual(result,{'v0':5})
            self.assertIsNone(error)
            self.assertEqual(len(calls),3)  # two model calls and one tool event
            self.assertEqual(sum(c['called'] for c in calls),2)
            self.assertEqual(json.loads(path.read_text())['cells'],{'0':5})
            self.assertIn('"v0":5',good.prompts[1])
            # A model misreading the correct tool output is still wrong.
            wrong=FakeClient([{'tool':'execute_state'},{'v0':999}])
            result,_,_=model_tool(wrong,ops,'v0',path)
            self.assertEqual(result,{'v0':999})

    def test_parser(self):
        self.assertEqual(parse_response('<think>\n</think>\n```json\n{"v0":1}\n```'),{'v0':1})
        self.assertIsNone(parse_response('the answer is 1'))

    def test_server_disconnect_is_recorded(self):
        args=argparse.Namespace(base_url='http://localhost:8000/v1',model='test',context=8192,
                                max_tokens=256,raw_max_tokens=64,timeout=1,
                                key_env='UNSET_TEST_KEY',disable_thinking=True)
        client=ModelClient(args)
        with patch.object(client,'request',side_effect=[{'tokens':[1,2]},
                          http.client.RemoteDisconnected('server stopped')]):
            result=client.complete('test',max_tokens=64)
            self.assertTrue(result['called'])
            self.assertIn('RemoteDisconnected',result['error'])

    def test_context_preflight_no_completion_request(self):
        args=argparse.Namespace(base_url='http://localhost:8000/v1',model='test',context=1024,
                                max_tokens=512,timeout=1,key_env='UNSET_TEST_KEY',disable_thinking=True)
        client=ModelClient(args)
        # Tokenizer bound demonstrates oversized input without sending chat.
        with patch.object(client,'request',return_value={'tokens':list(range(1000))}) as req:
            result=client.complete('x'*1000)
            self.assertFalse(result['called'])
            self.assertIn('context_limit',result['error'])
            self.assertEqual(req.call_count,1)


if __name__=='__main__':unittest.main()
