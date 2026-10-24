#!/usr/bin/env python3
"""Install the real Firefox package, then exercise production code with isolated QA instrumentation.
No live search-engine requests. Requires Firefox, Selenium and geckodriver/Selenium Manager.
"""
from datetime import datetime, timezone
import json
import http.server
import secrets
import threading
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REPORT = {'suite': 'Firefox temporary installation and real extension APIs', 'date': datetime.now(timezone.utc).isoformat(), 'checks': [], 'limitations': [
    'No live Google results, native spelling dictionary, store signing, Android, or OS coverage.',
    'After installing the unmodified package, a test-only copy adds QA pages, feedback permission and an isolated localhost result callback/CSP exception. Production JS/CSS is unchanged. No real search queries are sent.',
]}
HARNESS = r"""
import { routingCases } from './qa-cases.js';
const report = { checks: [] };
async function check(name, fn) { await fn(); report.checks.push({name, status:'passed'}); }
function assert(value, message) { if (!value) throw new Error(message); }
try {
  const send = async (type, patch) => {
    const reply = await browser.runtime.sendMessage({type, ...(patch ? {patch}: {})});
    assert(reply?.ok, 'Background message rejected');return reply.settings;
  };
  await check('Firefox module background starts; native DNR accepts both rules', async () => {
    const settings=await send('get-settings');assert(settings.language==='en' && settings.spellingHelper, 'Incorrect defaults');
    assert((await browser.declarativeNetRequest.getDynamicRules()).length===2, 'Missing rules');
  });
  for (const [name,url,expected] of routingCases) await check('Firefox DNR: '+name, async () => {
    const result=await browser.declarativeNetRequest.testMatchOutcome({url,type:'main_frame',method:'get'});
    const ids=result.matchedRules.map(rule=>rule.ruleId);
    const actual=ids.includes(101)?'allow':ids.includes(100)?'redirect':undefined;
    assert(actual===expected, JSON.stringify(result));
  });
  await check('Pause removes actual rules and settings survive a fresh message', async () => {
    await send('update-settings',{enabled:false,language:'ja',spellingHelper:false});
    assert((await browser.declarativeNetRequest.getDynamicRules()).length===0, 'Pause failed');
    const next=await send('get-settings');assert(next.language==='ja' && !next.spellingHelper && !next.enabled,'Preferences lost');
    await send('update-settings',{enabled:true,language:'en',spellingHelper:true});
  });
  await check('Unsupported language patches are rejected by the real background',async()=>{
    const response=await browser.runtime.sendMessage({type:'update-settings',patch:{language:'jp'}});assert(response?.ok===false,'Invalid patch accepted');
  });
  report.status='passed';
} catch(error) { report.status='failed';report.failure=String(error); }
if(report.status==='passed') { sessionStorage.setItem('qaReport',JSON.stringify(report));location.replace(browser.runtime.getURL('popup.html')); }
else await fetch('__QA_CALLBACK__',{method:'POST',body:JSON.stringify(report)});
"""

UI_HARNESS = r"""
const report=JSON.parse(sessionStorage.getItem('qaReport')||'{"checks":[]}');
const wait=predicate=>new Promise((resolve,reject)=>{
  const deadline=performance.now()+12000;
  const tick=()=>{if(predicate())resolve();else if(performance.now()>deadline)reject(new Error('Popup state timeout'));else setTimeout(tick,25);};tick();
});
function assert(value,message){if(!value)throw new Error(message);}
async function check(name,fn){await fn();report.checks.push({name,status:'passed'});}
try{
  await check('Production popup loads with actual Firefox background messaging',async()=>{
    await wait(()=>document.body.dataset.state==='active');
    assert(document.getElementById('googleClassic').checked,'Web preference missing');
    assert(document.querySelector('.tagline').textContent==='De-AI your search and reclaim your brain.','Wrong English tagline');
  });
  await check('Japanese popup labels and saved locale work in Firefox',async()=>{
    const language=document.getElementById('language');language.value='ja';language.dispatchEvent(new Event('change'));
    await wait(()=>document.documentElement.lang==='ja' && !language.disabled);
    assert(document.getElementById('enabled').getAttribute('aria-label')==='RE:WEB を有効にする','Japanese accessible label missing');
    assert((await browser.storage.local.get('language')).language==='ja','Locale not saved');
  });
  await check('Firefox popup pause and independent spelling preference work',async()=>{
    const spelling=document.getElementById('spellingHelper');spelling.click();await wait(()=>!spelling.disabled);
    assert((await browser.storage.local.get('spellingHelper')).spellingHelper===false,'Spelling preference not saved');
    document.getElementById('enabled').click();await wait(()=>document.body.dataset.state==='paused');
    assert((await browser.declarativeNetRequest.getDynamicRules()).length===0,'Popup pause did not remove rules');
    assert(!document.getElementById('language').disabled,'Language unavailable when paused');
    document.getElementById('enabled').click();await wait(()=>document.body.dataset.state==='active');
  });
  report.status='passed';
}catch(error){report.status='failed';report.failure=String(error);}
await fetch('__QA_CALLBACK__',{method:'POST',body:JSON.stringify(report)});
"""

def pack(folder, output):
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(folder.rglob('*')):
            if file.is_file(): archive.write(file, file.relative_to(folder))

