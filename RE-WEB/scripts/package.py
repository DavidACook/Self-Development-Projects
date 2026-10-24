#!/usr/bin/env python3
"""Deterministic Chrome/Firefox/source ZIPs. No signing or publishing."""
import hashlib
import json
import os
from pathlib import Path
import zipfile
from build import build

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT/'dist'
VERSION = '0.3.0-rc1'
STAMP = (2026, 10, 24, 0, 0, 0)

def files_under(base, excluded=()):
    for folder, directories, names in os.walk(base):
        directories[:] = sorted(d for d in directories if d not in excluded)
        for name in directories:
            if (Path(folder)/name).is_symlink(): raise ValueError('Symlink directory not allowed')
        for name in sorted(names):
            file=Path(folder)/name
            if file.is_symlink(): raise ValueError(f'Symlink not allowed: {file}')
            yield file

def put(archive,name,data):
    assert not name.startswith('/') and '..' not in Path(name).parts
    info=zipfile.ZipInfo(name,STAMP);info.compress_type=zipfile.ZIP_DEFLATED
    info.create_system=3;info.external_attr=0o100644<<16
    archive.writestr(info,data,compresslevel=9)

def write_verified_zip(output,entries):
    with zipfile.ZipFile(output,'w') as archive:
        for name,data in sorted(entries.items()): put(archive,name,data)
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        assert set(archive.namelist())==set(entries)
        for name,data in entries.items(): assert archive.read(name)==data

artifacts=[];reports=[]
for target,folder in build().items():
    manifest=json.loads((folder/'manifest.json').read_text())
    assert manifest['version']=='0.3.0' and manifest['manifest_version']==3
    assert manifest['permissions']==['storage','declarativeNetRequestWithHostAccess']
    production={f.relative_to(folder).as_posix():f.read_bytes() for f in files_under(folder)}
    references=[manifest['action']['default_popup'],*manifest['icons'].values(),*manifest['background'].get('scripts',[])]
    if 'service_worker' in manifest['background']: references.append(manifest['background']['service_worker'])
    for script in manifest['content_scripts']: references.extend(script['js']+script['css'])
    assert all(ref in production for ref in references)
    assert not any('api-shim' in name or name.startswith(('tests/','node_modules/','qa')) for name in production)
    entries={**production,'LICENSE':(ROOT/'LICENSE').read_bytes(),'PRIVACY.md':(ROOT/'PRIVACY.md').read_bytes(),'INSTALL.md':(ROOT/'docs/INSTALL.md').read_bytes()}
    output=DIST/f'RE-WEB-v{VERSION}-{target}.zip';write_verified_zip(output,entries);artifacts.append(output)
    reports.append({'target':target,'file':output.name,'entries':len(entries),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'status':'passed'})
(ROOT/'docs/evidence/package-audit.json').write_text(json.dumps({'version':VERSION,'targets':reports,'checks':['manifest references','ZIP CRC','production byte equality','no test code or dependencies in browser ZIPs'],'limitation':'Packaging validation does not prove installation, signing or live Google behavior.'},indent=2)+'\n')
root_files={'README.md','README.ja.md','LICENSE','PRIVACY.md','CHANGELOG.md','CONTRIBUTING.md','package.json','package-lock.json','requirements-dev.txt','.gitignore'}
allowed_dirs={'extension','manifests','tests','scripts','docs','.github'}
excluded_parts={'__pycache__','node_modules','dist','downloads','.git','.cache','test-results','playwright-report'}
source_files=[f for f in files_under(ROOT,excluded_parts) if not excluded_parts.intersection(f.relative_to(ROOT).parts) and (f.relative_to(ROOT).parts[0] in allowed_dirs or f.relative_to(ROOT).as_posix() in root_files) and not f.name.endswith('.log')]
source=DIST/f'RE-WEB-v{VERSION}-source.zip'
write_verified_zip(source,{f'RE-WEB-v{VERSION}-source/'+f.relative_to(ROOT).as_posix():f.read_bytes() for f in source_files})
artifacts.append(source)
checksums=DIST/'SHA256SUMS.txt'
checksums.write_text(''.join(f'{hashlib.sha256(f.read_bytes()).hexdigest()}  {f.name}\n' for f in artifacts))
for file in artifacts+[checksums]: print(f'{file.name}: {file.stat().st_size:,} bytes')
print(f'Both browser packages and {len(source_files)} source files verified. No signing or publication performed.')
