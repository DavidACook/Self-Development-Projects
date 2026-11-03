# Google search modes (v0.4.0 alpha1)

Development feature: `feature/reweb-google-modes`. **Not a store release.** The existing 0.3.0 RC1 ZIP downloads do not include this selector.

## What the controls mean

| Mode | Behaviour | Trade-off |
| --- | --- | --- |
| Classic Web (default) | Uses Google's Web filter (`udm=14`) for ordinary searches | Omits features from Google's All tab; does not disable AI processing |
| Standard · -ai (experimental) | Appends a separate `-ai` exclusion operator to ordinary search queries, preserving the All layout | **Can exclude relevant results.** This is not an official way to disable AI Overviews, and it may stop working |
| Unmodified Google | No automatic Google search routing | Google's normal AI features may appear |

Each mode respects explicit `udm`/`tbm` choices, such as Images, Shopping, News and AI Mode. The master pause stops routing altogether. The independent spelling helper may still edit the search field or offer its Google All link, unless turned off.

On a new install, the mode defaults to **Classic Web**. For existing users, the older `googleClassic=false` preference migrates to **Unmodified** instead of unexpectedly turning routing on.

## Privacy

Routing happens with browser-managed `declarativeNetRequest` rules. The experimental modifier changes the actual query Google receives, so Google sees `-ai` when that mode is selected. RE:WEB does not log queries, send them to an app server or request broader host permissions.

## Manual acceptance checklist (Chrome and Firefox desktop)

1. Install the **branch build**, not the old 0.3.0 RC1 download. Confirm the popup shows version 0.4.0 and the three options.
2. Fresh install: ordinary `?q=cats` navigates to `?q=cats&udm=14`, with links in the Web tab.
3. Switch to **Standard · -ai** and make a *fresh* search. Confirm the resulting query contains one `-ai` exclusion and **does not** acquire `udm=14`.
4. Search using a query that already ends in `-ai`. Confirm there is no duplicated operator or redirect loop.
5. Test `?hl=ja&q=%E7%8C%AB&safe=active` and searches in which `q` is the first and last parameter. Confirm query values and search filters survive.
6. Explicitly choose Images, News and Shopping in each mode; confirm RE:WEB respects those selections.
7. Select **Unmodified** and make a *new* search. Confirm RE:WEB adds neither `udm=14` nor `-ai`.
8. Pause the master, restart the browser and reopen the popup. Confirm the chosen mode is remembered but routing is inactive.
9. Test save failures and the keyboard: Tab to the mode selector and operate it with arrow keys and Enter. Confirm the experimental warning is visible when needed.
10. Switch to 日本語 and back, inspect the selector and warning at 320px/380px and 200% zoom, and verify reduced-motion and high-contrast visibility.

**Evidence boundary:** Local fixtures and automated extension APIs can show that routing rules are installed and applied. They cannot prove that Google's live search shows or suppresses an AI Overview for every query. Record actual live-page observations separately; do not bypass CAPTCHAs.

## Before release

- Record a live Chrome and Firefox pass for the exact packaged version and test real browser spellchecking.
- Recheck `-ai` results for false exclusions and revise/remove the experimental mode if unreliable.
- Check release package signing and store rules.
- Obtain approval before merging into the main project or releasing publicly.

Reference: [Chrome declarativeNetRequest](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest) · [MDN Redirect](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest/Redirect).
