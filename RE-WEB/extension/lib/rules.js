// Browser-managed declarative rules; no query reaches an extension server or worker.
// Explicit Google modes always take priority. RE2 has no lookaround.
export const RULE_IDS = Object.freeze([100, 101, 102, 103]);
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
  resourceTypes: ['main_frame'], requestMethods: ['get'], isUrlFilterCaseSensitive: true,
});
const EXPLICIT_MODE = PREFIX + '([^&#]*&)*(udm|tbm)(=|&|$)';
const QUERY_PRESENT = PREFIX + '([^&#]*&)*q=[^&#]+';
// Google may encode spaces as + or %20. Treat an existing trailing -ai operator
// as satisfied, so the experimental redirect never adds it twice.
const MINUS_ALREADY = PREFIX + '([^&#]*&)*q=(?:-ai|[^&#]*(\\+|%20)-ai)(&|#|$)';
// Capture prefix through q=, its value, and the remainder verbatim. Query can be
// first or later and contains no raw &/#. The non-greedy prefix favours first q.
const MINUS_APPEND = '^((?:https?://(?:www\\.)?google\\.(?:com|co\\.jp|co\\.uk)/search\\?)(?:[^&#]*&)*?q=)([^&#]+)(.*)$';

export function buildRules(settings = {}) {
  const { enabled = true } = settings;
  const googleMode = ['web', 'minusAi', 'off'].includes(settings.googleMode)
    ? settings.googleMode : settings.googleClassic === false ? 'off' : 'web';
  if (!enabled || googleMode === 'off') return [];

  const explicitAllow = {
    id: 101, priority: 3, action: { type: 'allow' },
    condition: { ...CONDITION, regexFilter: EXPLICIT_MODE },
  };

  if (googleMode === 'web') return [
    {
      id: 100, priority: 1,
      action: { type: 'redirect', redirect: { transform: { queryTransform: {
        addOrReplaceParams: [{ key: 'udm', value: '14' }],
      } } } },
      condition: { ...CONDITION, regexFilter: QUERY_PRESENT },
    },
    explicitAllow,
  ];

  return [
    {
      id: 102, priority: 1,
      action: { type: 'redirect', redirect: { regexSubstitution: '\\1\\2+-ai\\3' } },
      condition: { ...CONDITION, regexFilter: MINUS_APPEND },
    },
    explicitAllow,
    {
      id: 103, priority: 2, action: { type: 'allow' },
      condition: { ...CONDITION, regexFilter: MINUS_ALREADY },
    },
  ];
}
