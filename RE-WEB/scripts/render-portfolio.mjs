import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}catch(error){
  if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;
  ({chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright')));
}
const root=path.resolve(import.meta.dirname,'..');
const browser=await chromium.launch({headless:true,executablePath:process.env.REWEB_UI_CHROME_PATH||undefined,args:process.env.REWEB_UI_SINGLE_PROCESS?['--single-process','--disable-gpu','--no-sandbox']:[]});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await page.goto(pathToFileURL(path.join(root,'docs','assets','portfolio.html')).href);
  await page.locator('.right img').evaluate(async image=>{if(!image.complete)await new Promise(resolve=>image.onload=resolve);});
  await page.screenshot({path:path.join(root,'docs','assets','re-web-portfolio.png')});
  console.log('Rendered portfolio image from the recorded popup screenshot.');
}finally{await browser.close();}
