import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRules } from '../extension/lib/rules.js';
import { routingCases } from './routing-cases.js';

// Fast semantic regression tests. The browser suite also passes these cases to
// Chrome's actual RE2/DNR testMatchOutcome API (this helper is not a substitute).
const rules = buildRules({ enabled: true, googleClassic: true });
export function decide(url, method = 'get', type = 'main_frame') {
  return rules.filter(rule => rule.condition.requestMethods.includes(method)
    && rule.condition.resourceTypes.includes(type)
    && new RegExp(rule.condition.regexFilter).test(url)).sort((a,b) => b.priority-a.priority)[0];
}


for (const [name, url, action] of routingCases) {
  test('routing: '+name, () => assert.equal(decide(url)?.action.type, action));
}
test('master and engine toggles remove ALL rules', () => {
  for (const settings of [{enabled:false,googleClassic:true},{enabled:true,googleClassic:false},{enabled:false,googleClassic:false}]) {
    assert.deepEqual(buildRules(settings), []);
  }
});
test('subframes and POST requests are untouched', () => {
  const url='https://www.google.com/search?q=cats';
  assert.equal(decide(url,'post'),undefined);
  assert.equal(decide(url,'get','sub_frame'),undefined);
});
test('transformation preserves query values, repeated parameters, filters and fragments', () => {
  const before = new URL('https://www.google.com/search?q=C%2B%2B+%26+%E7%8C%AB&hl=ja&safe=active&start=20&tbs=qdr:m&x=1&x=2#results');
  const after = new URL(before);
  const redirect=decide(before.href).action.redirect.transform.queryTransform;
  for (const param of redirect.addOrReplaceParams) after.searchParams.set(param.key,param.value);
  for (const [key] of before.searchParams) assert.deepEqual(after.searchParams.getAll(key),before.searchParams.getAll(key));
  assert.equal(after.hash,before.hash);
  assert.equal(after.searchParams.get('udm'),'14');
  assert.equal(decide(after.href).action.type,'allow');
});
