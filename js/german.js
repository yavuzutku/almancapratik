/* ══════════════════════════════════════════════
   german.js
   Almanca kelime zenginleştirme yardımcıları:
     - Wiktionary (de.wiktionary.org) üzerinden
       artikel / kelime türü / temel form / çoğul / genitif
     - MyMemory üzerinden Almanca → Türkçe çeviri önerisi
   ══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════
   GENEL YARDIMCILAR
══════════════════════════════════════════════ */

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function capitalize(str) {
  const s = String(str ?? "");
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* Artikel rozeti için renk referansları (global.css'teki gender-* token'larına denk düşer) */
export const ARTIKEL_COLORS = {
  der: "var(--gender-der)",
  die: "var(--gender-die)",
  das: "var(--gender-das)",
};

export function artikelBadgeHtml(artikel) {
  if (!artikel || !ARTIKEL_COLORS[artikel]) return "";
  return `<span class="wiki-artikel wiki-artikel--${artikel}">${artikel}</span>`;
}

/* ══════════════════════════════════════════════
   KELİMEYİ NORMALLEŞTİR
   - Kullanıcı "der Hund" ya da "Hund" yazmış olabilir.
   - İsimse: baş harf büyük + (varsa) artikel önek.
   - Diğer türlerde (fiil, sıfat, zarf…): küçük harfle başlar.
══════════════════════════════════════════════ */
export function normalizeGermanWord(word, wikiData) {
  let w = String(word ?? "").trim();
  if (!w) return w;

  // Kullanıcının yazmış olabileceği artikel/ön eki temizle
  w = w.replace(/^(der|die|das|ein|eine)\s+/i, "").trim();
  if (!w) return w;

  const artikel = wikiData?.artikel || null;
  const isNoun  = artikel || wikiData?.wordType === "isim";

  if (isNoun) {
    w = capitalize(w);
    return artikel ? `${artikel} ${w}` : w;
  }

  return w.charAt(0).toLowerCase() + w.slice(1);
}

/* ══════════════════════════════════════════════
   WIKTIONARY — ZENGİNLEŞTİRME
══════════════════════════════════════════════ */

const WIKI_ENDPOINT = "https://de.wiktionary.org/w/api.php";

const WORD_TYPE_LABELS = {
  "Substantiv":        "isim",
  "Verb":               "fiil",
  "Adjektiv":           "sıfat",
  "Adverb":             "zarf",
  "Präposition":        "edat",
  "Pronomen":           "zamir",
  "Konjunktion":        "bağlaç",
  "Interjektion":       "ünlem",
  "Numerale":           "sayı",
  "Artikel":            "artikel",
  "Konjugierte Form":   "çekimli fiil",
  "Deklinierte Form":   "çekimli isim",
  "Komparativ":         "karşılaştırma",
  "Superlativ":         "üstünlük",
};

const AUTO_TAGS_BY_TYPE = {
  "Substantiv": ["isim"],
  "Verb":       ["fiil"],
  "Adjektiv":   ["sıfat"],
  "Adverb":     ["zarf"],
};

const GENUS_TO_ARTIKEL = { m: "der", f: "die", n: "das" };

async function fetchWikitext(title) {
  const url =
    `${WIKI_ENDPOINT}?action=parse&page=${encodeURIComponent(title)}` +
    `&format=json&formatversion=2&prop=wikitext&redirects=1&origin=*`;

  let res;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  if (data?.error) return null;
  return data?.parse?.wikitext ?? null;
}

/* Sayfa birden fazla dil içerebilir — sadece "Deutsch" bölümünü ayıkla */
function extractGermanSection(wikitext) {
  if (!wikitext) return null;
  const match = wikitext.match(
    /==\s*\{\{Sprache\|Deutsch\}\}\s*==([\s\S]*?)(?=\n==\s*\{\{Sprache\|[^}]+\}\}\s*==|$)/
  );
  return match ? match[1] : wikitext;
}

function extractTemplateBlock(section, templateName) {
  const re = new RegExp(`\\{\\{\\s*${templateName}[\\s\\S]*?\\n\\}\\}`);
  const match = section.match(re);
  return match ? match[0] : null;
}

function extractParam(templateBlock, paramNames) {
  if (!templateBlock) return null;
  for (const name of paramNames) {
    const re = new RegExp(`\\|\\s*${name}\\s*=\\s*([^|\\n}]+)`);
    const m = templateBlock.match(re);
    if (m) {
      const val = m[1].trim();
      if (val && val !== "—" && val !== "-") return val;
    }
  }
  return null;
}

