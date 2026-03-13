/**
 * js/german.js
 * ─────────────────────────────────────────────────────────
 * Almanca kelime işlemleri için ortak yardımcı modül.
 * okuma.js, ceviri.js ve singleadd.js tarafından import edilir.
 *
 * Export'lar:
 *   fetchWikiData(word)          → { artikel, wordType, plural, genitive, baseForm, autoTags }
 *   fetchTranslate(word, opts)   → { main, alts }
 *   normalizeGermanWord(word, wikiData)  → "der Hund" formatında string
 *   artikelBadgeHtml(artikel, size?)     → renkli HTML span string'i
 *   capitalize(str)              → ilk harf büyük
 *   escapeHtml(str)              → XSS-safe string
 *   isSingleWord(text)           → boolean
 *   ARTIKEL_COLORS               → { der, die, das } renk map'i
 * ─────────────────────────────────────────────────────────
 */

/* ══════════════════════════════════════════════
   SABİTLER
══════════════════════════════════════════════ */

/** Artikel → CSS renk değerleri */
export const ARTIKEL_COLORS = {
  der: { text: "#60c8f0", bg: "rgba(96,200,240,0.12)",  border: "rgba(96,200,240,0.25)"  },
  die: { text: "#f07068", bg: "rgba(240,112,104,0.10)", border: "rgba(240,112,104,0.25)" },
  das: { text: "#a064ff", bg: "rgba(160,100,255,0.10)", border: "rgba(160,100,255,0.25)" },
};

/** Almanca kelime türü → Türkçe etiket + otomatik tag */
export const TYPE_MAP = {
  "Substantiv":   { label: "İsim",   tag: "isim"  },
  "Verb":         { label: "Fiil",   tag: "fiil"  },
  "Adjektiv":     { label: "Sıfat",  tag: "sıfat" },
  "Adverb":       { label: "Zarf",   tag: "zarf"  },
  "Präposition":  { label: "Edat",   tag: null    },
  "Konjunktion":  { label: "Bağlaç", tag: null    },
  "Pronomen":     { label: "Zamir",  tag: null    },
  "Interjektion": { label: "Ünlem",  tag: null    },
};

/* ══════════════════════════════════════════════
   WİKTİONARY
══════════════════════════════════════════════ */

/** Wiktionary sonuçları için önbellek (sayfa yenilenmeden geçerli) */
const _wikiCache = new Map();

/**
 * Bir Almanca kelime için Wiktionary'den zengin bilgi çeker.
 * Sonuçlar önbellekte saklanır; aynı kelime için ikinci çağrı anında döner.
 *
 * @param {string} word  Almanca kelime (büyük/küçük harf fark etmez)
 * @returns {Promise<{
 *   artikel:  string,   // "der" | "die" | "das" | ""
 *   wordType: string,   // "İsim" | "Fiil" | "Sıfat" | ...
 *   plural:   string,   // Nominativ Plural (isimler)
 *   genitive: string,   // Genitiv Singular (isimler)
 *   baseForm: string,   // İnfinitiv/Positiv (fiil/sıfat çekimlerinde)
 *   autoTags: string[], // ["isim"] | ["fiil"] | []
 * }>}
 */
export async function fetchWikiData(word) {
  const key = word.trim().toLowerCase();
  if (_wikiCache.has(key)) return _wikiCache.get(key);

  const empty = { artikel: "", wordType: "", plural: "", genitive: "", baseForm: "", autoTags: [] };

  try {
    const cap    = capitalize(word);
    const params = new URLSearchParams({
      action: "parse", page: cap,
      prop: "wikitext", format: "json", origin: "*"
    });
    const res  = await fetch("https://de.wiktionary.org/w/api.php?" + params);
    const data = await res.json();
    const wt   = data?.parse?.wikitext?.["*"] || "";

    if (!wt) { _wikiCache.set(key, empty); return empty; }

    const result = _parseWikitext(wt, word);
    _wikiCache.set(key, result);
    return result;

  } catch {
    _wikiCache.set(key, empty);
    return empty;
  }
}

