# Release and distribution — 0.3.0 RC1

Chrome numeric version: `0.3.0`, version label: `0.3.0 RC1`. Firefox numeric version: `0.3.0` (no Chromium-only `version_name`). Stable Firefox ID: `re-web@davidacook.github.io`. English is the initial popup language; Japanese is user-selectable.

## Build

```sh
npm ci
npm test
npm run check
npm run lint:firefox
npm run test:ui
npm run test:spelling
npm run build
npm run test:browser
python3 -m pip install -r requirements-dev.txt
npm run test:firefox
npm run package
```

Browser executables/tools must be installed as described in the README. Any blocked suite remains a recorded release gate; do not change a failed/blocked result to passed. Packaging checks do not establish installation or live Google behavior.

`npm run package` writes deterministic ZIPs under `dist/`:

| Artifact | Contents |
| --- | --- |
| `RE-WEB-v0.3.0-rc1-chrome.zip` | Chrome manifest at root, service worker, popup, local locales/assets, spelling script, privacy/licence/install notes. |
| `RE-WEB-v0.3.0-rc1-firefox.zip` | Firefox manifest at root, module background scripts, stable add-on ID/consent declaration, same production UI/spelling code and install notes. |
| `RE-WEB-v0.3.0-rc1-source.zip` | Source, tests, build/QA scripts, docs, screenshots and test evidence; no node_modules, secrets or test instrumentation in installable packages. |
| `SHA256SUMS.txt` | SHA-256 hashes for all three ZIPs. |

ZIP timestamps and entry ordering are fixed. Package validation checks CRCs, exact production bytes and manifest-referenced files. The two installable ZIPs intentionally have different manifests.

## Browser release gates

- [x] Actual Chrome unpacked installation and background/DNR checks: 52/52 passed in [Linux CI](https://github.com/DavidACook/Self-Development-Projects/actions/runs/40083244745).
- [x] Actual Firefox temporary installation, background/API/popup checks: 43/43 passed in the same CI run.
- [ ] Complete both browsers' [manual Google acceptance](INSTALL.md), including a non-ASCII query, Google tabs, spelling shortcut and English/Japanese.
- [ ] Confirm Web and All URL conventions against current live Google. Google's “Did you mean?” is not a guaranteed acceptance condition; the helper/link behavior is.
- [ ] Confirm real browser dictionary behavior with the dictionary/settings recorded.
- [ ] Verify no update regressions in v0.2 settings, pause behavior and language persistence.
- [ ] Record OS/browser versions; only claim platforms actually verified.

## Permanent Firefox distribution

Release/Beta Firefox normally requires Mozilla signing. An unsigned ZIP, a ZIP renamed `.xpi`, or a GitHub download is not a permanent install.

1. Use the owner's Mozilla developer account and accept store agreements only with the owner's authorization.
2. Choose an AMO listing or **self-distribution/unlisted signing**; upload the Firefox build and source when required.
3. Keep the same add-on ID, increment the numeric version for future updates and supply accurate permissions/privacy/release notes.
4. Obtain and test the **Mozilla-signed XPI** in standard Firefox. Publish that signed file or the verified AMO link as appropriate.
5. Decide whether self-hosted update metadata is needed; this candidate does not configure an update server or auto-update URL.

[Mozilla signing and distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/) · [Temporary installation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)

Do not disable signature enforcement as an install shortcut. No signing or AMO submission has been performed for this candidate.

## Chrome Web Store

A store submission is separate from the unpacked developer install. Use the owner's developer account, provide the Chrome ZIP, single-purpose explanation, exact Google host justification, privacy statement and screenshots. Resolve review feedback, test the published package and then add its verified store link. No store submission or developer-fee payment is part of this source publication.

## GitHub publication

RE:WEB is intended to live in the owner's `Self-Development-Projects` repository under `RE-WEB/`, with a front-page link and browser/source packages under `RE-WEB/downloads/`. Preserve the repository's other work. Automated checks are described by the project's workflow; the parent repository must place that workflow at its own `.github/workflows/` root to run it.

Only make a stable-version claim after the acceptance gates above pass. Tag/release/store publication is not implied by publishing a release-candidate source folder.
