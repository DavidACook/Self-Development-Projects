# Spelling help

RE:WEB provides two complementary conveniences, enabled by default:

1. A `spellcheck="true"` hint on supported Google search fields. Browser dictionaries decide which words are underlined and what right-click suggestions appear.
2. A **Check spelling on Google** link on Web results. It opens the current typed query in Google's All view, in a new tab, only when clicked.

It leaves Google's existing “Did you mean?”, “Showing results for” and “Search instead for” elements intact. **Their presence is Google's decision.** There is no verified, supported Google flag that guarantees that native UI for every query. RE:WEB does not promise automatic corrections or manufacture a native Google banner.

## Enable browser spellchecking

Chrome: Settings → Languages → Spell check → enable basic checking and the dictionary you want. Basic checking is preferable if you want to avoid enhanced spellcheck's cloud processing. Names can vary with browser language/version.

Firefox: Settings → General → Language → **Check your spelling as you type**. Add the relevant dictionary if unavailable; some distributions need a separate dictionary. In a search field, right-click and check **Check Spelling** / **Languages**. Single-line field defaults can differ, so RE:WEB supplies the explicit hint.

[Chrome's official spellcheck documentation](https://support.google.com/chrome/answer/12027911?hl=en) · [Firefox spelling documentation](https://support.mozilla.org/en-US/kb/how-do-i-use-firefox-spell-checker)

The HTML attribute is a hint, not an OS/browser settings override. Japanese UI support means translated controls and helper text; Japanese input conversion remains with your IME, and no Japanese grammar dictionary is bundled.

## What the shortcut does

It constructs `/search?q=…&udm=0` on the same supported Google origin and retains `hl`, `gl` and `safe`. It omits pagination and verbatim/date filters when constructing this separate spelling search. The query is URL-encoded via `URLSearchParams`, not interpreted as HTML. Explicit `udm=0` is allowed by the higher-priority routing rule, so the spelling tab is not forced back to Web.

**All results may show AI summaries.** The on-page helper says so before you click. Nothing is fetched in the background, no Google result HTML is copied or scraped, and no dictionary/AI service is queried by RE:WEB. The original Web tab remains open. Google's handling of `udm=0` is a URL convention and must be checked in manual acceptance.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| No underlines | Browser spellcheck and dictionary installed/enabled; click inside the field and type. Browser behavior varies. |
| No helper link | RE:WEB and spelling help enabled; supported Google domain; actual `/search` page with `udm=14`, nonempty query and a recognizable result/search-form anchor. |
| Recently installed/updated | Reload Google tabs once to load the new content script. |
| No “Did you mean?” on All | Google may consider the query valid or choose another presentation. RE:WEB cannot force a suggestion. |
| Link opens an AI-containing page | Expected possible behavior of Google's All view; the helper warns before opening it. |
| Want only URL routing | Turn off **Spelling help** in the popup. Host permissions are shared with Google routing; disabling the feature removes its behavior, not the underlying manifest declaration. |
| Removed the extension but a helper remains | Reload the page. Browser removal stops scripts before they can undo existing DOM changes. |

The helper uses a small, animation-frame-coalesced observer to handle Google replacing its input. It restores each field's original `spellcheck` attribute when paused. Unknown layouts are left intact instead of injecting a floating panel or hiding results. Fixture tests cover these behaviors; they do not guarantee every live Google experiment/layout.
