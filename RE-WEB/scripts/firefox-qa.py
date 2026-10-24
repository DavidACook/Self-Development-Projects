#!/usr/bin/env python3
"""Install the real Firefox package, then exercise production code with isolated QA instrumentation.
No live search-engine requests. Requires Firefox, Selenium and geckodriver/Selenium Manager.
"""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REPORT = {'suite': 'Firefox temporary installation and real extension APIs', 'date': datetime.now(timezone.utc).isoformat(), 'checks': [], 'limitations': [
    'No live Google results, native spelling dictionary, store signing, Android, or OS coverage.',
    'After installing the unmodified package, a temporary test-only copy adds a QA page and declarativeNetRequestFeedback for native rule tests. Production code is unchanged.',
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
document.querySelector('pre').textContent=JSON.stringify(report);
document.body.dataset.status=report.status;
"""

def pack(folder, output):
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(folder.rglob('*')):
            if file.is_file(): archive.write(file, file.relative_to(folder))

def main():
    driver = None
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.firefox.options import Options
        from selenium.webdriver.firefox.service import Service
        from selenium.webdriver.support.ui import WebDriverWait
        subprocess.run(['python3', str(ROOT/'scripts/build.py')], check=True, capture_output=True)
        with tempfile.TemporaryDirectory(prefix='reweb-firefox-qa-') as temp:
            temp = Path(temp)
            options = Options(); options.add_argument('-headless')
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
            manifest['permissions'].append('declarativeNetRequestFeedback')
            manifest['background']['scripts']=['qa-background.js']
            (testdir/'manifest.json').write_text(json.dumps(manifest))
            (testdir/'qa-background.js').write_text("import './background.js'; browser.runtime.onInstalled.addListener(() => browser.tabs.create({url: browser.runtime.getURL('qa.html')}));\n")
            (testdir/'qa.html').write_text('<!doctype html><html><meta charset="utf-8"><title>RE:WEB Firefox QA</title><body data-status="running"><pre></pre><a href="popup.html">Open popup</a><script type="module" src="qa.js"></script></body></html>')
            (testdir/'qa.js').write_text(HARNESS)
            shutil.copyfile(ROOT/'tests/routing-cases.js', testdir/'qa-cases.js')
            package=temp/'instrumented.xpi'; pack(testdir,package)
            driver.install_addon(str(package), temporary=True)
            def results(_):
                for handle in driver.window_handles:
                    driver.switch_to.window(handle)
                    if driver.current_url.startswith('moz-extension://') and driver.current_url.endswith('/qa.html'):
                        if driver.find_element(By.TAG_NAME,'body').get_attribute('data-status') != 'running':
                            return json.loads(driver.find_element(By.TAG_NAME,'pre').text)
                return False
            result=WebDriverWait(driver,35).until(results)
            REPORT['checks'].extend(result['checks'])
            if result['status'] != 'passed': raise AssertionError(result.get('failure','Firefox API test failed'))
            driver.find_element(By.LINK_TEXT,'Open popup').click()
            WebDriverWait(driver,15).until(lambda d: d.find_element(By.TAG_NAME,'body').get_attribute('data-state')=='active')
            assert driver.find_element(By.ID,'googleClassic').is_selected()
            REPORT['checks'].append({'name':'Production popup renders and messages the native Firefox background','status':'passed'})
            REPORT['status']='passed'
    except Exception as error:
        REPORT['status']='failed' if REPORT['checks'] else 'blocked'
        REPORT['failure']=str(error)[:1800]
        log=ROOT/'docs/evidence/firefox-driver.log'
        if log.exists():
            REPORT['startup_log_excerpt']='\n'.join(log.read_text(errors='replace').splitlines()[-12:])
    finally:
        if driver: driver.quit()
        (ROOT/'docs/evidence/firefox-qa.json').write_text(json.dumps(REPORT,indent=2)+'\n')
        print(json.dumps(REPORT,indent=2))
    return 0 if REPORT['status']=='passed' else 1

if __name__ == '__main__':
    raise SystemExit(main())
