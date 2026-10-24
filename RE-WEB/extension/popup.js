import { DEFAULTS, BOOLEAN_KEYS, normalizeSettings } from './lib/settings.js';
import { api } from './lib/api.js';
import { translate, localize } from './lib/i18n.js';

const inputs = Object.fromEntries(Object.keys(DEFAULTS).map(key => [key, document.getElementById(key)]));
const message = document.getElementById('message');
const retry = document.getElementById('retry');
const fieldset = document.getElementById('engineControls');
const aboutButton = document.getElementById('aboutButton');
let settings = null;
let busy = true;
let feedback = 'loading';
const t = key => translate(settings?.language || 'en', key);

function render() {
  localize(document, settings?.language || 'en');
  const enabled = settings?.enabled ?? false;
  const active = enabled && settings.googleClassic;
  document.body.dataset.state = retry.hidden ? !settings ? 'loading' : active ? 'active' : 'paused' : 'error';
  document.getElementById('systemState').textContent = t(!settings ? 'connecting' : active ? 'online' : 'standby');
  document.getElementById('signalState').textContent = t(active ? 'active' : settings ? 'paused' : 'waiting');
  document.getElementById('masterTitle').textContent = t(!settings ? 'loading' : enabled ? 'enabledTitle' : 'pausedTitle');
  document.getElementById('masterDescription').textContent = t(!settings ? 'reading' : enabled ? 'enabledDescription' : 'pausedDescription');
  for (const [key, input] of Object.entries(inputs)) {
    if (key === 'language') input.value = settings?.language || 'en';
    else input.checked = settings?.[key] ?? false;
    input.disabled = busy || !settings || (BOOLEAN_KEYS.includes(key) && key !== 'enabled' && !enabled);
  }
  fieldset.disabled = busy || !settings || !enabled;
  aboutButton.textContent = t(aboutButton.getAttribute('aria-expanded') === 'true' ? 'backButton' : 'aboutButton');
  message.textContent = t(feedback);
}
async function send(type, patch) {
  const response = await api.runtime.sendMessage({ type, ...(patch ? { patch } : {}) });
  if (!response?.ok) throw new Error('Controls unavailable.');
  return normalizeSettings(response.settings);
}
async function load() {
  busy = true; retry.hidden = true; feedback = 'loading'; render();
  try { settings = await send('get-settings'); feedback = 'local'; }
  catch { feedback = 'unavailable'; retry.hidden = false; }
  finally { busy = false; render(); }
}
for (const [key, input] of Object.entries(inputs)) {
  input.addEventListener('change', async () => {
    const next = key === 'language' ? input.value : input.checked;
    const hadFocus = document.activeElement === input;
    busy = true; retry.hidden = true; feedback = 'applying'; render();
    try { settings = await send('update-settings', { [key]: next }); feedback = 'saved'; }
    catch { feedback = 'saveFailed'; retry.hidden = false; }
    finally {
      busy = false; render();
      if (hadFocus && !input.disabled && [document.body, input].includes(document.activeElement)) input.focus({ preventScroll: true });
    }
  });
}
retry.addEventListener('click', load);
aboutButton.addEventListener('click', () => {
  const opening = aboutButton.getAttribute('aria-expanded') !== 'true';
  document.body.dataset.view = opening ? 'about' : 'controls';
  aboutButton.setAttribute('aria-expanded', String(opening));
  document.getElementById('controls').hidden = opening;
  document.getElementById('about').hidden = !opening;
  render();
});
document.getElementById('version').textContent = 'v' + (api.runtime.getManifest().version_name || api.runtime.getManifest().version);
load();
