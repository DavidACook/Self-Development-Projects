import { DEFAULTS, normalizeSettings, validatePatch } from './settings.js';
import { buildRules, RULE_IDS } from './rules.js';

/** Serialize settings/rules as one acknowledged operation; recover on failure. */
export function createController(api) {
  let queue = Promise.resolve();
  const enqueue = operation => {
    const result = queue.then(operation, operation);
    queue = result.catch(() => {});
    return result;
  };
  const read = async () => normalizeSettings(await api.storage.local.get(DEFAULTS));
  const apply = settings => api.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [...RULE_IDS], addRules: buildRules(settings),
  });
  const badge = async settings => {
    // Cosmetic badge failure must not undo working search rules.
    try {
      const active = settings.enabled && settings.googleClassic;
      await api.action.setBadgeText({ text: active ? 'ON' : 'OFF' });
      await api.action.setBadgeBackgroundColor({ color: active ? '#165269' : '#444b66' });
    } catch { /* Search control does not depend on the toolbar badge. */ }
  };
  return {
    reconcile: () => enqueue(async () => {
      const settings = await read();
      await apply(settings);
      await badge(settings);
      return settings;
    }),
    update: patch => enqueue(async () => {
      validatePatch(patch);
      const previous = await read();
      const next = { ...previous, ...patch };
      // Rule replacement is atomic; persist only after Chrome accepts it.
      await apply(next);
      try {
        await api.storage.local.set(next);
      } catch (error) {
        try { await apply(previous); } catch {
          throw new Error('Could not save or restore search controls. Reload RE:WEB in Extensions.');
        }
        throw error;
      }
      await badge(next);
      return next;
    }),
  };
}
