// English is deliberately the initial UI language, even in a Japanese browser.
// Only the explicit, locally saved language preference changes these strings.
export const messages = Object.freeze({
  en: {
    title: 'RE:WEB · Search controls', utility: 'PERSONAL SEARCH UTILITY',
    tagline: 'De-AI your search and reclaim your brain.',
    blurb: "Uses Google's Web filter to reduce AI summaries and other clutter.",
    terms: 'SEARCH / YOUR TERMS', connecting: 'CONNECTING', online: 'ONLINE', standby: 'STANDBY',
    active: 'ACTIVE', paused: 'PAUSED', waiting: 'WAITING', master: 'MASTER CONTROL',
    loading: 'Loading controls…', reading: 'Reading local preferences.', enabledTitle: 'Your search. Your choice.',
    pausedTitle: 'RE:WEB is paused.', enabledDescription: 'Search controls are enabled.',
    pausedDescription: 'Your preferences are remembered.', enableLabel: 'Enable RE:WEB',
    routing: 'SEARCH ROUTING', googleDescription: 'Prefer links over AI Overviews.',
    googleLabel: 'Prefer Google Web results', googleDetail: 'Google.com, .co.jp & .co.uk · Explicit search tabs are preserved.',
    modeLabel: '/ SEARCH MODE', modeWeb: 'Classic Web', modeMinusAi: 'Standard · -ai (test)', modeOff: 'Unmodified',
    webDetail: 'Google Web filter. Regular searches open with links first.',
    minusAiDetail: 'Keeps the usual Google layout and adds -ai to your query.',
    offDetail: 'No automatic search routing. Spelling help remains optional.',
    minusAiWarning: 'Experimental: -ai can exclude useful results and is not an official AI-off switch.',
    spelling: 'Spelling help', spellingDescription: 'Browser spellcheck + a Google spelling shortcut.',
    spellingLabel: 'Enable spelling help',
    apply: "Changes the result view, not Google's ranking. Applies to your next search.",
    language: 'Language / 言語', aboutButton: 'About & privacy ↗', backButton: '← Back to controls',
    aboutLabel: 'About and privacy', controlsLabel: 'Search controls',
    aboutTitle: 'AI should be a choice.',
    aboutText: "Choose Google's Web filter, try a query with -ai, or leave Google untouched. -ai excludes search results containing that term. Google still ranks and processes searches; this doesn't disable AI in the engine.",
    privacyTitle: 'Local controls. No telemetry.',
    privacyText: 'Four preferences stay on this device. Spelling help reads the Google search field locally, enables browser spellcheck and adds a link. No query logging, analytics, accounts or background search requests.',
    limitTitle: 'Spelling and Web limits.',
    limitText: "Google decides when to show ‘Did you mean?’. The shortcut opens All results, which may show AI. Browser dictionaries and settings control underlines. Ads may remain; leave the AI Web Guide experiment in Search Labs for standard Web results.",
    credits: 'Google only · Free software · MIT licence. Original RE:WEB interface. Not affiliated with Google, Mozilla or Sony.',
    local: 'Local preferences · Zero telemetry', applying: 'Applying search controls…',
    saved: 'Saved on this device. Applies to your next search.',
    unavailable: 'Controls unavailable. Retry or reload RE:WEB in Extensions.',
    saveFailed: 'Could not save. Your last confirmed settings are shown.', retry: 'Retry',
  },
  ja: {
    title: 'RE:WEB · 検索の設定', utility: 'あなたのための検索ツール',
    tagline: '検索から AI を減らして、自分で考える時間を取り戻そう。',
    blurb: 'Google の「ウェブ」表示で、AI の概要などを減らします。',
    terms: '検索を、あなたの手に', connecting: '接続中', online: '稼働中', standby: '待機中',
    active: '有効', paused: '一時停止', waiting: '待機中', master: 'メイン設定',
    loading: '設定を読み込み中…', reading: 'この端末の設定を確認しています。', enabledTitle: '検索の選択は、あなたに。',
    pausedTitle: 'RE:WEB は一時停止中です。', enabledDescription: '検索の設定が有効です。',
    pausedDescription: '設定は保存されています。', enableLabel: 'RE:WEB を有効にする',
    routing: '検索結果の表示', googleDescription: 'AI による概要より、ウェブのリンクを。',
    googleLabel: 'Google のウェブ検索を優先する', googleDetail: 'Google.com・.co.jp・.co.uk。選んだ検索タブを維持。',
    modeLabel: '/ 検索モード', modeWeb: 'ウェブ（推奨）', modeMinusAi: '通常・-ai（試験）', modeOff: '変更しない',
    webDetail: 'ウェブのリンクを優先表示します。',
    minusAiDetail: '通常の Google 検索に -ai を追加します。',
    offDetail: '検索結果の表示は変更しません。スペル確認は個別に設定できます。',
    minusAiWarning: '試験的な機能です。-ai は関連するサイトも除外する場合があり、AI 表示を無効にする公式設定ではありません。',
    spelling: 'スペル確認', spellingDescription: 'ブラウザの辞書と Google の確認リンク。',
    spellingLabel: 'スペル確認を有効にする',
    apply: '表示の設定は、次の検索から適用。検索順位は変えません。',
    language: 'Language / 言語', aboutButton: 'この拡張機能とプライバシー ↗', backButton: '← 設定に戻る',
    aboutLabel: 'この拡張機能とプライバシー', controlsLabel: '検索の設定',
    aboutTitle: 'AI を使うかどうか、自分で選ぼう。',
    aboutText: 'Google の「ウェブ」、試験的な -ai 検索、変更なしを選べます。-ai は検索結果の語句を除外します。検索の処理や順位付けは Google が行います。',
    privacyTitle: '設定は端末内に。利用状況の収集なし。',
    privacyText: '4 つの設定をこの端末だけに保存します。スペル確認は Google の検索欄を端末内で読み取り、ブラウザのスペルチェックを有効にしてリンクを追加します。検索語の記録、分析、アカウント、バックグラウンドでの検索リクエストはありません。',
    limitTitle: 'スペル確認とウェブ表示の制限',
    limitText: '「もしかして」の表示は Google が判断します。確認リンクは「すべて」の検索結果を開くため、AI が表示される場合があります。下線の表示はブラウザの設定と辞書に依存します。広告は残る場合があります。標準のウェブ表示にするには、Search Labs の AI Web Guide を無効にしてください。',
    credits: 'Google のみに対応 · 無料ソフトウェア · MIT ライセンス。RE:WEB 独自のデザイン。Google、Mozilla、Sony とは無関係です。',
    local: '設定はこの端末に保存 · 利用状況の収集なし', applying: '設定を適用中…',
    saved: 'この端末に保存しました。次の検索から適用されます。',
    unavailable: '設定を取得できません。再試行するか、拡張機能の管理画面で RE:WEB を再読み込みしてください。',
    saveFailed: '保存できませんでした。最後に保存された設定を表示しています。', retry: '再試行',
  },
});
export function translate(language, key) {
  return (messages[language] || messages.en)[key] ?? messages.en[key] ?? key;
}
export function localize(document, language) {
  document.documentElement.lang = language === 'ja' ? 'ja' : 'en';
  document.title = translate(language, 'title');
  for (const element of document.querySelectorAll('[data-i18n]')) element.textContent = translate(language, element.dataset.i18n);
  for (const element of document.querySelectorAll('[data-i18n-aria]')) element.setAttribute('aria-label', translate(language, element.dataset.i18nAria));
}
