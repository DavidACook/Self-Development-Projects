import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { DEFAULTS } from '../extension/lib/settings.js';
import { routingCases } from '../tests/routing-cases.js';

const require=createRequire(import.meta.url);
let chromium;
try { ({chromium}=require('playwright')); } catch (error) {
  if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw error;
  ({chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright')));
}
const root=path.resolve(import.meta.dirname,'..');
const extension=path.join(root,'dist','chrome');
const evidence=path.join(root,'docs','evidence');
const assets=path.join(root,'docs','assets');
fs.mkdirSync(evidence,{recursive:true});fs.mkdirSync(assets,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'reweb-qa-'));
const report={suite:'Real Chrome extension QA',date:new Date().toISOString(),checks:[],limitations:[
  'Google live results blocked by unusual-traffic CAPTCHA in a separate cloud-browser attempt. No CAPTCHA bypass attempted.',
  'Navigation tests intercept requests and serve local fixtures at Google-shaped URLs. They validate browser routing, not current Google result content.',
  'Chrome Web Store, manual address-bar typing, Edge, Firefox, macOS and Windows are not verified by this automated suite.',
]};
let context;
let worker;
const errors=[];
async function check(name,fn){
  try{await fn();report.checks.push({name,status:'passed'});console.log('PASS',name);}
  catch(error){report.checks.push({name,status:'failed',error:error.message});throw error;}
}
async function launch(){
  context=await chromium.launchPersistentContext(profile,{
    headless:true,channel:'chromium',executablePath:process.env.REWEB_CHROME_PATH||undefined,
    ignoreDefaultArgs:['--disable-extensions'],
    viewport:{width:380,height:760},deviceScaleFactor:2,
    args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--no-sandbox','--disable-background-networking'],
  });
  worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker',{timeout:15000});
  report.browser=await context.browser().version();
  // Never contact Google: fixture responses make navigation deterministic and
  // keep browser-engine verification separate from live service verification.
  await context.route(/^https?:\/\//,async route=>{
    const url=new URL(route.request().url());
    if(route.request().isNavigationRequest()){
      await route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><title>Local RE:WEB routing fixture</title><h1>Local routing fixture</h1><p>No live search results.</p><form action="/search"><input name="q" aria-label="Search" value="next query"><button>Search</button></form><a href="/search?q=images&udm=2">Images</a></html>'});
    }else await route.abort();
  });
  context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
}
async function rules(){return worker.evaluate(()=>chrome.declarativeNetRequest.getDynamicRules());}
async function openPopup(){
  const page=await context.newPage();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(worker.url().replace(/background\.js$/,'popup.html'));
  await page.waitForFunction(()=>['active','paused','error'].includes(document.body.dataset.state));
  assert.notEqual(await page.locator('body').getAttribute('data-state'),'error');
  return page;
}
async function screenshot(page,file){await page.locator('.deck').screenshot({path:path.join(assets,file),animations:'disabled'});}

