import test from 'node:test';
import assert from 'node:assert/strict';

test('background integrates trusted messages, startup events, rule updates and rejection', async () => {
  const events={};const storage={};let rules=[];
  const on=name=>({addListener:fn=>{events[name]=fn;}});
  globalThis.browser={
    runtime:{id:'test-id',getURL:()=> 'moz-extension://test-id/',onInstalled:on('installed'),onStartup:on('startup'),onMessage:on('message')},
    storage:{local:{get:async defaults=>({...defaults,...storage}),set:async patch=>Object.assign(storage,patch)},onChanged:on('changed')},
    declarativeNetRequest:{updateDynamicRules:async ({addRules})=>{rules=addRules;}},
    action:{setBadgeText:async()=>{},setBadgeBackgroundColor:async()=>{}},
  };
  try {
    await import('../extension/background.js');
    assert.equal(typeof events.installed,'function');assert.equal(typeof events.startup,'function');assert.equal(typeof events.changed,'function');
    await events.installed();assert.equal(rules.length,2);
    const sender={id:'test-id',url:'moz-extension://test-id/popup.html'};
    const message=(payload,from=sender)=>new Promise(resolve=>{
      const held=events.message(payload,from,resolve);if(!held)resolve(undefined);
    });
    assert.equal(await message({type:'update-settings',patch:{enabled:false}},{id:'other-id',url:'chrome-extension://other-id/'}),undefined);
    assert.equal(await message({type:'update-settings',patch:{enabled:false}},{id:'test-id',url:'https://example.org/'}),undefined);
    assert.equal((await message({type:'get-settings'})).ok,true);
    assert.equal((await message({type:'update-settings',patch:{enabled:false}})).settings.enabled,false);assert.deepEqual(rules,[]);
    await events.startup();assert.deepEqual(rules,[]);
    assert.equal((await message({type:'update-settings',patch:{enabled:'yes'}})).ok,false);
    assert.equal(await message({type:'unknown'}),undefined);
    storage.enabled=true;
    events.changed({enabled:{newValue:true}},'local');
    await message({type:'get-settings'});assert.equal(rules.length,2);
  } finally {delete globalThis.browser;}
});
