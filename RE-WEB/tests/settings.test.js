import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, GOOGLE_MODES, normalizeSettings, validatePatch } from '../extension/lib/settings.js';

test('new installations start in Classic Web with English and spelling help', () => {
  assert.deepEqual(normalizeSettings(), { enabled:true, googleMode:'web', spellingHelper:true, language:'en' });
  assert.deepEqual(GOOGLE_MODES, ['web','minusAi','off']);
});
test('v0.1-v0.3 Google Classic preference migrates without changing an off choice', () => {
  assert.deepEqual(normalizeSettings({ googleClassic:false, bingDeclutter:true }), { ...DEFAULTS, googleMode:'off' });
  assert.deepEqual(normalizeSettings({ googleClassic:true }), DEFAULTS);
  assert.deepEqual(normalizeSettings({ googleClassic:false, googleMode:'minusAi' }), { ...DEFAULTS, googleMode:'minusAi' });
});
test('valid persisted settings, including false and Japanese, survive', () => {
  assert.deepEqual(normalizeSettings({enabled:false,googleMode:'minusAi',spellingHelper:false,language:'ja'}),
    {enabled:false,googleMode:'minusAi',spellingHelper:false,language:'ja'});
});
test('malformed values fall back safely', () => {
  assert.deepEqual(normalizeSettings({enabled:'false',googleMode:'unknown',spellingHelper:'no',language:'jp'}), DEFAULTS);
  assert.deepEqual(normalizeSettings(null), DEFAULTS);
});
test('only supported patches can be saved', () => {
  for (const value of [null,[],{},'enabled',{enabled:1},{googleMode:'legacy'},{googleMode:true},{googleClassic:false},
    {enabled:true,other:false},{language:true},{language:'jp'}]) {
    assert.throws(() => validatePatch(value), TypeError);
  }
  assert.deepEqual(validatePatch({googleMode:'minusAi',language:'ja'}), {googleMode:'minusAi',language:'ja'});
  assert.deepEqual(validatePatch({googleMode:'off'}), {googleMode:'off'});
});
test('defaults are immutable', () => assert.ok(Object.isFrozen(DEFAULTS)));
