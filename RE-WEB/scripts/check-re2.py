#!/usr/bin/env python3
"""Optional native RE2 verification. Requires Google's google-re2 test package.

Does not substitute for Chrome's own DNR validation. No extension dependency.
"""
import importlib.metadata
import json
from pathlib import Path
import subprocess
import re2

root = Path(__file__).resolve().parents[1]
source = """import {buildRules} from './extension/lib/rules.js';
import {routingCases} from './tests/routing-cases.js';
console.log(JSON.stringify({rules:buildRules({enabled:true,googleClassic:true}),cases:routingCases}));"""
data = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', source], cwd=root, text=True))
compiled = [(rule, re2.compile(rule['condition']['regexFilter'])) for rule in data['rules']]
checks = []
for name, url, expected in data['cases']:
    matches = [rule for rule, pattern in compiled if pattern.search(url)]
    winning = max(matches, key=lambda rule: rule['priority']) if matches else None
    actual = winning['action']['type'] if winning else None
    assert actual == expected, (name, actual, expected)
    checks.append({'name': name, 'status': 'passed'})
report = {
    'suite': 'Native Google RE2 expression and routing verification',
    'package': 'google-re2', 'version': importlib.metadata.version('google-re2'),
    'compiled_expressions': len(compiled), 'checks': checks, 'status': 'passed',
    'limitation': 'This tests the native RE2 library, not the Chrome DNR API, permission handling, installation or live Google behavior.',
}
(root / 'docs' / 'evidence' / 're2-qa.json').write_text(json.dumps(report, indent=2)+'\n')
print(f'Compiled {len(compiled)} expressions in native RE2; {len(checks)} routing cases passed.')
