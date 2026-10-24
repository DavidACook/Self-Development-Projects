// Declarative rules run in the browser, without sending queries to our worker.
// RE2 has no lookaround. A higher-priority allow rule preserves explicit modes
// and stops a redirected udm=14 URL matching again. Do not replace it with JS
// lookahead: Chrome would reject that expression.
export const RULE_IDS = Object.freeze([100, 101]);
export const GOOGLE_ORIGINS = Object.freeze([
  'http://google.com', 'https://google.com',
  'http://www.google.com', 'https://www.google.com',
  'http://google.co.jp', 'https://google.co.jp',
  'http://www.google.co.jp', 'https://www.google.co.jp',
  'http://google.co.uk', 'https://google.co.uk',
  'http://www.google.co.uk', 'https://www.google.co.uk',
]);
const PREFIX = '^https?://(www\\.)?google\\.(com|co\\.jp|co\\.uk)/search\\?';
const CONDITION = Object.freeze({
  resourceTypes: ['main_frame'],
  requestMethods: ['get'],
  isUrlFilterCaseSensitive: true,
});

export function buildRules({ enabled, googleClassic }) {
  if (!enabled || !googleClassic) return [];
  return [
    {
      id: 100, priority: 1,
      action: { type: 'redirect', redirect: { transform: { queryTransform: {
        addOrReplaceParams: [{ key: 'udm', value: '14' }],
      } } } },
      condition: { ...CONDITION, regexFilter: PREFIX + '([^&#]*&)*q=[^&#]+' },
    },
    {
      id: 101, priority: 2,
      action: { type: 'allow' },
      // Any explicit mode wins, including unknown future modes and empty values.
      condition: { ...CONDITION, regexFilter: PREFIX + '([^&#]*&)*(udm|tbm)(=|&|$)' },
    },
  ];
}
