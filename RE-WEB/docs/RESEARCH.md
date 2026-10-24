# Research notes — 24 October 2026

Only primary provider / browser documentation is used for product claims. URLs and page content were checked during this work. A URL convention working in an old article is not proof of current live behavior.

## Google

[Google Search Help: AI Overviews and the Web filter](https://support.google.com/websearch/answer/14901683?hl=en) describes the Web filter as text links without features such as AI Overviews. It does not promise that ordinary Search has a global AI-off switch.

[Google: Web Guide experiment](https://blog.google/products-and-platforms/products/search/web-guide-labs/) describes an opt-in experiment that uses Gemini to group results in the Web tab. [A later Google update](https://blog.google/products-and-platforms/products/search/tools-partnerships-web-ecosystem/) also describes its expansion for opted-in users. Thus selecting Web is not an unconditional promise of no AI presentation. RE:WEB tells opted-in users to leave that experiment themselves.

`udm=14` is the existing prototype's Web-view URL mechanism. The provider help page supports the choice of Web view, but is not an API contract for that parameter. Direct live verification in this session was inconclusive: a direct request returned HTTP 429; a separate browser visit showed Google's unusual-traffic / reCAPTCHA page before results. No challenge was solved or bypassed, and no alternate Google route was used to evade it. **Current parameter-to-Web-tab behavior is unverified in this environment.**

Decision: keep the small declarative request transformation as an installable candidate, preserve all explicit views, and require a real local Google acceptance check before calling it stable. No Google DOM filters or automatic account/Labs changes.

## Historical Bing investigation (outside current scope)

[Microsoft Bing: Introducing Copilot Search](https://blogs.bing.com/search/2025/4/Introducing-Copilot-Search-in-Bing/) describes a generative-search experience. [Bing's own Settings page](https://www.bing.com/account/general) exposes controls that can vary by user and region; the public page inspected here did not establish a reliable universal AI-summary-off setting.

A direct anonymous Bing search response was fetched successfully, but did not provide a usable positive fixture for the prototype's purported AI-panel selectors. That response alone cannot validate hiding a feature it did not show. The prototype's broad selectors did not establish safe boundaries against ordinary modules. No stable, verified Bing filter is claimed in RC1. Omit its script and host permission; document the deferral instead of presenting a placebo toggle.

No additional engines were added. Expanding site access without a verified feature would conflict with the small-product goal.

## Browser implementation

[Chrome declarativeNetRequest API](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest) is the primary reference for browser-managed transforms, host access, RE2 filters, rule priority and testing APIs. The implementation uses a higher-priority explicit-mode allow rule because RE2 lookaround is unsupported. This is an engineering inference applied to RE:WEB's own rules, rather than a claim about provider settings.

[Playwright's extension testing guidance](https://playwright.dev/docs/chrome-extensions) describes persistent-context Chromium extension tests and the distinction from ordinary headless rendering. The prepared browser suite follows that approach. Full Chrome for Testing startup failed on this host because AF_UNIX sockets are denied. Official Chrome Headless Shell could render the popup in a single-process test configuration, but does not prove extension installation.

[Google's RE2 library](https://github.com/google/re2) was used for an additional native syntax/matching check, rather than relying only on JavaScript RegExp tests. Two expressions compiled and all 36 routing cases passed. [Chrome's action documentation](https://developer.chrome.com/docs/extensions/reference/api/action?hl=ja) describes a 600px popup-height limit; the core interface was compacted and tested against that budget.

All feature statements distinguish code-level tests, renderer tests, actual browser-extension tests, and live service observations. See `TESTING.md`.


## 0.3 additions — Firefox, Japanese and spelling

[MDN background manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background) documents Firefox module background scripts and Chrome service workers. Separate manifests remove browser-specific ambiguity. [Mozilla's built-in data consent guide](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/) documents the no-data-collection declaration and Firefox 140 desktop / 142 Android API floors. Android is not a verified release target here.

[Mozilla web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) provides the official package validator used here. [Selenium's Firefox add-on API](https://www.selenium.dev/selenium/docs/api/py/selenium_webdriver_firefox/selenium.webdriver.firefox.webdriver.html) documents temporary add-on installation for the real-browser suite. These do not replace manual live-search acceptance or Firefox signing.

[Google's search tips](https://support.google.com/websearch/answer/134479?hl=en) describe its spelling system, but do not offer a guarantee that every Web result page will show a “Did you mean?” banner. [MDN spellcheck](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/spellcheck) explicitly describes the HTML attribute as a hint. [Chrome spellchecking](https://support.google.com/chrome/answer/12027911?hl=en) distinguishes browser settings including enhanced checking; [Firefox spellchecking](https://support.mozilla.org/en-US/kb/how-do-i-use-firefox-spell-checker) explains dictionary/settings dependence.

Engineering decision: set the Google search field hint, preserve native suggestions and provide a clearly labelled, user-clicked All-view shortcut. Do not promise a forced native banner or silently fetch an extra Google response. `udm=0` as All, like `udm=14` as Web, is an implementation assumption about Google's URL convention and remains a live acceptance check. The All shortcut may show AI and says so before opening.

Japanese support is explicit local UI selection, not automatic browser-locale inference. Source strings are translated; a native Japanese speaker's linguistic review remains welcome. Test screenshots use an installed Noto Sans CJK JP font from the [official Noto CJK project](https://github.com/notofonts/noto-cjk), solely in the development renderer; no font download is made by the extension.


The subsequent GitHub-hosted Linux run executed both real-browser suites successfully: [52 Chrome checks and 43 Firefox checks](https://github.com/DavidACook/Self-Development-Projects/actions/runs/40083244745). This resolves the native installation/API gate that the local host restrictions prevented; it does not establish live Google layout or dictionary behavior. Firefox diagnostics require `extensions.dnr.feedback=true`, set only in a disposable test profile; production users do not need it.
