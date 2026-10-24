import test from 'node:test';
import assert from 'node:assert/strict';
import { messages, translate } from '../extension/lib/i18n.js';
test('Japanese has a non-empty translation for every English UI key',()=>{
  assert.deepEqual(Object.keys(messages.ja).sort(),Object.keys(messages.en).sort());
  for(const value of Object.values(messages.ja)) assert.ok(typeof value==='string' && value.trim());
});
test('unknown locale falls back to English and exact requested tagline is present',()=>{
  assert.equal(translate('jp','tagline'),'De-AI your search and reclaim your brain.');
  assert.equal(translate('en','tagline'),'De-AI your search and reclaim your brain.');
});
