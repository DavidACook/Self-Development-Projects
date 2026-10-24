import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS } from '../extension/lib/settings.js';
import { createController } from '../extension/lib/controller.js';

function fake(initial={}) {
  const state={storage:{...initial},rules:[],failWrite:false,failRules:false,failBadge:false,writes:0};
  const api={
    storage:{local:{
      get: async defaults=>({...defaults,...state.storage}),
      set: async values=>{if(state.failWrite) throw new Error('disk');state.storage={...state.storage,...values};state.writes++;},
    }},
    declarativeNetRequest:{updateDynamicRules:async ({addRules})=>{if(state.failRules) throw new Error('DNR'); state.rules=structuredClone(addRules);}},
    action:{setBadgeText:async()=>{if(state.failBadge)throw new Error('badge');},setBadgeBackgroundColor:async()=>{}},
  };
  return {state,control:createController(api)};
}
test('installation reconciles defaults without storing search data',async()=>{
  const {state,control}=fake();await control.reconcile();assert.equal(state.rules.length,2);assert.deepEqual(state.storage,{});
});
test('master pause removes all rules; resuming restores chosen engine setting',async()=>{
  const {state,control}=fake();await control.update({enabled:false});assert.deepEqual(state.rules,[]);
  assert.deepEqual(state.storage,{...DEFAULTS,enabled:false});await control.update({enabled:true});assert.equal(state.rules.length,2);
});
test('engine off survives master off/on',async()=>{
  const {state,control}=fake();await control.update({googleClassic:false});await control.update({enabled:false});await control.update({enabled:true});
  assert.deepEqual(state.rules,[]);assert.equal(state.storage.googleClassic,false);
});
test('settings survive a new controller / worker lifecycle',async()=>{
  const a=fake();await a.control.update({enabled:false});const b=fake(a.state.storage);const read=await b.control.reconcile();assert.equal(read.enabled,false);assert.deepEqual(b.state.rules,[]);
});
test('concurrent patches serialize without losing preferences',async()=>{
  const {state,control}=fake();await Promise.all([control.update({enabled:false}),control.update({googleClassic:false}),control.update({enabled:true})]);
  assert.deepEqual(state.storage,{...DEFAULTS,googleClassic:false});assert.deepEqual(state.rules,[]);
});
test('DNR failure does not report saved or change persisted settings',async()=>{
  const {state,control}=fake({...DEFAULTS,enabled:false});state.failRules=true;
  await assert.rejects(control.update({enabled:true}));assert.equal(state.storage.enabled,false);assert.equal(state.writes,0);
});
test('storage failure rolls rules back and permits next update',async()=>{
  const {state,control}=fake({enabled:true,googleClassic:true});await control.reconcile();state.failWrite=true;
  await assert.rejects(control.update({enabled:false}));assert.equal(state.rules.length,2);assert.equal(state.storage.enabled,true);
  state.failWrite=false;await control.update({enabled:false});assert.deepEqual(state.rules,[]);
});
test('invalid patch rejected before browser mutation',async()=>{
  const {state,control}=fake();await assert.rejects(control.update({enabled:'false'}));assert.equal(state.writes,0);assert.deepEqual(state.rules,[]);
});
test('badge failure cannot break controls',async()=>{
  const {state,control}=fake();state.failBadge=true;assert.equal((await control.update({enabled:false})).enabled,false);assert.deepEqual(state.rules,[]);
});

test('language and spelling settings persist without changing Web rules',async()=>{
  const {state,control}=fake();await control.reconcile();
  const before=structuredClone(state.rules);
  await control.update({language:'ja',spellingHelper:false});
  assert.equal(state.storage.language,'ja');assert.equal(state.storage.spellingHelper,false);
  assert.deepEqual(state.rules,before);
});
