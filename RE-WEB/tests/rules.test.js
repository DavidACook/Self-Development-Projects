import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRules } from '../extension/lib/rules.js';
import { routingCases } from './routing-cases.js';

// Fast JS matching checks. Real browser DNR tests separately verify RE2 behavior.
export function decide(url, mode='web', method='get', type='main_frame') {
  return buildRules({ enabled:true, googleMode:mode }).filter(rule =>
    rule.condition.requestMethods.includes(method)
    && rule.condition.resourceTypes.includes(type)
    && new RegExp(rule.condition.regexFilter).test(url)
  ).sort((a,b) => b.priority-a.priority)[0];
}
function redirect(rule, url) {
  const result = new URL(url);
  const action = rule.action.redirect;
  if (action.transform) {
    for (const { key,value } of action.transform.queryTransform.addOrReplaceParams) result.searchParams.set(key,value);
    return result.href;
  }
  const replacement = action.regexSubstitution.replace(/\\([1-9])/g, (_,number) => '$' + number);
  return url.replace(new RegExp(rule.condition.regexFilter), replacement);
}
for (const [name,url,expected] of routingCases) {
  test('Classic Web: ' + name, () => assert.equal(decide(url)?.action.type, expected));
}
test('classic mode leaves other methods and subframes alone', () => {
  assert.equal(decide('https://www.google.com/search?q=cats','web','post'), undefined);
  assert.equal(decide('https://www.google.com/search?q=cats','web','get','sub_frame'), undefined);
});
test('Web redirect keeps parameters, duplicates, fragments and avoids loops', () => {
  const before = 'https://www.google.com/search?q=C%2B%2B+%26+%E7%8C%AB&hl=ja&safe=active&x=1&x=2#results';
  const after = new URL(redirect(decide(before),before));
  const original = new URL(before);
  for (const [key] of original.searchParams) assert.deepEqual(after.searchParams.getAll(key),original.searchParams.getAll(key));
  assert.equal(after.hash,'#results');
  assert.equal(after.searchParams.get('udm'),'14');
  assert.equal(decide(after.href).action.type,'allow');
});
test('experimental -ai appends a separate search exclusion to a first or later query', () => {
  for (const url of [
    'https://www.google.com/search?q=cats',
    'https://www.google.co.jp/search?hl=ja&q=%E7%8C%AB&safe=active',
    'https://google.co.uk/search?x=1&q=C%2B%2B+%26+cats&x=2#results',
  ]) {
    const rule=decide(url,'minusAi');
    assert.equal(rule?.id,102);
    const result=new URL(redirect(rule,url));
    const before=new URL(url);
    assert.equal(result.searchParams.get('q'),before.searchParams.get('q')+' -ai');
    for (const [key] of before.searchParams) if(key!=='q')assert.deepEqual(result.searchParams.getAll(key),before.searchParams.getAll(key));
    assert.equal(result.hash,before.hash);
    assert.equal(decide(result.href,'minusAi')?.id,103,'idempotent redirect');
  }
});
test('experimental mode respects existing -ai operators and explicitly selected modes', () => {
  for (const suffix of ['q=cats+-ai','q=cats%20-ai','q=-ai','q=cats&udm=2','tbm=isch&q=cats','q=cats&udm=0']) {
    const url='https://www.google.com/search?'+suffix;
    assert.equal(decide(url,'minusAi')?.action.type,'allow',suffix);
  }
});
test('experimental mode leaves unsupported searches alone', () => {
  for (const url of ['https://www.google.com/search?q=','https://www.google.com/search?x=q=cats',
    'https://www.google.com/search?hl=en','https://www.google.de/search?q=cats',
    'https://www.bing.com/search?q=cats']) assert.equal(decide(url,'minusAi'),undefined,url);
});
test('off and master pause do not create any rules', () => {
  for (const mode of ['web','minusAi','off']) assert.deepEqual(buildRules({enabled:false,googleMode:mode}),[]);
  assert.deepEqual(buildRules({enabled:true,googleMode:'off'}),[]);
});
