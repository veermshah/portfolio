#!/usr/bin/env python3
"""Download pinned public GGUF files and verify their SHA-256 digests."""
import argparse
import hashlib
import json
from pathlib import Path
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', type=Path, default=Path('models'))
    parser.add_argument('--only', choices=['0.6B', '1.7B'])
    args = parser.parse_args()
    sources = json.loads(Path(__file__).with_name('model_sources.json').read_text())
    args.directory.mkdir(parents=True, exist_ok=True)
    for source in sources:
        if args.only and f'-{args.only}-' not in source['file']:
            continue
        target = args.directory / source['file']
        if not target.exists():
            print('Downloading', source['file'], flush=True)
            temporary = target.with_suffix('.gguf.part')
            with urllib.request.urlopen(source['download_url'], timeout=120) as response, temporary.open('wb') as output:
                while chunk := response.read(4 * 1024 * 1024):
                    output.write(chunk)
            temporary.rename(target)
        digest = hashlib.sha256()
        with target.open('rb') as data:
            while chunk := data.read(8 * 1024 * 1024):
                digest.update(chunk)
        if target.stat().st_size != source['bytes'] or digest.hexdigest() != source['sha256']:
            raise SystemExit('Checksum mismatch; remove the invalid file and retry: ' + str(target))
        print('Verified', source['file'], digest.hexdigest(), flush=True)


if __name__ == '__main__':
    main()
