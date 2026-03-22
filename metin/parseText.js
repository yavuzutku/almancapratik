/* ════════════════════════════════════════════════════════════
   parseText.js  —  AlmancaPratik  v4
   Production-grade Almanca metin ayrıştırıcı + HTML renderer

   Blok tipleri (AST):
     { type: "title",   children: InlineNode[] }
     { type: "para",    children: InlineNode[] }   ← geriye uyumlu tip adı
     { type: "dialog",  children: InlineNode[] }
     { type: "quote",   children: InlineNode[] }
     { type: "list",    ordered: bool, items: { children: InlineNode[] }[] }
     { type: "code",    lang: string, value: string }
     { type: "section" }

   InlineNode tipleri:
     { type: "text",   value: string }
     { type: "bold",   value: string }
     { type: "italic", value: string }
     { type: "dialog", value: string }   ← satır-içi Almanca tırnak
   ════════════════════════════════════════════════════════════ */

"use strict";

/* ──────────────────────────────────────────────────────────
   §1  SABITLER  —  Tüm regex'leri tek noktada derle
   ────────────────────────────────────────────────────────── */

const RE = Object.freeze({
  // Section separator: aynı karakterden ≥5 adet, tam satır
  // Desteklenen: * - _ = ~ # . · (nokta veya orta nokta)
  SECTION: /^([*\-_=~#.·])\1{4,}\s*$/u,

  // Markdown başlığı: # H1 … ###### H6
  MD_TITLE: /^#{1,6}\s+\S/,

  // Almanca/İngilizce kitap bölümü anahtar kelimeleri
  DE_CHAPTER: /^(Kapitel|Kap\.|Teil|Abschnitt|Buch|Band|Prolog|Epilog|Einleitung|Nachwort|Vorwort|Anhang|Chapter|Part|Section|Introduction|Conclusion)\s+[\dIVXivx]/iu,

  // Roma rakamı başlığı (maks 8 karakter)
  ROMAN: /^[IVXLCDM]+\.?\s*$/iu,

  // Sadece numara+nokta/parantez başlığı (ör: "1." veya "12)")
  NUM_HDR: /^\d{1,3}[.)]\s*$/,

  // Liste öğesi: -, *, •  VEYA  1. 2) vb.
  LIST_ITEM: /^([-*•]|\d{1,3}[.)])\s+(.+)$/u,

  // Tam satır diyalog: Almanca tırnak ile başlar ya da — / - ile başlar
  DIALOG_LINE: /^[\u201E\u201C\u201A\u2018"']|^[\u2013\u2014]\s[A-Za-z\u00C0-\u024F\d]/u,

  // > ile başlayan quote
  QUOTE_GT: /^>\s?/,
  // Tab veya 4 boşlukla başlayan quote
  QUOTE_INDENT: /^(\t| {4})/,

  // Code fence: ``` (isteğe bağlı dil adıyla)
  CODE_FENCE: /^`{3}(\w*)$/,

  // Cümle sonu (splitSentences modu için)
  SENTENCE_END: /(?<=[.!?…])\s+/u,

  // Büyük harf kelime (≥2 harf)
  UPPER_WORD: /[A-ZÄÖÜß]{2,}/u,

  // Başlık kırıcı noktalama işaretleri
  TITLE_PUNCT: /[.!?,;:\u201E\u201C\u2018\u201A\u2013\u2014\u2015]/u,

  // Tire/çizgi ile satır başlangıcı
  DASH_START: /^[-\u2013\u2014]/u,

  // HTML özel karakterleri
  HTML_CHARS: /[&<>"]/g,
});

/* HTML karakter → entity haritası */
const HTML_ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

/* ──────────────────────────────────────────────────────────
   §2  YARDIMCI FONKSİYONLAR
   ────────────────────────────────────────────────────────── */

/**
 * Metni HTML için güvenli hale getirir.
 * @param {string} s
 * @returns {string}
 */
function esc(s) {
  return String(s).replace(RE.HTML_CHARS, c => HTML_ENTITIES[c]);
}

/**
 * InlineNode dizisini HTML string'e çevirir.
 * @param {Array<{type:string,value:string}>} nodes
 * @returns {string}
 */
function inlineToHtml(nodes) {
  if (!nodes?.length) return "";
  return nodes.map(n => {
    switch (n.type) {
      case "bold":   return `<strong>${esc(n.value)}</strong>`;
      case "italic": return `<em>${esc(n.value)}</em>`;
      case "dialog": return `<span class="pv-inline-dialog">${esc(n.value)}</span>`;
      case "text":   return esc(n.value);
      default:       return esc(String(n.value ?? ""));
    }
  }).join("");
}

/* ──────────────────────────────────────────────────────────
   §3  INLINE TOKENIZER
   Ham metin → InlineNode[]
   Sıra: bold → italic → Almanca-dialog → text
   ────────────────────────────────────────────────────────── */

/**
 * Ham metin satırını inline token dizisine ayrıştırır.
 * @param {string} raw
 * @returns {Array<{type:string,value:string}>}
 */
function tokenizeInline(raw) {
  if (!raw) return [];

  const tokens = [];
  let pos = 0;
  const len = raw.length;

  /** Son token text ise üzerine ekle, değilse yeni ekle */
  const pushText = (s) => {
    if (!s) return;
    const last = tokens[tokens.length - 1];
    if (last?.type === "text") last.value += s;
    else tokens.push({ type: "text", value: s });
  };

  while (pos < len) {
    const ch  = raw[pos];
    const ch2 = raw[pos + 1];

    /* ── Bold: ** veya __ ─────────────────────────── */
    if ((ch === "*" && ch2 === "*") || (ch === "_" && ch2 === "_")) {
      const delim = ch + ch2;
      const end   = raw.indexOf(delim, pos + 2);
      if (end !== -1 && end > pos + 2) {
        tokens.push({ type: "bold", value: raw.slice(pos + 2, end) });
        pos = end + 2;
        continue;
      }
    }

    /* ── Italic: tek * veya _ (bold değil) ───────── */
    if ((ch === "*" && ch2 !== "*") || (ch === "_" && ch2 !== "_")) {
      const delim = ch;
      const end   = raw.indexOf(delim, pos + 1);
      if (end !== -1 && end > pos + 1 && raw[end + 1] !== delim) {
        tokens.push({ type: "italic", value: raw.slice(pos + 1, end) });
        pos = end + 1;
        continue;
      }
    }

    /* ── Satır-içi Almanca tırnak: „..." ─────────── */
    if (ch === "\u201E" || ch === "\u201C") {
      const closeChar = "\u201C"; // „...": her iki açılış için kapanış "
      const end = raw.indexOf(closeChar, pos + 1);
      if (end !== -1) {
        tokens.push({ type: "dialog", value: raw.slice(pos, end + 1) });
        pos = end + 1;
        continue;
      }
    }

    /* ── Plain text: bir sonraki özel karaktere kadar ── */
    let textEnd = pos + 1;
    while (textEnd < len) {
      const c = raw[textEnd];
      if (c === "*" || c === "_" || c === "\u201E" || c === "\u201C") break;
      textEnd++;
    }
    pushText(raw.slice(pos, textEnd));
    pos = textEnd;
  }

  return tokens.length ? tokens : [{ type: "text", value: raw }];
}

/* ──────────────────────────────────────────────────────────
   §4  SATIR TİPİ TANIMLAYICILAR
   ────────────────────────────────────────────────────────── */

/**
 * Section separator mı?
 * Minimum 5 aynı karakter, temiz satır.
 * @param {string} t - trim edilmiş satır
 * @returns {boolean}
 */
function isSectionBreak(t) {
  return RE.SECTION.test(t);
}

/**
 * Skor bazlı title algılama.
 * ≥5 puan → title kabul edilir.
 *
 * Skor tablosu:
 *   Uzunluk ≤30          : +2
 *   Uzunluk ≤55          : +1
 *   Büyük harfle başlar  : +1
 *   Tamamen büyük harf   : +2
 *   Noktalama yok        : +2
 *   Tire ile başlamaz    : +1
 *   Çift boş satırla izole: +3
 *   Tek boş satırla izole: +2
 *   İlk satır           : +1
 *
 * @param {string} t    - trim edilmiş satır
 * @param {number} idx  - satır indeksi
 * @param {string[]} lines - tüm satırlar
 * @returns {boolean}
 */
function isTitleLine(t, idx, lines) {
  if (!t || t.length > 100) return false;

  // Cümle sonu noktalama → kesinlikle başlık değil
  if (/[.!?,;]$/.test(t)) return false;

  // Markdown başlığı — kesin eşleşme, skor gerektirmez
  if (RE.MD_TITLE.test(t)) return true;

  // Almanca/İngilizce bölüm başlığı
  if (RE.DE_CHAPTER.test(t)) return true;

  // Roma rakamı (maks 8 karakter)
  if (RE.ROMAN.test(t) && t.replace(/\s/g, "").length <= 8) return true;

  // Sadece rakam + nokta/parantez
  if (RE.NUM_HDR.test(t)) return true;

  // --- Skor sistemi ---
  let score = 0;

  if (t.length <= 30) score += 2;
  else if (t.length <= 55) score += 1;

  if (/^[A-ZÄÖÜß\u00C0-\u024F]/.test(t)) score += 1;

  if (t === t.toUpperCase() && RE.UPPER_WORD.test(t)) score += 2;

  if (!RE.TITLE_PUNCT.test(t)) score += 2;

  if (!RE.DASH_START.test(t)) score += 1;

  // İzolasyon analizi
  const prev1 = (lines[idx - 1] ?? "").trim();
  const prev2 = (lines[idx - 2] ?? "").trim();
  const next1 = (lines[idx + 1] ?? "").trim();
  const next2 = (lines[idx + 2] ?? "").trim();

  if (prev1 === "" && prev2 === "" && next1 === "" && next2 === "") score += 3;
  else if (prev1 === "" && next1 === "") score += 2;
  else if (idx === 0) score += 1;

  return score >= 5;
}

/**
 * Tam satır diyalog mu?
 * @param {string} t - trim edilmiş satır
 * @returns {boolean}
 */
function isDialogLine(t) {
  return RE.DIALOG_LINE.test(t);
}

/**
 * Quote satırı mı?
 * @param {string} rawLine - trim edilmemiş ham satır
 * @returns {boolean}
 */
function isQuoteLine(rawLine) {
  return RE.QUOTE_GT.test(rawLine.trimStart()) || RE.QUOTE_INDENT.test(rawLine);
}

/**
 * Liste öğesi parse et.
 * @param {string} t - trim edilmiş satır
 * @returns {{ ordered: boolean, content: string } | null}
 */
function parseListItem(t) {
  const m = t.match(RE.LIST_ITEM);
  if (!m) return null;
  const ordered = /^\d/.test(m[1]);
  return { ordered, content: m[2] };
}

/**
 * Code fence mi?
 * @param {string} t - trim edilmiş satır
 * @returns {string | null}  dil adı (boş olabilir), eşleşme yoksa null
 */
function parseCodeFence(t) {
  const m = t.match(RE.CODE_FENCE);
  return m ? (m[1] ?? "") : null;
}

/* ──────────────────────────────────────────────────────────
   §5  ANA PARSER
   ────────────────────────────────────────────────────────── */

/**
 * Ham metni AST blok dizisine çevirir.
 *
 * @param {string} raw - ham metin
 * @param {{ splitSentences?: boolean }} [opts]
 *   splitSentences: true → her cümleyi ayrı para bloğu olarak ayır
 * @returns {Array}
 */
export function parseText(raw, opts = {}) {
  if (!raw?.trim()) return [];

  const { splitSentences = false } = opts;
  const lines  = raw.split(/\r?\n/);
  const blocks = [];

  // Paragraph buffer: birden fazla satır birleştirilir
  let paraBuf = [];

  // Liste buffer
  let listBuf     = [];
  let listOrdered = false;

  // Code fence durumu
  let inCode  = false;
  let codeLang = "";
  let codeBuf = [];

  /* ── Buffer flush fonksiyonları ── */

  const flushPara = () => {
    if (!paraBuf.length) return;
    const joined = paraBuf.join(" ");

    if (splitSentences) {
      joined.split(RE.SENTENCE_END).forEach(s => {
        const trimmed = s.trim();
        if (trimmed) blocks.push({ type: "para", children: tokenizeInline(trimmed) });
      });
    } else {
      blocks.push({ type: "para", children: tokenizeInline(joined) });
    }

    paraBuf = [];
  };

  const flushList = () => {
    if (!listBuf.length) return;
    blocks.push({ type: "list", ordered: listOrdered, items: [...listBuf] });
    listBuf = [];
  };

  const flushAll = () => { flushPara(); flushList(); };

  /* ── Ana döngü ── */

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const t       = rawLine.trim();

    /* ── Code block ─────────────────────────────── */
    if (!inCode) {
      const lang = parseCodeFence(t);
      if (lang !== null) {
        flushAll();
        inCode = true; codeLang = lang; codeBuf = [];
        continue;
      }
    } else {
      if (/^`{3}$/.test(t)) {
        blocks.push({ type: "code", lang: codeLang, value: codeBuf.join("\n") });
        inCode = false; codeLang = ""; codeBuf = [];
      } else {
        codeBuf.push(rawLine);
      }
      continue;
    }

    /* ── Boş satır → buffer'ları kapat ─────────── */
    if (!t) { flushAll(); continue; }

    /* ── Section separator ──────────────────────── */
    if (isSectionBreak(t)) {
      flushAll();
      blocks.push({ type: "section" });
      continue;
    }

    /* ── Quote ──────────────────────────────────── */
    if (isQuoteLine(rawLine)) {
      flushAll();
      const content = t.replace(RE.QUOTE_GT, "").replace(RE.QUOTE_INDENT, "");
      blocks.push({ type: "quote", children: tokenizeInline(content) });
      continue;
    }

    /* ── Title ──────────────────────────────────── */
    if (isTitleLine(t, i, lines)) {
      flushAll();
      const cleanTitle = t.replace(/^#{1,6}\s*/, "");
      blocks.push({ type: "title", children: tokenizeInline(cleanTitle) });
      continue;
    }

    /* ── Liste öğesi ────────────────────────────── */
    const listMatch = parseListItem(t);
    if (listMatch) {
      flushPara();
      // Ordered ↔ unordered değişiminde yeni liste başlat
      if (listBuf.length && listMatch.ordered !== listOrdered) flushList();
      listOrdered = listMatch.ordered;
      listBuf.push({ children: tokenizeInline(listMatch.content) });
      continue;
    } else {
      flushList();
    }

    /* ── Tam satır diyalog ──────────────────────── */
    if (isDialogLine(t)) {
      flushPara();
      blocks.push({ type: "dialog", children: tokenizeInline(t) });
      continue;
    }

    /* ── Paragraph (varsayılan) ─────────────────── */
    paraBuf.push(t);
  }

  /* Son buffer'ları kapat */
  flushAll();

  // Kapatılmamış code fence → yine de ekle
  if (inCode && codeBuf.length) {
    blocks.push({ type: "code", lang: codeLang, value: codeBuf.join("\n") });
  }

  return blocks;
}

