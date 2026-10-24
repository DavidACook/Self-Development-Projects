# Architecture — 0.3.0

## Runtime

The shipped extension contains no npm runtime dependencies or network client. The shared implementation is built into two directories:

| Component | Responsibility |
| --- | --- |
| `extension/manifest.json` | Chrome MV3 baseline, six Google hosts, local assets, CSP, spelling content script. |
| `manifests/firefox.json` | Firefox overrides: module background scripts, stable gecko ID, Firefox 140+ desktop/142+ Android API floor, no-data-collection declaration. Android operation remains unverified. |
| `scripts/build.py` | Copies shared source, applies Firefox overrides, removes Chrome-only keys. No bundler/transpiler. |
| `lib/api.js` | Selects Firefox `browser` or modern Chrome `chrome` Promise APIs. |
| `lib/settings.js` | Four defaults, strict boolean/locale validation, migration and normalization. English is always the initial UI choice. |
| `lib/rules.js` | Two browser-managed dynamic rules: redirect ordinary Google GET main-frame searches; higher-priority allow for any explicit `udm`/`tbm`. |
| `lib/controller.js` | Serialized reconcile/update operations, atomic DNR replacement before storage, rollback on save failure, cosmetic toolbar badge. |
| `background.js` | Lifecycle recovery and settings messages. Only same-extension pages may message it; content-page senders are rejected. |
| `popup.*`, `lib/i18n.js` | Accessible switches, language selector, truthful save/error states, English/Japanese labels and local About/privacy. |
| `content/spelling.*` | Local search-field spellcheck hint and a user-clicked All-view shortcut on Web results. Never hides results or scrapes their text. |

## Routing

A bounded RE2 expression matches Google `.com`, `.co.jp`, `.co.uk`, apex/`www`, HTTP/HTTPS, exact `/search?`, and a nonempty `q` at any parameter position. It excludes other paths and suffix attacks. Only GET `main_frame` requests qualify. The redirect uses query transformation to set `udm=14` while preserving other values.

Rule 101 has higher priority and permits every explicit `udm` or `tbm`, including empty/unknown future values. This prevents loops and respects the user's chosen search tab. It also lets the spelling link's `udm=0` open All. RE2 has no lookaround; a JavaScript negative-lookahead replacement would be invalid in the browser.

The browser evaluates rules without delivering individual query payloads to the worker. Pausing changes subsequent navigations; existing URLs and same-document navigation are separate concerns.

## Settings consistency

Every settings mutation passes strict validation and a single operation queue. The controller applies new DNR rules atomically before saving preferences, then acknowledges success. If storage fails, it restores previous rules and reports failure. Badge failures do not undo working routing. The content script listens for local preference changes, so pausing/restoring spelling works in already-loaded tabs. It reads only the three preferences it needs.

The popup renders the last acknowledged settings after failures. A saved language updates all copy and ARIA labels; failed language saves restore the confirmed language and report the error in that language. Temporarily disabling a focused control during save restores keyboard focus unless the user moved it elsewhere.

## Spelling script

The declared host match covers only Google; runtime guards restrict behavior to `/`, `/webhp`, `/search`. An animation-frame-coalesced observer handles replaced search fields and results. Original `spellcheck` attributes are retained in memory and restored on feature/master pause. Removed fields are discarded from the map. No text is persisted or sent to the worker.

The helper creates DOM nodes with `textContent` and `URLSearchParams`, never query-derived HTML. CSS selectors target only `#reweb-spelling-helper`. It anchors next to recognizable result/form markup; unknown layouts are left alone. It does not copy Google spelling banners, infer corrections, or fetch a hidden All page. The All link is visibly labelled, uses `noopener noreferrer`, preserves `hl/gl/safe` and opens only on user activation. Browser spellchecking is a hint dependent on installed dictionaries/settings.

## Security boundaries

Only `storage` and `declarativeNetRequestWithHostAccess` API permissions. No tabs/history/cookies/clipboard/scripting permission, external message handlers, web-accessible assets or remote dependencies. Extension pages use `script-src 'self'; object-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'`. Content script styling does not grant the webpage extension-page access.

Google queries are untrusted input. URL/DOM construction treats them as text. No query/URL logs, dynamic code execution or external service calls exist in production. Development adapters and QA instrumentation are excluded from browser packages. Package scripts check manifest references, ZIP integrity and byte equality.

## Evidence boundaries

Node tests verify logic, migrations, translations and controller/background behavior. Renderer fixtures validate popup interactions and the content script with browser API adapters. Official Mozilla lint validates the Firefox package. Chrome and Firefox real-API suites are separate and can be blocked by host/browser availability. Firefox uses temporary QA instrumentation and an isolated localhost result callback because WebDriver blocks DOM reads on privileged extension pages; that callback/permission/CSP exception is absent from production packages. No local-fixture result proves current Google page behavior or store signing. See [TESTING.md](TESTING.md).
