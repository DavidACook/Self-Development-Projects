# Installation, updates and manual QA

Version: **0.3.0 RC1**. Both packages are unsigned development candidates.

## Chrome 120+ desktop

1. Download and extract `RE-WEB-v0.3.0-rc1-chrome.zip` into a permanent folder.
2. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked** and select that folder (the one containing `manifest.json`).
3. Check the RE:WEB card for errors. Pin RE:WEB in the Extensions menu and open it.
4. Allow access on the requested Google sites if your browser/site-access policy requires it.
5. Reload existing Google tabs once, then perform the checks below.

From source you can load `extension/` directly. `python3 scripts/build.py` also creates `dist/chrome/`. Moving the unpacked folder breaks the installation. This is not a Chrome Web Store install.

## Firefox 140+ desktop

1. Download and extract `RE-WEB-v0.3.0-rc1-firefox.zip`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on…** and choose the extracted `manifest.json`.
4. Check that the add-on loads without manifest/background errors. Open the toolbar popup and grant Google site access if requested.
5. Reload existing Google tabs and perform the checks below.

From source run `python3 scripts/build.py`, then select `dist/firefox/manifest.json`. Do **not** load the Chrome manifest in Firefox: Firefox needs `background.scripts` rather than Chrome's service worker. The Firefox build includes a stable add-on ID, module background scripts and a no-data-collection declaration.

**Temporary add-ons disappear when Firefox closes.** For a permanent install, obtain a Mozilla-signed package via the AMO signing process (listed or self-distributed), then use the browser's normal install flow. Renaming the ZIP to `.xpi` does not add a signature. No security setting changes are required or recommended. [Release guide](RELEASE.md)

## Language

English is the initial popup/helper language, even when your browser is Japanese. Use **Language / 言語 → 日本語** to translate the interface, About, errors and spelling helper. Selection is saved locally and remains available while paused. It does not change Google's result language. Browser-level extension metadata can use Japanese according to the browser's locale.

## Manual acceptance — run in both browsers

- [ ] Popup loads with English, master on, Google Web on and spelling help on.
- [ ] Search from the address bar and Google home page. On supported `.com`, `.co.jp`, `.co.uk` GET searches, the URL ends up with one `udm=14`; no redirect loop on reload.
- [ ] Google actually selects **Web**, and normal Web results omit AI Overviews. Record whether you are opted into Web Guide in Search Labs.
- [ ] Japanese, spaces, `C++`, `&`, SafeSearch, result language, pagination and date filters survive ordinary routing.
- [ ] Images, Videos, Shopping, Maps and other explicit tabs remain available and do not get forced back to Web.
- [ ] A visibly misspelled English query gets browser spellcheck when its dictionary/settings allow it. Right-click a misspelling for suggestions.
- [ ] On Web results the spelling helper is visible, preserves native corrections if Google supplies them, and uses the currently typed text.
- [ ] Click **Check spelling on Google**: a new All tab opens and is not re-routed; the original Web tab remains. Confirm the AI caveat was visible before clicking. A native Google spelling banner is not guaranteed.
- [ ] Turn spelling help off: its link disappears and the search field's original spellcheck attribute is restored. Turn it back on.
- [ ] Pause master: rules and spelling helper stop; preferences are remembered. Resume.
- [ ] Switch to Japanese: labels, errors/About and helper text translate. Close/reopen popup and restart browser as applicable; saved language survives (temporary Firefox removal on exit may require reinstallation).
- [ ] Restore English, use keyboard Tab/Space, check narrow display and reduced motion.
- [ ] Other sites/engines receive no RE:WEB modifications.

For bug reports record browser/OS/version, extension version, affected Google domain and a harmless example query. Do not post private search history or account screenshots.

## Update / remove / troubleshoot

For Chrome, replace the existing unpacked folder's files with the new Chrome package and click **Reload** on the Extensions card. Keeping the folder preserves its unpacked identity. For Firefox temporary testing, reload/reinstall the generated Firefox package using `about:debugging`. The stable add-on ID is `re-web@davidacook.github.io`. The old `googleClassic` preference key is retained; new spelling/language values default to true/English.

Reload existing Google pages after an update. Already-open `udm=14` URLs are not rewritten when you pause. Directly navigating to explicit `udm=0` is intentionally allowed. Other country domains and same-document Google navigation without a new request may not be rerouted. Browser-managed site access can prevent redirects/content-script execution.

Use Remove on the extension's management card to uninstall. Browser-level removal/disabling can leave existing DOM modifications visible until the page reloads, because stopped content scripts cannot restore them. If the popup reports a save failure, the last confirmed settings are shown; use Retry. A failed save is never labelled successful.