def main():
    driver = None
    server = None
    try:
        from selenium import webdriver
        from selenium.webdriver.firefox.options import Options
        from selenium.webdriver.firefox.service import Service
        subprocess.run(['python3', str(ROOT/'scripts/build.py')], check=True, capture_output=True)
        with tempfile.TemporaryDirectory(prefix='reweb-firefox-qa-') as temp:
            temp = Path(temp)
            options = Options(); options.add_argument('-headless')
            # Native match diagnostics are a Firefox developer-only API. This
            # preference belongs solely to this disposable synthetic-test profile.
            options.set_preference('extensions.dnr.feedback', True)
            binary = os.environ.get('REWEB_FIREFOX_PATH') or shutil.which('firefox')
            if not binary:
                candidates=sorted((Path.home()/'.cache/ms-playwright').glob('firefox-*/firefox/firefox'))
                binary=str(candidates[-1]) if candidates else None
            if not binary: raise RuntimeError('Firefox executable is not installed on this host.')
            options.binary_location = binary
            os.environ.setdefault('SE_AVOID_STATS', 'true')
            log_path=ROOT/'docs/evidence/firefox-driver.log'
            service = Service(executable_path=os.environ['REWEB_GECKODRIVER_PATH'], log_output=str(log_path)) if os.environ.get('REWEB_GECKODRIVER_PATH') else Service(log_output=str(log_path))
            driver = webdriver.Firefox(options=options, service=service)
            REPORT['browser'] = driver.capabilities.get('browserVersion')
            production = temp/'production.xpi'; pack(ROOT/'dist/firefox', production)
            addon_id = driver.install_addon(str(production), temporary=True)
            assert addon_id == 're-web@davidacook.github.io'
            REPORT['checks'].append({'name':'Unmodified Firefox production package installs temporarily','status':'passed'})
            driver.uninstall_addon(addon_id)
            testdir = temp/'instrumented'; shutil.copytree(ROOT/'dist/firefox', testdir)
            manifest = json.loads((testdir/'manifest.json').read_text())
            # Firefox intentionally refuses WebDriver DOM access to privileged
            # extension pages. Test pages report synthetic results to localhost
            # instead; this exception is confined to the temporary QA package.
            event=threading.Event();result_box={};callback_path='/report/'+secrets.token_hex(16)
            class Callback(http.server.BaseHTTPRequestHandler):
                def do_POST(self):
                    if self.path!=callback_path:
                        self.send_error(404);return
                    size=int(self.headers.get('Content-Length','0'))
                    if not 0<size<65536:
                        self.send_error(400);return
                    result_box['report']=json.loads(self.rfile.read(size))
                    self.send_response(200);self.send_header('Access-Control-Allow-Origin','*');self.end_headers();self.wfile.write(b'OK');event.set()
                def log_message(self,*args): pass
            server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Callback)
            threading.Thread(target=server.serve_forever,daemon=True).start()
            callback=f'http://127.0.0.1:{server.server_port}'+callback_path
            manifest['permissions'].append('declarativeNetRequestFeedback')
            manifest['host_permissions'].append('http://127.0.0.1/*')
            manifest['content_security_policy']['extension_pages']=manifest['content_security_policy']['extension_pages'].replace("connect-src 'none'",f'connect-src http://127.0.0.1:{server.server_port}')
            manifest['background']['scripts']=['qa-background.js']
            (testdir/'manifest.json').write_text(json.dumps(manifest))
            (testdir/'qa-background.js').write_text("import './background.js'; browser.runtime.onInstalled.addListener(() => browser.tabs.create({url: browser.runtime.getURL('qa.html')}));\n")
            (testdir/'qa.html').write_text('<!doctype html><html><meta charset="utf-8"><title>RE:WEB Firefox QA</title><body data-status="running"><pre></pre><a href="popup.html">Open popup</a><script type="module" src="qa.js"></script></body></html>')
            (testdir/'qa.js').write_text(HARNESS.replace('__QA_CALLBACK__',callback))
            (testdir/'qa-ui.js').write_text(UI_HARNESS.replace('__QA_CALLBACK__',callback))
            popup=testdir/'popup.html'
            popup.write_text(popup.read_text().replace('</body>','<script type="module" src="qa-ui.js"></script></body>'))
            shutil.copyfile(ROOT/'tests/routing-cases.js', testdir/'qa-cases.js')
            package=temp/'instrumented.xpi'; pack(testdir,package)
            driver.install_addon(str(package), temporary=True)
            if not event.wait(45): raise TimeoutError('Firefox QA page did not report within 45 seconds.')
            result=result_box['report'];REPORT['checks'].extend(result['checks'])
            if result['status']!='passed': raise AssertionError(result.get('failure','Firefox QA failed'))
            REPORT['status']='passed'
    except Exception as error:
        REPORT['status']='failed' if REPORT['checks'] else 'blocked'
        REPORT['failure']=str(error)[:1800]
        log=ROOT/'docs/evidence/firefox-driver.log'
        if log.exists():
            REPORT['startup_log_excerpt']='\n'.join(log.read_text(errors='replace').splitlines()[-12:])
    finally:
        if driver: driver.quit()
        if server: server.shutdown();server.server_close()
        (ROOT/'docs/evidence/firefox-qa.json').write_text(json.dumps(REPORT,indent=2)+'\n')
        print(json.dumps(REPORT,indent=2))
    return 0 if REPORT['status']=='passed' else 1

if __name__ == '__main__':
    raise SystemExit(main())