function extractWordTypes(section) {
  const types = [];
  const re = /\{\{Wortart\|([^|}]+)\|Deutsch\}\}/g;
  let m;
  while ((m = re.exec(section))) {
    const t = m[1].trim();
    if (!types.includes(t)) types.push(t);
  }
  return types;
}

/* "gehe" gibi çekimli formlar için temel/mastar formu bul */
function extractBaseForm(section) {
  let m = section.match(/\{\{Grundformverweis[^|}]*\|([^|}]+)/);
  if (m) return m[1].trim();

  m = section.match(/Konjugierte Form von \[\[([^\]|#]+)/);
  if (m) return m[1].trim();

  m = section.match(/Flektierte Form von \[\[([^\]|#]+)/);
  if (m) return m[1].trim();

  m = section.match(/Deklinierte Form von \[\[([^\]|#]+)/);
  if (m) return m[1].trim();

  return null;
}

/**
 * Bir Almanca kelime için Wiktionary'den artikel, kelime türü,
 * temel form, çoğul ve genitif bilgisini getirir.
 * Bulunamazsa boş obje döner (hata fırlatmaz — çağıran taraf sessizce yutabilir).
 */
export async function fetchWikiData(rawWord) {
  const word = String(rawWord ?? "").trim();
  if (!word) return {};

  // Almancada isimler büyük harfle başlar; hem yazıldığı gibi hem
  // büyük/küçük harf varyantlarını dene.
  const candidates = [...new Set([word, capitalize(word), word.toLowerCase()])];

  let section = null;
  for (const candidate of candidates) {
    const wikitext = await fetchWikitext(candidate);
    const extracted = extractGermanSection(wikitext);
    if (extracted) { section = extracted; break; }
  }
  if (!section) return {};

  const wordTypes  = extractWordTypes(section);
  const rawType    = wordTypes[0] || null;
  const primaryType =
    wordTypes.find(t => t !== "Konjugierte Form" && t !== "Deklinierte Form") ||
    rawType;

  const result = {
    wordType: rawType ? (WORD_TYPE_LABELS[rawType] || rawType) : null,
    artikel:  null,
    baseForm: null,
    plural:   null,
    genitive: null,
    autoTags: primaryType && AUTO_TAGS_BY_TYPE[primaryType]
      ? [...AUTO_TAGS_BY_TYPE[primaryType]]
      : [],
  };

  if (primaryType === "Substantiv") {
    const nounBlock = extractTemplateBlock(section, "Deutsch Substantiv Übersicht");
    const genus = extractParam(nounBlock, ["Genus", "Genus 1"]);
    if (genus) result.artikel = GENUS_TO_ARTIKEL[genus.toLowerCase()] || null;
    result.plural   = extractParam(nounBlock, ["Nominativ Plural", "Nominativ Plural 1"]);
    result.genitive = extractParam(nounBlock, ["Genitiv Singular", "Genitiv Singular 1"]);
  }

  if (rawType === "Konjugierte Form" || rawType === "Deklinierte Form") {
    result.baseForm = extractBaseForm(section);
  }

  return result;
}

/* ══════════════════════════════════════════════
   ÇEVİRİ ÖNERİSİ (MyMemory)
══════════════════════════════════════════════ */

export async function fetchTranslate(word) {
  const q = encodeURIComponent(String(word ?? "").trim());
  if (!q) throw new Error("Kelime boş olamaz.");

  const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=de|tr`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Çeviri servisine ulaşılamadı.");

  const data = await res.json();
  const rawMain = data?.responseData?.translatedText;

  if (!rawMain || /NO QUERY SPECIFIED|MYMEMORY WARNING/i.test(rawMain)) {
    throw new Error("Çeviri bulunamadı.");
  }

  const main = capitalize(rawMain.trim());
  const seen = new Set([main.toLowerCase()]);
  const alts = [];

  (data.matches || [])
    .slice()
    .sort((a, b) => (parseFloat(b.match) || 0) - (parseFloat(a.match) || 0))
    .forEach(m => {
      const t = String(m?.translation ?? "").trim();
      if (!t) return;
      const key = t.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      alts.push(capitalize(t));
    });

  return { main, alts };
}