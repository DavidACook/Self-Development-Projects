import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, normalizeSettings, validatePatch } from '../extension/lib/settings.js';

test('first install defaults to English, Google Web and spelling help',()=>assert.deepEqual(normalizeSettings(),{enabled:true,googleClassic:true,spellingHelper:true,language:'en'}));
test('v0.1/v0.2 migration preserves routing preference and adds English/spelling defaults',()=>assert.deepEqual(normalizeSettings({googleClassic:false,bingDeclutter:true}),{...DEFAULTS,googleClassic:false}));
test('malformed settings fall back while valid false and Japanese survive',()=>assert.deepEqual(normalizeSettings({enabled:'false',googleClassic:false,spellingHelper:false,language:'ja'}),{...DEFAULTS,googleClassic:false,spellingHelper:false,language:'ja'}));
test('unknown languages fall back to English',()=>assert.equal(normalizeSettings({language:'jp'}).language,'en'));
test('only known booleans and explicit English/Japanese patches are accepted',()=>{
  for(const value of [null,[],{},'enabled',{enabled:1},{enabled:'false'},{bingDeclutter:true},{enabled:true,other:false},{language:true},{language:'jp'}]) assert.throws(()=>validatePatch(value),TypeError);
  assert.deepEqual(validatePatch({enabled:false,language:'ja'}),{enabled:false,language:'ja'});
});
test('defaults immutable',()=>assert.ok(Object.isFrozen(DEFAULTS)));
