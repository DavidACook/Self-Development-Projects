import test from 'node:test';
import assert from 'node:assert/strict';
test('Chrome namespace is used when browser is absent', async()=>{
  globalThis.chrome={kind:'chrome'};
  try { assert.equal((await import('../extension/lib/api.js?chrome')).api.kind,'chrome'); }
  finally { delete globalThis.chrome; }
});
test('Firefox Promise namespace is preferred when both exist',async()=>{
  globalThis.chrome={kind:'chrome'};globalThis.browser={kind:'firefox'};
  try { assert.equal((await import('../extension/lib/api.js?firefox')).api.kind,'firefox'); }
  finally { delete globalThis.chrome;delete globalThis.browser; }
});
