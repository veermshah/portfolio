#!/usr/bin/env python3
"""Serial CPU llama.cpp inference, with an OpenAI-compatible chat endpoint.

Only bind this development server to localhost. Model weights are never bundled.
Qwen3 non-thinking chat formatting is explicit, including its empty think block.
"""
import argparse
import gc
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', action='append', required=True, help='ALIAS=/absolute/file.gguf; repeatable')
    parser.add_argument('--port', type=int, default=8090)
    parser.add_argument('--context', type=int, default=8192)
    parser.add_argument('--threads', type=int, default=1)
    args = parser.parse_args()
    models = dict(item.split('=', 1) for item in args.model)
    for path in models.values():
        if not Path(path).is_file():
            parser.error('Missing weights: ' + path)
    from llama_cpp import Llama
    lock = threading.Lock()
    loaded = {'alias': None, 'llm': None}

    class Handler(BaseHTTPRequestHandler):
        def reply(self, status, data):
            raw = json.dumps(data).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)

        def do_GET(self):
            if self.path == '/health':
                return self.reply(200, {'status': 'ok', 'loaded_model': loaded['alias']})
            if self.path == '/v1/models':
                return self.reply(200, {'object': 'list', 'data': [{'id': m, 'object': 'model'} for m in models]})
            self.reply(404, {'error': 'Unknown path'})

        def do_POST(self):
            if self.path != '/v1/chat/completions':
                return self.reply(404, {'error': 'Unknown path'})
            try:
                length = int(self.headers.get('Content-Length', 0))
                if length > 4_000_000:
                    return self.reply(413, {'error': 'Request too large'})
                body = json.loads(self.rfile.read(length))
                alias = body.get('model', next(iter(models)))
                if alias not in models:
                    return self.reply(400, {'error': 'Unknown model', 'available': list(models)})
                if body.get('stream'):
                    return self.reply(400, {'error': 'Streaming is not supported'})
                prompt = ''
                for message in body['messages']:
                    if message['role'] not in ('system', 'user', 'assistant') or not isinstance(message['content'], str):
                        return self.reply(400, {'error': 'Only plain text chat messages supported'})
                    prompt += '<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>\n'
                prompt += '<|im_start|>assistant\n<think>\n\n</think>\n'
                max_tokens = int(body.get('max_tokens', 2048))
                with lock:
                    if loaded['alias'] != alias:
                        if loaded['llm'] is not None:
                            loaded['llm'].close()
                            loaded['llm'] = None
                            gc.collect()
                        loaded['llm'] = Llama(model_path=models[alias], n_ctx=args.context,
                                              n_threads=args.threads, n_threads_batch=args.threads,
                                              n_gpu_layers=0, verbose=False, seed=42)
                        loaded['alias'] = alias
                    llm = loaded['llm']
                    prompt_tokens = len(llm.tokenize(prompt.encode(), special=True))
                    if prompt_tokens + max_tokens > args.context:
                        return self.reply(400, {'error': 'context_limit', 'prompt_tokens': prompt_tokens,
                                                'requested_completion': max_tokens, 'context': args.context})
                    # Keep JSON generation model-produced. Generic recursive
                    # grammars can stall CPU sampling on malformed generations;
                    # clients validate syntax/schema and retain failures.
                    started = time.perf_counter()
                    result = llm.create_completion(prompt, max_tokens=max_tokens,
                                                   temperature=float(body.get('temperature', 0)),
                                                   seed=42,
                                                   stop=['<|im_end|>', '<|endoftext|>'])
                    elapsed = time.perf_counter() - started
                choice = result['choices'][0]
                self.reply(200, {'id': result['id'], 'object': 'chat.completion', 'model': alias,
                                 'created': result['created'],
                                 'choices': [{'index': 0, 'message': {'role': 'assistant', 'content': choice['text']},
                                              'finish_reason': choice['finish_reason']}],
                                 'usage': result['usage'], 'local_seconds': elapsed})
            except Exception as exc:
                self.reply(500, {'error': type(exc).__name__ + ': ' + str(exc)})

    print(f'CPU model endpoint: http://127.0.0.1:{args.port}/v1; models: {list(models)}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()


if __name__ == '__main__':
    main()
