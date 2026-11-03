/** Existing v0.1-v0.3 googleClassic preferences migrate to googleMode. */
export const GOOGLE_MODES = Object.freeze(['web', 'minusAi', 'off']);
export const DEFAULTS = Object.freeze({ enabled: true, googleMode: 'web', spellingHelper: true, language: 'en' });
export const BOOLEAN_KEYS = Object.freeze(['enabled', 'spellingHelper']);
export const LANGUAGES = Object.freeze(['en', 'ja']);

export function normalizeSettings(raw = {}) {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : DEFAULTS.enabled,
    googleMode: GOOGLE_MODES.includes(input.googleMode) ? input.googleMode
      : input.googleClassic === false ? 'off' : DEFAULTS.googleMode,
    spellingHelper: typeof input.spellingHelper === 'boolean' ? input.spellingHelper : DEFAULTS.spellingHelper,
    language: LANGUAGES.includes(input.language) ? input.language : DEFAULTS.language,
  };
}

export function validatePatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new TypeError('Invalid settings.');
  }
  const keys = Object.keys(patch);
  if (!keys.length || keys.some(key => key === 'googleMode' ? !GOOGLE_MODES.includes(patch[key])
    : key === 'language' ? !LANGUAGES.includes(patch[key])
      : !BOOLEAN_KEYS.includes(key) || typeof patch[key] !== 'boolean')) {
    throw new TypeError('Settings must contain supported switches, a Google mode or an English/Japanese language choice.');
  }
  return { ...patch };
}
