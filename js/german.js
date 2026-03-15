/* ═══════════════════════════════════════════════════════════
   js/german.js  —  Merkezi Almanca yardımcı modülü

   KRİTİK DÜZELTME: Bu dosya daha önce sadece normalizeGermanWord
   ve artikelBadgeHtml'i dışa aktarıyordu. ceviri.js, singleadd.js
   ve okuma.js'nin beklediği tüm fonksiyonlar eksikti, bu da söz
   konusu sayfaların tamamen çalışmamasına yol açıyordu.
   ═══════════════════════════════════════════════════════════ */

/* ── Servis modüllerini yeniden dışa aktar ── */
export { fetchTranslate }        from "../src/services/translate.js";
export { fetchWikiData, ARTIKEL_COLORS, TYPE_MAP } from "../src/services/wiktionary.js";
export { escapeHtml, escapeRegex, capitalize, isSingleWord } from "../src/utils/html.js";

/* ══════════════════════════════════════════════
   normalizeGermanWord
   Kelimeye artikel ekler ve baş harfi büyütür.
══════════════════════════════════════════════ */
export function normalizeGermanWord(word, wikiData) {
  if (!word) return word;
  const { artikel = "", wordType = "" } = wikiData || {};

  if (artikel) {
    const lower = word.toLowerCase();
    /* Zaten artikel içeriyorsa dokunma */
    if (lower.startsWith("der ") || lower.startsWith("die ") || lower.startsWith("das ")) {
      return word;
    }
    return `${artikel} ${word.charAt(0).toUpperCase() + word.slice(1)}`;
  }

  if (wordType === "İsim") return word.charAt(0).toUpperCase() + word.slice(1);
  return word;
}

/* ══════════════════════════════════════════════
   artikelBadgeHtml
   der / die / das için renkli HTML rozet üretir.
══════════════════════════════════════════════ */
export function artikelBadgeHtml(artikel, { size = 13 } = {}) {
  const colors = {
    der: { text: "#60c8f0", bg: "rgba(96,200,240,0.12)",  border: "rgba(96,200,240,0.25)" },
    die: { text: "#f07068", bg: "rgba(240,112,104,0.10)", border: "rgba(240,112,104,0.25)" },
    das: { text: "#a064ff", bg: "rgba(160,100,255,0.10)", border: "rgba(160,100,255,0.25)" },
  };
  if (!artikel || !colors[artikel]) return "";
  const c = colors[artikel];
  return `<span style="font-family:monospace;font-size:${size}px;padding:2px 8px;border-radius:5px;background:${c.bg};color:${c.text};border:1px solid ${c.border};">${artikel}</span>`;
}