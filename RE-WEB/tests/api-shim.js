// UI test harness ONLY. Never package this file in the installable extension.
// Renders the real popup/controller with an in-memory DNR adapter. It does not
// prove extension installation, real Chrome rule handling, or Google behavior.
import { createController } from '../extension/lib/controller.js';
const qa={rules:[],failWrite:false,failRead:false};
const api={
  storage:{local:{
    get:async defaults=>{
      if(qa.failRead||localStorage.getItem('qaFailRead')==='true')throw new Error('simulated read failure');
      return {...defaults,...JSON.parse(localStorage.getItem('settings')||'{}')};
    },
    set:async patch=>{
      if(qa.failWrite)throw new Error('simulated write failure');
      const previous=JSON.parse(localStorage.getItem('settings')||'{}');
      localStorage.setItem('settings',JSON.stringify({...previous,...patch}));
    },
  }},
  declarativeNetRequest:{updateDynamicRules:async ({addRules})=>{qa.rules=addRules;}},
  action:{setBadgeText:async()=>{},setBadgeBackgroundColor:async()=>{}},
};
const controller=createController(api);
globalThis.__rewebQA=qa;
globalThis.chrome={runtime:{
  getManifest:()=>({version:'0.3.0',version_name:'0.3.0 RC1'}),
  sendMessage:async message=>{
    if(qa.delayMs)await new Promise(resolve=>setTimeout(resolve,qa.delayMs));
    try {
      const settings=message.type==='get-settings'?await controller.reconcile():await controller.update(message.patch);
      return {ok:true,settings};
    }catch{return {ok:false,error:'Simulated browser API error'};}
  },
}};
