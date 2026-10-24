import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
execFileSync('python3',[path.join(root,'scripts/build.py')]);
for(const target of ['chrome','firefox']){
  const base=path.join(root,'dist',target);
  const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
  assert.equal(manifest.manifest_version,3);
  assert.deepEqual(manifest.permissions,['storage','declarativeNetRequestWithHostAccess']);
  assert.equal(manifest.host_permissions.length,6);
  assert.ok(!manifest.web_accessible_resources && !manifest.externally_connectable);
  assert.match(manifest.content_security_policy.extension_pages,/connect-src 'none'/);
  assert.equal(manifest.default_locale,'en');
  assert.deepEqual(manifest.content_scripts[0].matches,manifest.host_permissions);
  const entries=[manifest.action.default_popup,...Object.values(manifest.icons),...manifest.content_scripts.flatMap(s=>[...s.js,...s.css])];
  if(target==='chrome'){
    assert.equal(manifest.background.service_worker,'background.js');assert.ok(!manifest.background.scripts);
    assert.ok(!manifest.browser_specific_settings);entries.push(manifest.background.service_worker);
  }else{
    assert.deepEqual(manifest.background.scripts,['background.js']);assert.ok(!manifest.background.service_worker);
    assert.equal(manifest.background.type,'module');
    assert.equal(manifest.browser_specific_settings.gecko.strict_min_version,'140.0');
    assert.deepEqual(manifest.browser_specific_settings.gecko.data_collection_permissions.required,['none']);
    entries.push(...manifest.background.scripts);
  }
  for(const entry of entries) assert.ok(fs.existsSync(path.join(base,entry)),entry+' must exist');
  for(const locale of ['en','ja']){
    const catalog=JSON.parse(fs.readFileSync(path.join(base,'_locales',locale,'messages.json'),'utf8'));
    for(const value of [manifest.description,manifest.action.default_title])assert.ok(catalog[value.slice(6,-2)]?.message);
  }
  let count=0;
  function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);if(entry.isDirectory()){walk(file);continue;}
    if(!/\.(js|html|json|css)$/.test(file))continue;
    const content=fs.readFileSync(file,'utf8');
    if(file.endsWith('.js')){execFileSync(process.execPath,['--check',file]);assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket|eval)\s*\(/.test(content),file+' unexpected network/dynamic code');count++;}
    if(file.endsWith('.html'))assert.ok(!/<script\b(?![^>]*\bsrc=)[^>]*>\s*\S/i.test(content),'Inline script');
  }}
  walk(base);
  console.log(`${target}: manifest, assets, ${count} JavaScript files, locales, CSP and network API checks passed.`);
}