/* ──────────────────────────────────────────────────────────
   §6  AST → HTML
   Hem editör önizlemesi (mode:"preview") hem okuma modu
   (mode:"reader") desteklenir.
   ────────────────────────────────────────────────────────── */

/** CSS sınıf haritaları */
const CLASS_MAP = Object.freeze({
  preview: {
    title:    "pv-title",
    para:     "pv-para",
    dialog:   "pv-dialog",
    quote:    "pv-quote",
    section:  "pv-section",
    code:     "pv-code",
    list:     "pv-list",
    listItem: "pv-list-item",
  },
  reader: {
    title:    "ok-title",
    para:     "ok-para",
    dialog:   "ok-dialog",
    quote:    "ok-quote",
    section:  "ok-section",
    code:     "ok-code",
    list:     "ok-list",
    listItem: "ok-list-item",
  },
});

/**
 * AST bloklarını HTML string'e çevirir.
 *
 * @param {Array}  blocks             - parseText() çıktısı
 * @param {{ mode?: "preview"|"reader" }} [opts]
 * @returns {string}
 */
export function blocksToHtml(blocks, opts = {}) {
  if (!blocks?.length) {
    return `<span style="color:var(--muted);font-style:italic">Metin boş.</span>`;
  }

  const cls = CLASS_MAP[opts.mode ?? "preview"] ?? CLASS_MAP.preview;

  return blocks.map(block => {
    const inner = block.children ? inlineToHtml(block.children) : "";

    switch (block.type) {

      case "title":
        return `<div class="${cls.title}">${inner}</div>`;

      case "para":
        return `<div class="${cls.para}">${inner}</div>`;

      case "dialog":
        return `<div class="${cls.dialog}">${inner}</div>`;

      case "quote":
        return `<blockquote class="${cls.quote}">${inner}</blockquote>`;

      case "section":
        return `<div class="${cls.section}">\u2726 &nbsp; \u2726 &nbsp; \u2726</div>`;

      case "code": {
        const langAttr = block.lang ? ` data-lang="${esc(block.lang)}"` : "";
        return `<pre class="${cls.code}"${langAttr}><code>${esc(block.value)}</code></pre>`;
      }

      case "list": {
        const tag   = block.ordered ? "ol" : "ul";
        const items = (block.items ?? [])
          .map(it => `<li class="${cls.listItem}">${inlineToHtml(it.children)}</li>`)
          .join("");
        return `<${tag} class="${cls.list}">${items}</${tag}>`;
      }

      default:
        return "";
    }
  }).join("");
}

/* ──────────────────────────────────────────────────────────
   §7  GERİYE UYUMLULUK YARDIMCILARI
   Eski kod b.lines veya b.text'e erişiyorsa çalışmaya devam eder.
   ────────────────────────────────────────────────────────── */

/**
 * Yeni AST bloğunu eski formata dönüştürür.
 * sessionStorage'da eski format bekleyen kod için.
 * @param {Array} blocks
 * @returns {Array}
 */
export function blocksToLegacy(blocks) {
  return blocks.map(b => {
    if (b.type === "para") {
      // children'dan düz metin çıkar
      const text = (b.children ?? []).map(n => n.value ?? "").join("");
      return { type: "para", lines: [text], children: b.children };
    }
    if (b.type === "title" || b.type === "dialog" || b.type === "quote") {
      const text = (b.children ?? []).map(n => n.value ?? "").join("");
      return { ...b, text, children: b.children };
    }
    return b;
  });
}