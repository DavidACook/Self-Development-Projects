#!/usr/bin/env python3
"""Build browser-specific, dependency-free extension directories."""
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]

def build():
    targets = {}
    for target in ['chrome', 'firefox']:
        dest = ROOT / 'dist' / target
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(ROOT / 'extension', dest)
        manifest = json.loads((dest / 'manifest.json').read_text())
        if target == 'firefox':
            manifest.update(json.loads((ROOT / 'manifests/firefox.json').read_text()))
            manifest.pop('minimum_chrome_version', None)
            # version_name is Chromium-only; Firefox uses the numeric version.
            manifest.pop('version_name', None)
        (dest / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        targets[target] = dest
    return targets

if __name__ == '__main__':
    for name, dest in build().items():
        print(f'{name}: {dest.relative_to(ROOT)}')
