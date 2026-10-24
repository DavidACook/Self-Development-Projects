# Changelog

## 0.3.0 RC1 — 24 October 2026

- Added separate Chrome/Firefox Manifest V3 builds; Firefox uses module background scripts and native Promise APIs, stable add-on identity and the required no-data-collection declaration.
- Added Japanese UI, accessible labels, errors, About/privacy and on-page helper text; English remains the default regardless of browser locale.
- Changed the tagline to “De-AI your search and reclaim your brain.” and added a short factual blurb.
- Added default-on spelling help: browser `spellcheck` hint plus a visibly labelled, user-clicked All-view spelling link. Native Google corrections remain untouched; no promise of forcing their appearance.
- Master pause now also removes the helper and restores field attributes; spelling can be disabled independently.
- Expanded migration, localization, popup and spelling-fixture tests, official Mozilla lint and the Firefox real-install/API runner.
- Added English/Japanese README, Chrome/Firefox install instructions, spelling troubleshooting, privacy, architecture, signing and reproducible packaging docs.
- Prepared for GitHub publication in the owner's existing projects repository. Installation/live Google acceptance remains separate from passing adapter/validator checks.

## 0.2.0 RC1 — 24 October 2026

- Replaced the prototype's broad Google fallback with a query redirect and a higher-priority explicit-mode escape rule.
- Fixed common searches where `q` is the first URL parameter.
- Preserved every existing `udm` and `tbm` mode to avoid specialised-view overrides and redirect loops.
- Added a master pause switch, serialized rule/storage changes, save error recovery and preference migration.
- Added apex and `www` coverage for Google `.com`, `.co.jp` and `.co.uk`.
- Removed experimental Bing DOM hiding and its host permission pending reliable validation.
- Created an original retro console identity, keyboard-accessible popup, reduced-motion behavior and local about/privacy view.
- Restored keyboard focus after asynchronous switch saves and kept the core control deck within a 600px popup-height budget.
- Added automated regression tests, a real-renderer UI suite, an actual-extension browser suite, documentation, evidence and packaging.
- Release candidate: full Chrome installation and live Google acceptance are still blocked/unverified in the development environment.

## 0.1.0 — prototype

Initial MV3 prototype with Google query transformation, optional experimental Bing selectors, local preferences and a blue console-style popup. It had not been browser-tested. See `docs/AUDIT.md` for confirmed defects.
