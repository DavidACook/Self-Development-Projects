# Testing and evidence

Version: **0.3.0 RC1**. Date: **24 October 2026**.

## Recorded results

| Check | Result | Evidence boundary |
| --- | --- | --- |
| Node regression/integration suite | 60 passed | Routing, settings migration, API selection, translations, trusted background messages, serialization and rollback. No real browser API installation proof. |
| Popup renderer suite | 13 passed | Production popup in Chrome Headless Shell with a browser API adapter. English default despite a Japanese browser locale; Japanese selection, persistence/failed-save rollback, keyboard, accessibility, reduced motion, narrow layouts and 600px popup budget. |
| Spelling content-script fixtures | 9 passed | Production script on local fixtures with storage adapter. Native suggestions/results retained, query encoding, Japanese labels, replacement fields, pause/restore and no automatic external requests. Not a live Google-layout or dictionary test. |
| Native Google RE2 | 36 cases passed, 2 expressions compiled | Native regex syntax/matching; not Chrome/Firefox DNR installation or permissions. |
| Both manifest/static checks | Passed | Build variants, referenced files, locales, JS syntax, exact permissions, CSP and absence of network/dynamic-code APIs. |
| Official Mozilla `web-ext` 10.8.0 lint | 0 errors, 0 warnings, 0 notices | Firefox manifest/API compatibility validation. Does not execute Firefox or sign the package. |
| ZIP integrity/byte checks | See `package-audit.json` | Deterministic browser archives, references, CRC and byte equality; no test instrumentation/dependencies in browser packages. |
| Actual Chrome extension/API suite | Blocked on this host | Chrome for Testing 151 cannot create its process-singleton Unix socket (`Operation not permitted`). No actual extension assertion ran. |
| Actual Firefox installation/API suite | Blocked on this host | Firefox 153/Marionette starts, but content processes fail while writing `/proc/self/uid_map` (`EPERM`) and the session shuts down. No add-on installation assertion ran. |
| Live Google Web/All/spelling UI | Unverified | Prior direct Google visit was blocked by an unusual-traffic CAPTCHA. No bypass or repeated probing. Provider docs support Web filtering; URL conventions and actual page layout still require manual acceptance. |
| Firefox permanent install / AMO signing | Not performed | Unsigned candidate supports temporary development installation only. |
| Other OS, mobile, Edge, incognito / managed setups | Unverified | No compatibility claim inferred from source or renderer tests. |
| Japanese speaker review | Not performed | Bilingual copy/encoding and glyph rendering checked; native linguistic review remains welcome. |

`docs/evidence/unit-tests.tap`, `ui-qa.json`, `spelling-qa.json`, `re2-qa.json`, `static-checks.txt`, `firefox-lint.json`, `browser-qa.json`, `firefox-qa.json` and `package-audit.json` record these separate results. Never reinterpret a blocked suite as passed because another suite succeeded. The large raw browser driver log is excluded from release packages; the Firefox evidence keeps a short startup-failure excerpt.

## Reproduce

```sh
npm ci
npm test
npm run check
npm run lint:firefox
npx playwright install chromium
npm run test:ui
npm run test:spelling
npm run build
npm run test:browser
python3 -m pip install -r requirements-dev.txt
npm run test:firefox
npm run package
```

Use Node 22+ / Python 3.10+. Install real Firefox and geckodriver (or let Selenium Manager resolve the driver). Set `SE_AVOID_STATS=true` to suppress Selenium Manager's own development-tool statistics. There is no Selenium dependency or statistics client in the production extension.

For this constrained host, popup/spelling rendering ran with an official Chrome Headless Shell executable selected by `REWEB_UI_CHROME_PATH`, and `REWEB_UI_SINGLE_PROCESS=1` for that renderer only. That configuration does not support proof of extension installation. Full Chrome uses `REWEB_CHROME_PATH`; Firefox uses `REWEB_FIREFOX_PATH` / `REWEB_GECKODRIVER_PATH`. Japanese visual QA requires a CJK font; Noto Sans CJK JP was installed in the test environment and is not bundled or downloaded by RE:WEB.

## Browser suites

`scripts/browser-qa.mjs` loads the actual unpacked Chrome extension in a disposable persistent profile, uses native DNR validation, runs routing cases and verifies popup/storage settings. Its navigation fixtures are served through request interception at Google-shaped URLs; they are not Google's live search results. No private browser profile or real query is used.

`scripts/firefox-qa.py` first installs the **unmodified production Firefox package** temporarily. It then installs a separate temporary test-only copy with a QA page/background opener and feedback permission so native Firefox DNR matching can be inspected. Shared production modules remain byte-identical. Results test actual background messaging, rule acceptance/matching, preferences and popup. This instrumentation is never shipped in either installable ZIP.

The project's example CI workflow runs code/static/Mozilla lint, Chrome renderer/extension checks, Firefox install/API checks and archive packaging on normal GitHub-hosted runners. In the current parent repository it belongs at the **repository root** `.github/workflows/re-web.yml`; its commands use `RE-WEB` as the working directory. A workflow file alone is not evidence that CI ran or passed. Check the repository's actual Actions results for that commit.

## Manual acceptance still required

Complete [INSTALL.md](INSTALL.md) in normal desktop Chrome and Firefox, recording browser and OS versions. Check live Web/All selection, Web Guide opt-in state, address-bar searches, native dictionaries, existing Google correction banners, helper placement, explicit tabs, pause/resume and both UI languages. Google decides whether to display a correction; do not mark the extension broken solely because a particular valid query has no native spelling banner.

After installation/API gates and manual live checks pass, update this table and `RELEASE.md` from the actual evidence. Store submission, signing and adoption are separate facts and must not be inferred from passing tests.