try{
  await launch();
  let popup=await openPopup();
  await check('Manifest V3 installs and service worker starts',async()=>{
    const manifest=await worker.evaluate(()=>chrome.runtime.getManifest());
    assert.equal(manifest.manifest_version,3);assert.equal(manifest.version,'0.3.0');assert.equal((await rules()).length,2);
    assert.equal(await popup.locator('#enabled').isChecked(),true);assert.equal(await popup.locator('#googleClassic').isChecked(),true);
  });
  await check('Chrome accepts both RE2 expressions',async()=>{
    for(const rule of await rules())assert.equal((await worker.evaluate(regex=>chrome.declarativeNetRequest.isRegexSupported({regex,isCaseSensitive:true}),rule.condition.regexFilter)).isSupported,true);
  });
  for(const [name,url,expected] of routingCases){
    await check('Chrome DNR: '+name,async()=>{
      const result=await worker.evaluate(url=>chrome.declarativeNetRequest.testMatchOutcome({url,type:'main_frame',method:'get'}),url);
      const ids=result.matchedRules.map(rule=>rule.ruleId);
      const actual=ids.includes(101)?'allow':ids.includes(100)?'redirect':undefined;
      assert.equal(actual,expected,JSON.stringify(result));
    });
  }
  await check('Chrome DNR excludes POST and subframes',async()=>{
    for(const request of [{method:'post',type:'main_frame'},{method:'get',type:'sub_frame'}]){
      const result=await worker.evaluate(request=>chrome.declarativeNetRequest.testMatchOutcome({url:'https://www.google.com/search?q=test',...request}),request);
      assert.deepEqual(result.matchedRules,[]);
    }
  });
  const search=await context.newPage();
  await check('Real main-frame navigation redirects once and preserves parameters',async()=>{
    const before=new URL('https://www.google.com/search?q=C%2B%2B+%26+%E7%8C%AB&hl=ja&safe=active&start=20&tbs=qdr:m&x=1&x=2#results');
    await search.goto(before.href);
    const after=new URL(search.url());
    assert.equal(after.searchParams.get('udm'),'14');
    for(const [key] of before.searchParams)assert.deepEqual(after.searchParams.getAll(key),before.searchParams.getAll(key));
    assert.equal(after.hash,before.hash);
    await search.reload();assert.equal(search.url(),after.href);
  });
  await check('Website GET form searches use the Web filter',async()=>{
    await search.getByRole('button',{name:'Search',exact:true}).click();
    assert.equal(new URL(search.url()).searchParams.get('udm'),'14');
    assert.equal(new URL(search.url()).searchParams.get('q'),'next query');
  });
  await check('Explicit Images, Shopping, Maps and future modes survive navigation',async()=>{
    for(const suffix of ['search?q=test&udm=2','search?q=test&tbm=shop','maps?q=test','search?q=test&udm=999']){
      const url='https://www.google.com/'+suffix;await search.goto(url);assert.equal(search.url(),url);
    }
  });
  await check('Bing and unsupported domains remain untouched',async()=>{
    for(const url of ['https://www.bing.com/search?q=test','https://www.google.de/search?q=test','https://example.org/search?q=test']){await search.goto(url);assert.equal(search.url(),url);}
  });
  await check('Engine toggle changes real DNR rules and navigation',async()=>{
    await popup.locator('#googleClassic').uncheck();await popup.waitForFunction(()=>document.querySelector('#message').textContent.startsWith('Saved'));
    assert.deepEqual(await rules(),[]);await search.goto('https://www.google.com/search?q=off');assert.equal(new URL(search.url()).searchParams.has('udm'),false);
    await popup.locator('#googleClassic').check();await popup.waitForFunction(()=>document.querySelector('#message').textContent.startsWith('Saved'));assert.equal((await rules()).length,2);
  });
  await check('Master pause removes rules and disables engine controls',async()=>{
    await popup.locator('#enabled').uncheck();await popup.waitForFunction(()=>document.body.dataset.state==='paused');
    assert.deepEqual(await rules(),[]);assert.equal(await popup.locator('#googleClassic').isDisabled(),true);
    await search.goto('https://www.google.com/search?q=paused');assert.equal(new URL(search.url()).searchParams.has('udm'),false);
    await screenshot(popup,'popup-paused.png');
  });
  await context.close();
  await launch();popup=await openPopup();
  await check('Local preferences and rule state persist across browser restart',async()=>{
    assert.equal(await popup.locator('#enabled').isChecked(),false);assert.equal(await popup.locator('#googleClassic').isChecked(),true);assert.deepEqual(await rules(),[]);
    await popup.locator('#enabled').check();await popup.waitForFunction(()=>document.body.dataset.state==='active');assert.equal((await rules()).length,2);
  });
  await check('Keyboard can focus and operate master switch',async()=>{
    await popup.reload();await popup.waitForFunction(()=>document.body.dataset.state==='active');
    await popup.keyboard.press('Tab');assert.equal(await popup.evaluate(()=>document.activeElement.id),'enabled');
    await popup.keyboard.press('Space');await popup.waitForFunction(()=>document.body.dataset.state==='paused');
    await popup.keyboard.press('Space');await popup.waitForFunction(()=>document.body.dataset.state==='active');
  });
  await check('Popup fits 320px and 380px without horizontal overflow',async()=>{
    for(const width of [320,380]){
      await popup.setViewportSize({width,height:760});
      assert.ok(await popup.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
      assert.ok(await popup.locator('.deck').evaluate(node=>node.getBoundingClientRect().height<=600));
    }
  });
  await check('Reduced-motion preference stops decorative animation',async()=>{
    assert.equal(await popup.locator('.viewport > img').evaluate(node=>getComputedStyle(node).animationName),'none');
  });
  await screenshot(popup,'popup-active.png');
  await check('About and privacy view opens, explains limits, and returns',async()=>{
    await popup.getByRole('button',{name:'About & privacy'}).click();assert.equal(await popup.locator('#about').isVisible(),true);
    assert.equal(await popup.locator('#controls').isVisible(),false);await screenshot(popup,'popup-about.png');
    await popup.getByRole('button',{name:'Back to controls'}).click();assert.equal(await popup.locator('#controls').isVisible(),true);
  });
  await check('Only four local preferences are stored',async()=>{
    assert.deepEqual(await worker.evaluate(()=>chrome.storage.local.get(null)),{...DEFAULTS,enabled:true,googleClassic:true});
  });
  await check('No popup page JavaScript errors',async()=>assert.deepEqual(errors,[]));
  report.status='passed';
}catch(error){report.status=report.checks.length?'failed':'blocked';report.failure=error.message.includes('socket() failed') ? 'Host denies Chrome process-singleton Unix sockets: Operation not permitted.' : error.message.split('Browser logs:')[0].trim();console.error(report.failure);process.exitCode=1;}
finally{
  if(context)await context.close();
  fs.rmSync(profile,{recursive:true,force:true});
  fs.writeFileSync(path.join(evidence,'browser-qa.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`${report.checks.filter(check=>check.status==='passed').length}/${report.checks.length} checks passed; ${report.status}`);
}
