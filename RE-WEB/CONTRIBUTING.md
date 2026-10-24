# Contributing

Keep RE:WEB understandable for one maintainer. Improve Google routing correctness, Chrome/Firefox behavior, English/Japanese localization, spelling help, accessibility and documentation.

1. Run `npm ci`, `npm test`, `npm run check` and `npm run lint:firefox`.
2. For UI changes install Playwright Chromium and run `npm run test:ui` / `npm run test:spelling`. Japanese visual review needs an installed CJK font such as Noto Sans CJK JP.
3. Build and test the **correct browser manifest**; run the separate actual Chrome/Firefox suites when the host permits it. See `docs/TESTING.md`.
4. Add meaningful regression coverage for reproduced bugs. Distinguish adapters, fixtures, real extension APIs and live Google observations.
5. Keep all English/Japanese keys in sync. A Japanese speaker's review is welcome; do not claim native-language QA without it.
6. Update the changelog, privacy statement, manifests and release limitations when behavior/access changes.

No telemetry, query logs, remote code/fonts, broad host permissions or runtime dependencies without a concrete reviewed need. Never infer AI content from generic result text and hide whole containers. Preserve explicit Google modes and existing native spelling banners. Do not collect or silently fetch queries for spelling checks.

The Firefox add-on ID is stable. Do not disable signature enforcement or add a development signing key to source. Never commit credentials, real search histories or private browser screenshots. Test adapters/instrumentation belong only in development artifacts.

Complete `docs/INSTALL.md` and `docs/RELEASE.md` gates before a stable release. Publishing source to GitHub is distinct from store submission or posting on the owner's LinkedIn.
