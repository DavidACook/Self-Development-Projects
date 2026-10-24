// Runs only on the six declared Google hosts, in an isolated content world.
// No requests, result scraping, query logs, background messages or extra APIs.
(() => {
  if (!['/', '/webhp', '/search'].includes(location.pathname)) return;
  const api = globalThis.browser ?? globalThis.chrome;
  const defaults = { enabled: true, spellingHelper: true, language: 'en' };
  const labels = {
    en: { name: 'RE:WEB spelling help', link: 'Check spelling on Google ↗', note: 'Opens All results; AI elements may appear.' },
    ja: { name: 'RE:WEB スペル確認', link: 'Google でスペルを確認 ↗', note: '「すべて」の結果を開きます。AI が表示される場合があります。' },
  };
  let settings = { ...defaults, enabled: false }; // Fail closed until storage loads.
  let queued = false;
  let helper;
  const originals = new Map();
  const enabled = () => settings.enabled === true && settings.spellingHelper === true;
  const fields = () => [...document.querySelectorAll('textarea[name="q"], input[name="q"]')]
    .filter(field => field.type !== 'hidden' && field.type !== 'password');
  const restore = () => {
    for (const [field, original] of originals) {
      if (field.getAttribute('spellcheck') === 'true') {
        if (original === null) field.removeAttribute('spellcheck');
        else field.setAttribute('spellcheck', original);
      }
    }
    originals.clear();
    helper?.remove(); helper = undefined;
  };
  function sync() {
    queued = false;
    if (!enabled() || !['/', '/webhp', '/search'].includes(location.pathname)) { restore(); return; }
    const inputs = fields();
    for (const [field] of originals) if (!field.isConnected) originals.delete(field);
    for (const field of inputs) {
      if (!originals.has(field)) originals.set(field, field.getAttribute('spellcheck'));
      if (field.getAttribute('spellcheck') !== 'true') field.setAttribute('spellcheck', 'true');
    }
    const current = new URL(location.href);
    const query = inputs.find(field => field.value.trim())?.value || current.searchParams.get('q') || '';
    if (current.pathname !== '/search' || current.searchParams.get('udm') !== '14' || !query.trim()) {
      helper?.remove(); helper = undefined; return;
    }
    if (!helper?.isConnected) {
      const anchor = document.querySelector('#search') || document.querySelector('main');
      const form = inputs[0]?.closest('form');
      if (!anchor && !form) return; // Leave an unknown Google layout intact.
      helper = document.createElement('aside'); helper.id = 'reweb-spelling-helper';
      const brand = document.createElement('span'); brand.textContent = 'RE:WEB';
      const link = document.createElement('a'); link.target = '_blank'; link.rel = 'noopener noreferrer';
      const note = document.createElement('small');
      helper.append(brand, link, note);
      if (anchor) anchor.before(helper); else form.after(helper);
    }
    const text = labels[settings.language] || labels.en;
    if (helper.getAttribute('aria-label') !== text.name) helper.setAttribute('aria-label', text.name);
    const [brand, link, note] = helper.children;
    void brand;
    if (link.textContent !== text.link) link.textContent = text.link;
    if (note.textContent !== text.note) note.textContent = text.note;
    // An explicit All mode bypasses RE:WEB's Web rule. Never silently fetch it.
    // Drop pagination and verbatim filters, which could suppress spelling help.
    const target = new URL('/search', current.origin);
    target.searchParams.set('q', query); target.searchParams.set('udm', '0');
    for (const key of ['hl', 'gl', 'safe']) if (current.searchParams.has(key)) target.searchParams.set(key, current.searchParams.get(key));
    if (link.href !== target.href) link.href = target.href;
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(sync); } }
  // Handle Google replacing its search field and same-document results markup.
  new MutationObserver(schedule).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['spellcheck'] });
  document.addEventListener('input', event => { if (event.target?.name === 'q') schedule(); });
  window.addEventListener('popstate', schedule);
  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const key of Object.keys(defaults)) if (Object.hasOwn(changes, key)) settings[key] = changes[key].newValue ?? defaults[key];
    schedule();
  });
  api.storage.local.get(defaults).then(value => { settings = { ...defaults, ...value }; schedule(); }, () => {});
})();
