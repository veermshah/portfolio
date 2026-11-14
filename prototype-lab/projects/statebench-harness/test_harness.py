import tempfile, unittest
import unittest.mock
from pathlib import Path
from harness import *
class TestHarness(unittest.TestCase):
 def test_alias_and_swap(self):
  ops=[dict(op='set',x='a',value=2),dict(op='set',x='b',value=7),dict(op='ref',x='c',y='a'),dict(op='add',x='c',value=5),dict(op='swap',x='a',y='b'),dict(op='add',x='c',value=2)]
  self.assertEqual(execute(ops,['a','b','c']),{'a':7,'b':9,'c':9})
 def test_fixes(self):
  with tempfile.TemporaryDirectory() as d:
   for level in LEVELS:
    for seed in range(5):
     ops,q=generate(level,256,seed)
     expected=execute(ops,q)
     self.assertEqual(chunked(ops,q,17),expected)
     self.assertEqual(scratchpad(ops,q,Path(d)/'state.json'),expected)
 def test_context_preflight(self):
  ops,q=generate('self',64000,42)
  with unittest.mock.patch.dict(os.environ, {'OLLAMA_NUM_CTX':'8192'}):
   with self.assertRaisesRegex(ValueError,'context_limit'):
    call_model('ollama','qwen3:4b',ops,q)
 def test_lengths(self):
  for level in LEVELS:
   ops,q=generate(level,64000,7)
   self.assertEqual(len(ops),64000)
   self.assertEqual(chunked(ops,q,128),execute(ops,q))
if __name__=='__main__': unittest.main()
