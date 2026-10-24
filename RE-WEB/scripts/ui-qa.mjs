import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}catch(error){
  if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;
  ({chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright')));
}
const root=path.resolve(import.meta.dirname,'..');
const assets=path.join(root,'docs','assets');
const evidence=path.join(root,'docs','evidence');
fs.mkdirSync(assets,{recursive:true});fs.mkdirSync(evidence,{recursive:true});
const report={suite:'Production popup with browser API test adapter',date:new Date().toISOString(),checks:[],limitations:[
  'Uses production popup and controller modules in Chromium with a test adapter for chrome.runtime, chrome.storage and DNR.',
  'Does not validate extension installation, real DNR APIs, browser profile persistence or live search-engine behavior.',
]};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((request,response)=>{
  const url=new URL(request.url,'http://localhost');
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){response.writeHead(404).end();return;}
  let body=fs.readFileSync(file);
  if(file.endsWith('popup.html'))body=Buffer.from(body.toString().replace('<script type="module" src="popup.js">','<script type="module" src="/tests/api-shim.js"></script><script type="module" src="popup.js">'));
  response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  response.setHeader('Content-Security-Policy',JSON.parse(fs.readFileSync(path.join(root,'extension','manifest.json'),'utf8')).content_security_policy.extension_pages);
  response.end(body);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
async function check(name,fn){
  try{await fn();report.checks.push({name,status:'passed'});console.log('PASS',name);}
  catch(error){report.checks.push({name,status:'failed',error:error.message});throw error;}
}
async function saved(page){await page.waitForFunction(()=>document.getElementById('message').textContent.startsWith('Saved'));}
async function capture(page,file){await page.locator('.deck').screenshot({path:path.join(assets,file),animations:'disabled'});}
try{
  browser=await chromium.launch({
    executablePath:process.env.REWEB_UI_CHROME_PATH||undefined,
    headless:true,args:process.env.REWEB_UI_SINGLE_PROCESS?['--single-process','--disable-gpu','--no-sandbox']:[],
  });
  report.browser=browser.version();
  const context=await browser.newContext({viewport:{width:380,height:760},deviceScaleFactor:2,reducedMotion:'reduce',locale:'ja-JP'});
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const url=`http://127.0.0.1:${server.address().port}/extension/popup.html`;
  await page.goto(url);await page.waitForFunction(()=>document.body.dataset.state==='active');
  await check('Production HTML, CSS and modules render without errors',async()=>{
    assert.equal(await page.getByRole('switch',{name:'Enable RE:WEB',exact:true}).isChecked(),true);
    assert.equal(await page.getByRole('switch',{name:'Prefer Google Web results',exact:true}).isChecked(),true);
    assert.equal(await page.evaluate(()=>__rewebQA.rules.length),2);assert.deepEqual(errors,[]);
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.equal(await page.locator('#spellingHelper').isChecked(),true);
  });
  await check('Master switch pauses, remembers engine preference and resumes',async()=>{
    await page.locator('#enabled').uncheck();await saved(page);
    assert.equal(await page.locator('#googleClassic').isDisabled(),true);assert.equal(await page.locator('#googleClassic').isChecked(),true);
    assert.equal(await page.evaluate(()=>__rewebQA.rules.length),0);await capture(page,'popup-paused.png');
    await page.locator('#enabled').check();await saved(page);assert.equal(await page.locator('#googleClassic').isDisabled(),false);
  });
  await check('Engine preference survives pause and popup reload',async()=>{
    await page.locator('#googleClassic').uncheck();await saved(page);await page.locator('#enabled').uncheck();await saved(page);
    await page.reload();await page.waitForFunction(()=>document.body.dataset.state==='paused');
    assert.equal(await page.locator('#enabled').isChecked(),false);assert.equal(await page.locator('#googleClassic').isChecked(),false);
    await page.locator('#enabled').check();await saved(page);assert.equal(await page.locator('#googleClassic').isChecked(),false);
    await page.locator('#googleClassic').check();await saved(page);
  });
  await check('Save failure restores confirmed UI and rule state, then retries',async()=>{
    await page.evaluate(()=>{__rewebQA.failWrite=true;});
    await page.locator('#enabled').click();await page.waitForFunction(()=>document.body.dataset.state==='error');
    assert.equal(await page.locator('#enabled').isChecked(),true);assert.equal(await page.evaluate(()=>__rewebQA.rules.length),2);
    assert.equal(await page.getByRole('button',{name:'Retry',exact:true}).isVisible(),true);
    await page.evaluate(()=>{__rewebQA.failWrite=false;});await page.getByRole('button',{name:'Retry',exact:true}).click();
    await page.waitForFunction(()=>document.body.dataset.state==='active');
  });
  await check('Read failure disables controls and recovers via Retry',async()=>{
    await page.evaluate(()=>localStorage.setItem('qaFailRead','true'));await page.reload();await page.waitForFunction(()=>document.body.dataset.state==='error');
    assert.equal(await page.locator('#enabled').isDisabled(),true);assert.equal(await page.locator('#googleClassic').isDisabled(),true);
    await page.evaluate(()=>localStorage.removeItem('qaFailRead'));await page.getByRole('button',{name:'Retry',exact:true}).click();await page.waitForFunction(()=>document.body.dataset.state==='active');
  });
  await check('Keyboard Tab and Space operate labelled switches',async()=>{
    await page.reload();await page.waitForFunction(()=>document.body.dataset.state==='active');await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'enabled');await page.keyboard.press('Space');await saved(page);
    assert.equal(await page.locator('#enabled').isChecked(),false);await page.keyboard.press('Space');await saved(page);
    await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'googleClassic');
  });
  await check('320px and 380px layouts have no horizontal overflow and fit popup height',async()=>{
    for(const width of [320,380]){
      await page.setViewportSize({width,height:760});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      const height=await page.locator('.deck').evaluate(node=>node.getBoundingClientRect().height);
      assert.ok(height<=600,`Popup at ${width}px is ${height}px high`);
    }
  });
  await check('Reduced motion removes animation and transitions',async()=>{
    assert.equal(await page.locator('.viewport > img').evaluate(node=>getComputedStyle(node).animationName),'none');
    assert.equal(await page.locator('.switch').first().evaluate(node=>getComputedStyle(node).transitionDuration),'0s');
  });
  await page.locator('h1').click();await capture(page,'popup-active.png');
  await check('About view discloses privacy, Web Guide limitation and returns',async()=>{
    await page.getByRole('button',{name:'About & privacy'}).click();assert.equal(await page.locator('#about').isVisible(),true);
    assert.match(await page.locator('#about').innerText(),/Web Guide/);assert.equal(await page.locator('#controls').isVisible(),false);
    assert.ok(await page.locator('.deck').evaluate(node=>node.getBoundingClientRect().height<=600));await capture(page,'popup-about.png');
    await page.getByRole('button',{name:'Back to controls'}).click();assert.equal(await page.locator('#controls').isVisible(),true);
  });
  await check('Japanese selection translates labels, errors and About; persists across reload',async()=>{
    await page.locator('#language').selectOption('ja');
    await page.waitForFunction(()=>document.documentElement.lang==='ja' && !document.getElementById('language').disabled);
    assert.equal(await page.getByRole('switch',{name:'RE:WEB を有効にする',exact:true}).isChecked(),true);
    assert.match(await page.locator('#message').innerText(),/保存/);
    await page.reload();await page.waitForFunction(()=>document.documentElement.lang==='ja');
    await capture(page,'popup-japanese.png');
    for(const width of [320,380]){
      await page.setViewportSize({width,height:760});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      const height=await page.locator('.deck').evaluate(node=>node.getBoundingClientRect().height);
      assert.ok(height<=600,`Japanese popup at ${width}px is ${height}px high`);
    }
    await page.locator('#aboutButton').click();assert.match(await page.locator('#about').innerText(),/プライバシー|端末|スペル/);
    await page.locator('#aboutButton').click();
    await page.evaluate(()=>{__rewebQA.failWrite=true;});await page.locator('#language').selectOption('en');
    await page.waitForFunction(()=>document.body.dataset.state==='error');
    assert.equal(await page.locator('#language').inputValue(),'ja');assert.match(await page.locator('#message').innerText(),/保存できません/);
    await page.evaluate(()=>{__rewebQA.failWrite=false;});await page.locator('#retry').click();
    await page.locator('#language').selectOption('en');await saved(page);
  });
  await check('Language remains available while routing and spelling are paused',async()=>{
    await page.locator('#enabled').uncheck();await saved(page);
    assert.equal(await page.locator('#language').isEnabled(),true);
    assert.equal(await page.locator('#spellingHelper').isDisabled(),true);
    await page.locator('#enabled').check();await saved(page);
  });
  await check('Forced-colors mode retains identifiable controls',async()=>{
    await page.emulateMedia({forcedColors:'active'});assert.equal(await page.locator('#enabled').isEnabled(),true);
    assert.equal(await page.locator('.viewport').isVisible(),false);await page.emulateMedia({forcedColors:'none'});
  });
  await check('No uncaught UI JavaScript exceptions during all interactions',async()=>assert.deepEqual(errors,[]));
  report.status='passed';
}catch(error){report.status='failed';report.failure=error.message;console.error(error);process.exitCode=1;}
finally{
  if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));
  fs.writeFileSync(path.join(evidence,'ui-qa.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`${report.checks.filter(check=>check.status==='passed').length}/${report.checks.length} UI checks passed; ${report.status}`);
}