/** Wikitext'i parse et — iç kullanım */
function _parseWikitext(wt, originalWord) {
  const result = { artikel: "", wordType: "", plural: "", genitive: "", baseForm: "", autoTags: [] };

  const typeMatch = wt.match(/\{\{Wortart\|([^|}\n]+)/);
  if (!typeMatch) return result;

  const rawType = typeMatch[1].trim();
  const typeInfo = TYPE_MAP[rawType] || { label: rawType, tag: null };
  result.wordType = typeInfo.label;
  if (typeInfo.tag) result.autoTags.push(typeInfo.tag);

  /* İsim: artikel + çoğul + genitif */
  if (rawType === "Substantiv") {
    if      (/\|\s*Genus\s*=\s*m/i.test(wt))       result.artikel = "der";
    else if (/\|\s*Genus\s*=\s*[fp]/i.test(wt))    result.artikel = "die";
    else if (/\|\s*Genus\s*=\s*n/i.test(wt))       result.artikel = "das";

    const pMatch = wt.match(/\|\s*Nominativ Plural\s*=\s*([^\n|{}]+)/);
    if (pMatch) {
      const p = pMatch[1].trim().replace(/\[\[|\]\]/g, "");
      if (p && p !== "—" && p !== "-") result.plural = p;
    }

    const gMatch = wt.match(/\|\s*Genitiv Singular\s*=\s*([^\n|{}]+)/);
    if (gMatch) {
      const g = gMatch[1].trim().replace(/\[\[|\]\]/g, "");
      if (g && g !== "—" && g !== "-") result.genitive = g;
    }
  }

  /* Fiil: infinitiv (çekimli form girilmişse gehe → gehen) */
  if (rawType === "Verb") {
    const bMatch = wt.match(/\|\s*Grundform\s*=\s*([^\n|{}]+)/)
                || wt.match(/\|\s*Infinitiv\s*=\s*([^\n|{}]+)/);
    if (bMatch) {
      const b = bMatch[1].trim().replace(/\[\[|\]\]/g, "");
      if (b && b.toLowerCase() !== originalWord.toLowerCase()) result.baseForm = b;
    }
  }

  /* Sıfat: temel form (karşılaştırma dereceleri için) */
  if (rawType === "Adjektiv") {
    const pMatch = wt.match(/\|\s*Positiv\s*=\s*([^\n|{}]+)/);
    if (pMatch) {
      const pos = pMatch[1].trim().replace(/\[\[|\]\]/g, "");
      if (pos && pos.toLowerCase() !== originalWord.toLowerCase()) result.baseForm = pos;
    }
  }

  return result;
}

/* ══════════════════════════════════════════════
   GOOGLE TRANSLATE
══════════════════════════════════════════════ */

/**
 * Google Translate (gtx endpoint) ile çeviri yapar.
 *
 * @param {string} word
 * @param {{ sl?: string, tl?: string }} opts  Varsayılan: de→tr
 * @returns {Promise<{ main: string, alts: string[] }>}
 */
export async function fetchTranslate(word, { sl = "de", tl = "tr" } = {}) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=at&q=${encodeURIComponent(word)}`;
  const res  = await fetch(url);
  const data = await res.json();

  const main = data[0]?.map(t => t?.[0]).filter(Boolean).join("") || "—";

  const alts = [];
  if (data[5]) {
    data[5].forEach(entry => {
      entry?.[2]?.forEach(item => {
        const w = item?.[0];
        if (w && w !== main) alts.push(w);
      });
    });
  }

  return { main, alts: [...new Set(alts)].slice(0, 8) };
}

/* ══════════════════════════════════════════════
   KELİME NORMALLEŞT İRME
══════════════════════════════════════════════ */

/**
 * Kelimeyi kayıt için normalize eder:
 * - İsim ise baş harfi büyütür
 * - Artikel varsa önüne ekler (zaten yoksa)
 * - "hund" → "der Hund",  "gehen" → "gehen"
 *
 * @param {string} word
 * @param {{ artikel: string, wordType: string }} wikiData
 * @returns {string}
 */
export function normalizeGermanWord(word, wikiData) {
  if (!word) return word;
  const { artikel = "", wordType = "" } = wikiData || {};

  if (artikel) {
    // Artikel zaten başta varsa tekrar ekleme
    const lower = word.toLowerCase();
    if (lower.startsWith("der ") || lower.startsWith("die ") || lower.startsWith("das ")) {
      return word; // Zaten var
    }
    return `${artikel} ${capitalize(word)}`;
  }

  if (wordType === "İsim") {
    return capitalize(word); // Artikel bulunamadıysa en azından büyük harf
  }

  return word;
}

/* ══════════════════════════════════════════════
   HTML YARDIMCILARI
══════════════════════════════════════════════ */

/**
 * Artikel için renkli HTML span üretir.
 * CSS class'ı yoksa inline style kullanır (popup'lar için).
 *
 * @param {string} artikel  "der" | "die" | "das"
 * @param {{ size?: number, useCssClass?: boolean }} opts
 * @returns {string}  HTML string
 */
export function artikelBadgeHtml(artikel, { size = 13, useCssClass = false } = {}) {
  if (!artikel || !ARTIKEL_COLORS[artikel]) return "";

  if (useCssClass) {
    // singleadd.css'teki .wiki-artikel--der gibi class'lar varsa
    return `<span class="wiki-artikel wiki-artikel--${artikel}">${artikel}</span>`;
  }

  const c = ARTIKEL_COLORS[artikel];
  return `<span style="font-family:monospace;font-size:${size}px;padding:2px 8px;border-radius:5px;background:${c.bg};color:${c.text};border:1px solid ${c.border};">${artikel}</span>`;
}

/* ══════════════════════════════════════════════
   GENEL YARDIMCILAR
══════════════════════════════════════════════ */

/** İlk harfi büyük yapar */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** HTML özel karakterlerini kaçış dizisine çevirir */
export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}

/** Regex özel karakterlerini kaçış dizisine çevirir */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Tek kelime mi (boşluk yok, 1+ harf) */
export function isSingleWord(text) {
  return typeof text === "string" && text.trim().length > 0 && !/\s/.test(text.trim());
}