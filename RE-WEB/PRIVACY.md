# Privacy statement

Effective for **0.3.0 RC1**, 24 October 2026.

RE:WEB has no backend, account, telemetry, advertising, analytics or query logs. It does not automatically call an external spelling service or load remote fonts, scripts or images.

## Local settings

Four preferences are saved with `storage.local`: `enabled`, `googleClassic`, `spellingHelper` and `language` (`en` or `ja`). Values are not synced by the extension. Existing v0.1/v0.2 routing choices migrate; new spelling/language values default to on/English. It does not save queries, results, URLs, browsing history or personal identifiers. Uninstalling removes the extension's local settings under the browser's normal rules.

## Google routing

The browser's declarative rules add `udm=14` to ordinary supported Google searches. The background code does not receive search request payloads. Your browser still sends your query and normal request metadata to Google; Google processes those searches under its own policies. RE:WEB does not control Google's ranking, cookies, account settings, Labs participation or data handling.

## Spelling helper

When enabled, a content script runs only on the six declared Google hosts. On Google home/search pages it changes the search field's `spellcheck` hint. On Web results it reads the current query from the search field/URL **in that tab's memory** to build a visible link. It does not read search-result text, log or store the query, send it to the background, or fetch spelling results silently.

Clicking **Check spelling on Google** navigates a new tab to Google with that query in All view. This is a user-requested search; it can show AI elements. The link uses `noopener noreferrer`, so the new page cannot control the originating tab and does not receive a referrer from that link. The extension cannot guarantee Google's native correction banner.

Browser spellchecking is controlled by your browser's dictionaries and settings. Basic spellchecking may be local; enhanced/cloud modes can send text to the browser provider. RE:WEB neither enables those cloud settings nor provides a separate dictionary. Its privacy statement does not override your browser's behavior.

## Permissions

- `storage`: four local preferences.
- `declarativeNetRequestWithHostAccess`: browser-managed search routing on permitted Google sites.
- Google host permissions: `google.com`, `www.google.com`, `google.co.jp`, `www.google.co.jp`, `google.co.uk`, `www.google.co.uk` over HTTP/HTTPS. Required for redirects and the local spelling script. Browsers may describe this broadly as permission to read/change site data.

No arbitrary-site, history, tabs, clipboard, cookies, downloads, scripting or external messaging permissions. No web-accessible resources or runtime npm dependencies. The spelling script has the Google site access described above; previous versions' “no page reading/content scripts” statements do not apply to 0.3.

Firefox declares `data_collection_permissions.required: ["none"]`: RE:WEB does not collect or independently transmit personal data. Browser navigation to Google, a clicked spelling link and the browser's own spellcheck settings remain separate user/browser actions. No application server receives anything from this extension.

## Pausing, disabling and removal

Master pause disables redirect rules and removes/restores the running spelling helper's changes through a local storage event. Turning off only spelling help leaves Web routing enabled. Browser-level disabling/removal stops extension scripts; reload a Google tab to clear already-applied page changes. Existing `udm=14` URLs remain as-is until subsequent navigation.

This statement describes this source release. Any future feature that changes data handling requires a matching statement and consent declaration update. Use repository issues for reproducible bugs without posting real private queries or account information.
