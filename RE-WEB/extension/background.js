import { DEFAULTS } from './lib/settings.js';
import { createController } from './lib/controller.js';
import { api } from './lib/api.js';

const controller = createController(api);
const recover = () => controller.reconcile().catch(() => {
  // No URLs or queries in logs. Popup retries and reports a visible error.
  console.error('RE:WEB could not apply search controls. Open its popup to retry.');
});

api.runtime.onInstalled.addListener(recover);
api.runtime.onStartup.addListener(recover);
api.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && Object.keys(DEFAULTS).some(key => Object.hasOwn(changes, key))) recover();
});

api.runtime.onMessage.addListener((message, sender, respond) => {
  // Only our own extension pages can control settings. No external messaging.
  if (sender.id !== api.runtime.id || !sender.url?.startsWith(api.runtime.getURL(''))) return false;
  let operation;
  if (message?.type === 'get-settings') operation = controller.reconcile();
  else if (message?.type === 'update-settings') operation = controller.update(message.patch);
  else return false;
  operation.then(
    settings => respond({ ok: true, settings }),
    () => respond({ ok: false, error: 'Search controls could not be saved. Reopen RE:WEB to retry.' }),
  );
  return true; // Keep the MV3 message channel open until rules and storage agree.
});
