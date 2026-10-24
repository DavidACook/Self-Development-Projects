import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright')));}
const root=path.resolve(import.meta.dirname,'..');
const report={suite:'Production spelling content script with a local storage adapter',date:new Date().toISOString(),checks:[],limitations:[
  'Fixtures use localhost and a browser-storage adapter; not evidence of live Google layout or native dictionary suggestions.',
  'No spelling shortcut is followed and no query is sent to Google by this test.',
]};
const fixture=`<!doctype html><html lang="en"><meta charset="utf-8"><link rel="stylesheet" href="/extension/content/spelling.css"><title>Local spelling fixture</title><body>
<form action="/search"><textarea name="q" spellcheck="false" aria-label="Search">helo wrld</textarea><button>Search</button></form>
<main id="search"><p id="native-correction">Did you mean: <a href="/search?q=hello+world&udm=14">hello world</a></p><article>Ordinary search result</article></main>
<script src="/adapter.js"></script><script src="/extension/content/spelling.js"></script></body></html>`;
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/search'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fixture);return;}
  if(url.pathname==='/adapter.js'){res.setHeader('Content-Type','text/javascript');res.end(`globalThis.__changes=null;globalThis.browser={storage:{local:{get:async defaults=>({...defaults})},onChanged:{addListener:fn=>{globalThis.__changes=fn;}}}};`);return;}
  const file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/css');res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
async function check(name,fn){try{await fn();report.checks.push({name,status:'passed'});console.log('PASS',name);}catch(error){report.checks.push({name,status:'failed',error:error.message});throw error;}}
try{
  browser=await chromium.launch({executablePath:process.env.REWEB_UI_CHROME_PATH||undefined,headless:true,args:process.env.REWEB_UI_SINGLE_PROCESS?['--single-process','--disable-gpu','--no-sandbox']:[]});
  const page=await browser.newPage();const errors=[];const requests=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));
  await page.goto(`http://127.0.0.1:${server.address().port}/search?q=helo+wrld&udm=14&hl=ja&safe=active&start=20&tbs=li:1`);
  await page.locator('#reweb-spelling-helper').waitFor();
  await check('Enables the real search field and keeps native corrections and result text',async()=>{
    assert.equal(await page.locator('[name=q]').getAttribute('spellcheck'),'true');
    assert.equal(await page.locator('#native-correction').innerText(),'Did you mean: hello world');
    assert.equal(await page.locator('article').innerText(),'Ordinary search result');
    assert.equal(await page.locator('#reweb-spelling-helper').count(),1);
  });
  await check('Shortcut explicitly uses All, preserves language/SafeSearch and drops verbatim/pagination',async()=>{
    const link=page.locator('#reweb-spelling-helper a');const url=new URL(await link.getAttribute('href'));
    assert.equal(url.searchParams.get('udm'),'0');assert.equal(url.searchParams.get('q'),'helo wrld');
    assert.equal(url.searchParams.get('hl'),'ja');assert.equal(url.searchParams.get('safe'),'active');
    assert.equal(url.searchParams.has('tbs'),false);assert.equal(url.searchParams.has('start'),false);
    assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
    assert.match(await page.locator('#reweb-spelling-helper').innerText(),/AI elements may appear/);
  });
  await check('Typing updates spelling target and safely encodes symbols and Japanese',async()=>{
    const query='C++ & 猫 <script>alert(1)</script>';
    await page.locator('[name=q]').fill(query);
    await page.waitForFunction(query=>new URL(document.querySelector('#reweb-spelling-helper a').href).searchParams.get('q')===query,query);
    assert.equal(await page.locator('#reweb-spelling-helper script').count(),0);
  });
  await check('Japanese helper labels update without changing the search text',async()=>{
    await page.evaluate(()=>__changes({language:{newValue:'ja'}},'local'));
    await page.getByRole('link',{name:'Google でスペルを確認 ↗',exact:true}).waitFor();
    assert.equal(await page.locator('[name=q]').inputValue(),'C++ & 猫 <script>alert(1)</script>');
  });
  await check('Replaced search fields are enhanced and only one helper survives DOM updates',async()=>{
    await page.evaluate(()=>{const old=document.querySelector('[name=q]');const next=document.createElement('input');next.name='q';next.value='new mispelling';old.replaceWith(next);document.querySelector('#search').append(document.createElement('p'));});
    await page.waitForFunction(()=>document.querySelector('[name=q]').getAttribute('spellcheck')==='true');
    assert.equal(await page.locator('#reweb-spelling-helper').count(),1);
  });
  await check('Master pause restores original spellcheck attributes and removes the helper immediately',async()=>{
    await page.evaluate(()=>__changes({enabled:{newValue:false}},'local'));
    await page.waitForFunction(()=>!document.querySelector('#reweb-spelling-helper'));
    assert.equal(await page.locator('[name=q]').getAttribute('spellcheck'),null);
    await page.evaluate(()=>__changes({enabled:{newValue:true}},'local'));await page.locator('#reweb-spelling-helper').waitFor();
  });
  await check('Independent spelling switch restores the field and can resume',async()=>{
    await page.evaluate(()=>__changes({spellingHelper:{newValue:false}},'local'));
    await page.waitForFunction(()=>!document.querySelector('#reweb-spelling-helper'));
    assert.equal(await page.locator('[name=q]').getAttribute('spellcheck'),null);
    await page.evaluate(()=>__changes({spellingHelper:{newValue:true}},'local'));await page.locator('#reweb-spelling-helper').waitFor();
  });
  await check('All view preserves spellcheck but omits the redundant spelling shortcut',async()=>{
    await page.evaluate(()=>{history.pushState({},'', '/search?q=helo&udm=0');dispatchEvent(new PopStateEvent('popstate'));});
    await page.waitForFunction(()=>!document.querySelector('#reweb-spelling-helper'));
    assert.equal(await page.locator('[name=q]').getAttribute('spellcheck'),'true');
  });
  await check('No automatic spelling request or uncaught script errors',async()=>{
    assert.ok(requests.every(url=>new URL(url).hostname==='127.0.0.1'));
    assert.deepEqual(errors,[]);
  });
  report.browser=browser.version();report.status='passed';
}catch(error){report.status='failed';report.failure=error.message;console.error(error.message);process.exitCode=1;}
finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(root,'docs/evidence/spelling-qa.json'),JSON.stringify(report,null,2)+'\n');}
