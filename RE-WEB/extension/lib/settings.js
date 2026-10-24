/** Keep the v0.1 keys so an in-place update preserves existing choices. */
export const DEFAULTS = Object.freeze({ enabled: true, googleClassic: true, spellingHelper: true, language: 'en' });
export const BOOLEAN_KEYS = Object.freeze(['enabled', 'googleClassic', 'spellingHelper']);
export const LANGUAGES = Object.freeze(['en', 'ja']);

export function normalizeSettings(raw = {}) {
  return Object.fromEntries(Object.entries(DEFAULTS).map(([key, fallback]) => [
    key, key === 'language' ? (LANGUAGES.includes(raw[key]) ? raw[key] : fallback)
      : (typeof raw[key] === 'boolean' ? raw[key] : fallback),
  ]));
}

export function validatePatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new TypeError('Invalid settings.');
  }
  const keys = Object.keys(patch);
  if (!keys.length || keys.some(key => key === 'language' ? !LANGUAGES.includes(patch[key])
    : !BOOLEAN_KEYS.includes(key) || typeof patch[key] !== 'boolean')) {
    throw new TypeError('Settings must contain supported booleans or an English/Japanese language choice.');
  }
  return { ...patch };
}
