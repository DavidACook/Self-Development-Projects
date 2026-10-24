# Prototype audit

Historical v0.1 → v0.2 audit. Current 0.3 architecture, spelling content script and Firefox support are documented in `ARCHITECTURE.md` and the changelog.

Inspected the entire `RE-WEB-v0.1.0.zip`: background worker, popup HTML/JS/CSS, Bing content script, manifest, README, MIT licence, three PNG icons and empty tests directory. The source archive was preserved separately. All executable and text files were read; the original icon was visually inspected.

## Findings

| Finding | Evidence / impact | RC1 action |
| --- | --- | --- |
| First-parameter searches missed | Running `supportedRule` against `https://www.google.com/search?q=cats` produced no match; `?hl=en&q=cats` did match. The rule consumed `?` before requiring another `?` or `&` in front of `q`. | New parameter-boundary expression and regression cases. |
| Explicit modes overwritten | `?hl=en&q=cats&udm=2` matched the fallback redirect; its query transform replaces `udm` with 14. `tbm` had no exclusion either. | Higher-priority allow rule for any `udm`/`tbm` parameter. |
| Loop protection absent | The same fallback remains eligible after transformation. Chrome may ignore identical redirects, but the code supplied no explicit escape. | Transformed URLs match the allow rule. |
| Unused invalid RE2 pattern | Unused `googleRule` uses negative lookahead. RE2 does not support lookaround; only `supportedRule` was installed. | Removed dead code; no lookaround in RC1. |
| No master control | Prototype had only Google and Bing toggles. | Added master boolean preserving engine choice. |
| Bing selectors too broad | `.b_ans.b_mop` and `#b_pole .b_wpt_bl` were not justified by live positive/negative fixtures. They could affect other modules. | Deferred filtering and removed Bing permissions/script. |
| Fragile restoration | Bing disable only queried current selector matches, so changed markup could strand a previously hidden node. Inline style priority was not retained. Observer scanned the whole page after every subtree change. | Removed the DOM modifier. No observer in RC1. |
| UI acknowledged storage only | The popup said saved before the worker had confirmed rule application; background errors went to console. | Acknowledge only after rule/storage operations; rollback rules on storage failure. |
| No meaningful tests | Tests directory was empty; README correctly called it untested. | Regression, worker/controller integration and popup-renderer tests; actual-extension suite prepared with execution limits documented. |
| Accessibility incomplete | Focus styling existed, but no master, reduced-motion handling, or explicit error recovery. | Labelled switches, keyboard flow, local About, Retry, reduced motion and forced colors. |

## Useful work retained

Retained Manifest V3, browser-managed declarative transformations, local storage, the `googleClassic` preference name for migration, free/MIT distribution, and the original blue-console product direction. There were no accounts, tracking endpoints, remote scripts, external libraries, eval calls or obvious credential handling in the prototype. Its packaging was broadly plausible MV3; that alone did not validate the request matching.

## Release scope decision

Prefer the documented Google Web view over heuristics that hide broad DOM containers. No optional AI panel filter is claimed in RC1. The architecture is five small JavaScript modules/files plus HTML/CSS/assets; adding an engine later should not require a framework or a plugin system.
