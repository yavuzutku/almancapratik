/* ════════════════════════════════════════════════════════════
   cleanRawText.js  —  AlmancaPratik Metin Ön İşleyici
   Kirli, düzensiz metinleri yapısal temizlikten geçirir.
   ════════════════════════════════════════════════════════════ */

"use strict";

/* ──────────────────────────────────────────────────────────
   §1  SABITLER
   ────────────────────────────────────────────────────────── */

/** Sadece sembolleri tespit eder — harf veya rakam YOK */
const RE_ONLY_SYMBOLS = /^[^\p{L}\p{N}]+$/u;

/** Section separator olarak korunacak anlamlı ayırıcılar (≥5 aynı karakter) */
const RE_MEANINGFUL_SEP = /^([*\-_=~#.·])\1{4,}\s*$/u;

/** Liste öğesi: -, *, •, 1. 2) vb. */
const RE_LIST_ITEM = /^([-*•]|\d{1,3}[.)])\s+\S/u;

/** Markdown başlığı */
const RE_MD_TITLE = /^#{1,6}\s+\S/;

/** Code fence */
const RE_CODE_FENCE = /^`{3}/;

/** Almanca / genel diyalog başlangıcı */
const RE_DIALOG = /^[\u201E\u201C\u201A\u2018"']|^[\u2013\u2014]\s\S/u;

/** Sadece tekrarlı noktalama (aggressive modda silinir) */
const RE_PUNCT_REPEAT = /^([.!?,;:]{1,3})\1{2,}\s*$/;

/** Yatay çizgi benzeri ama kısa (2-4 karakter) — anlamsız */
const RE_SHORT_SEPARATOR = /^[-=*_~]{2,4}\s*$/;

/* ──────────────────────────────────────────────────────────
   §2  KORUMA LİSTESİ
   Bu desenlerden biri eşleşirse satır KESİNLİKLE korunur.
   ────────────────────────────────────────────────────────── */

const PROTECTED_PATTERNS = [
  RE_LIST_ITEM,       // liste öğesi
  RE_MD_TITLE,        // markdown başlık
  RE_CODE_FENCE,      // code fence
  RE_DIALOG,          // diyalog satırı
  RE_MEANINGFUL_SEP,  // anlamlı section separator (≥5 karakter)
];

/**
 * Satır koruma listesindeki herhangi bir desene uyuyor mu?
 * @param {string} line - trim edilmiş satır
 * @returns {boolean}
 */
function isProtected(line) {
  return PROTECTED_PATTERNS.some(re => re.test(line));
}

/* ──────────────────────────────────────────────────────────
   §3  FREKANS ANALİZİ
   Bir metindeki satır tekrar sayılarını hesaplar.
   ────────────────────────────────────────────────────────── */

/**
 * @param {string[]} lines
 * @param {number}   threshold  — bu kadar ve üzeri tekrar → gürültü
 * @returns {Set<string>}        — tekrar eden satırlar kümesi
 */
function buildFrequencyNoise(lines, threshold = 3) {
  const freq = new Map();
  for (const line of lines) {
    if (!line) continue;
    freq.set(line, (freq.get(line) ?? 0) + 1);
  }
  const noise = new Set();
  for (const [line, count] of freq) {
    if (count >= threshold) noise.add(line);
  }
  return noise;
}

/* ──────────────────────────────────────────────────────────
   §4  BAĞLAM (CONTEXT) ANALİZİ
   Üst ve alt komşu satırları inceler.
   ────────────────────────────────────────────────────────── */

/**
 * Satırın her iki yanındaki satırlar boş mu?
 * @param {string[]} lines
 * @param {number}   idx
 * @returns {boolean}
 */
function isIsolatedByBlanks(lines, idx) {
  const prev = (lines[idx - 1] ?? "").trim();
  const next = (lines[idx + 1] ?? "").trim();
  return prev === "" && next === "";
}

/**
 * Satırın komşuları içerik taşıyor mu?
 * @param {string[]} lines
 * @param {number}   idx
 * @returns {boolean}
 */
function hasContentNeighbors(lines, idx) {
  const prev = (lines[idx - 1] ?? "").trim();
  const next = (lines[idx + 1] ?? "").trim();
  return prev.length > 0 || next.length > 0;
}

/* ──────────────────────────────────────────────────────────
   §5  TEK SATIR ANALİZİ
   Bir satırın gürültü olup olmadığına karar verir.
   ────────────────────────────────────────────────────────── */

/**
 * @param {string}   line       - trim edilmiş satır
 * @param {number}   idx        - orijinal dizi indeksi
 * @param {string[]} allLines   - tüm trim'lenmiş satırlar
 * @param {Set}      freqNoise  - frekans analizi gürültü seti
 * @param {boolean}  aggressive - katı mod
 * @returns {boolean}  true → gürültü, sil
 */
function isNoiseLine(line, idx, allLines, freqNoise, aggressive) {
  // Boş satır → parse ediciye bırak, burada dokunma
  if (!line) return false;

  // Koruma listesi kontrolü — eşleşirse kesinlikle koru
  if (isProtected(line)) return false;

  // Harf VE rakam yoksa → sadece sembol
  if (RE_ONLY_SYMBOLS.test(line)) {
    // Anlamlı section separator zaten yukarıda korundu (≥5 char)
    // Buraya düşen kısa sembol satırları gürültü
    return true;
  }

  // Kısa ayırıcı (2-4 karakter: --, ==, ** vb.) → gürültü
  if (RE_SHORT_SEPARATOR.test(line)) return true;

  // Frekans gürültüsü: korunmuyor + çok tekrarlı
  if (freqNoise.has(line) && !isProtected(line)) return true;

  // Aggressive mod ek kurallar
  if (aggressive) {
    // Noktalama tekrarı: "...", "!!!" gibi
    if (RE_PUNCT_REPEAT.test(line)) return true;

    // Tek karakter (harf/rakam olsa bile anlamsız)
    if (line.length === 1) return true;

    // Her iki yanı boş + çok kısa (≤3 karakter) + harf var ama anlamsız
    if (isIsolatedByBlanks(allLines, idx) && line.length <= 3) return true;
  }

  return false;
}

/* ──────────────────────────────────────────────────────────
   §6  CODE BLOCK KORUMA
   Code fence içindeki satırlar hiç analiz edilmez.
   ────────────────────────────────────────────────────────── */

/**
 * Code fence içinde mi olduğunu takip eden basit state makinesi.
 * @param {string[]} trimmedLines
 * @returns {boolean[]}  Her satır için "code içinde mi?" dizisi
 */
function buildCodeMask(trimmedLines) {
  const mask = new Array(trimmedLines.length).fill(false);
  let inCode = false;
  for (let i = 0; i < trimmedLines.length; i++) {
    if (RE_CODE_FENCE.test(trimmedLines[i])) {
      inCode = !inCode;
      mask[i] = true; // fence satırı da koru
      continue;
    }
    mask[i] = inCode;
  }
  return mask;
}

/* ──────────────────────────────────────────────────────────
   §7  ANA FONKSİYON
   ────────────────────────────────────────────────────────── */

/**
 * Ham metni temizler ve yapısal gürültüden arındırır.
 *
 * @param {string} rawText
 * @param {{
 *   removeNoise?:        boolean,  // gürültü satırlarını sil (default: true)
 *   aggressiveCleaning?: boolean,  // daha katı filtre (default: false)
 *   freqThreshold?:      number,   // kaç tekrarda gürültü sayılır (default: 3)
 *   normalizeWhitespace?: boolean, // fazla boşlukları temizle (default: true)
 *   collapseBlankLines?:  boolean, // 3+ boş satırı 2'ye indir (default: true)
 * }} options
 * @returns {{
 *   text:        string,   // temizlenmiş metin
 *   removedCount: number,  // silinen satır sayısı
 *   stats: {
 *     originalLines: number,
 *     cleanedLines:  number,
 *     noiseLines:    number[],  // silinen satır indeksleri
 *   }
 * }}
 */
export function cleanRawText(rawText, options = {}) {
  const {
    removeNoise         = true,
    aggressiveCleaning  = false,
    freqThreshold       = 3,
    normalizeWhitespace = true,
    collapseBlankLines  = true,
  } = options;

  if (!rawText?.trim()) {
    return { text: "", removedCount: 0, stats: { originalLines: 0, cleanedLines: 0, noiseLines: [] } };
  }

  /* 1 — Satırlara ayır */
  const rawLines     = rawText.split(/\r?\n/);
  const trimmedLines = rawLines.map(l => l.trim());

  /* 2 — Code mask: fence içindeki satırlara dokunma */
  const codeMask = buildCodeMask(trimmedLines);

  /* 3 — Frekans analizi (sadece removeNoise açıksa anlamlı) */
  const freqNoise = removeNoise
    ? buildFrequencyNoise(trimmedLines, freqThreshold)
    : new Set();

  /* 4 — Satır filtreleme */
  const noiseIndices = [];
  const keptLines    = [];

  for (let i = 0; i < trimmedLines.length; i++) {
    const line = trimmedLines[i];

    // Code fence içindeyse veya fence satırıysa → koru
    if (codeMask[i]) {
      keptLines.push(rawLines[i]); // orijinal indent'i koru
      continue;
    }

    // Boş satır → her zaman koru (paragraf yapısını boz)
    if (!line) {
      keptLines.push("");
      continue;
    }

    // Beyaz boşluk normalleştirme
    const processed = normalizeWhitespace
      ? line.replace(/[ \t]+/g, " ")
      : line;

    if (removeNoise && isNoiseLine(processed, i, trimmedLines, freqNoise, aggressiveCleaning)) {
      noiseIndices.push(i);
      continue; // satırı at
    }

    keptLines.push(processed);
  }

  /* 5 — Çoklu boş satırları daralt */
  const finalLines = collapseBlankLines
    ? collapseConsecutiveBlanks(keptLines)
    : keptLines;

  /* 6 — Baştan ve sondan boş satırları sil */
  const trimmedResult = trimEdgeBlanks(finalLines);

  return {
    text: trimmedResult.join("\n"),
    removedCount: noiseIndices.length,
    stats: {
      originalLines: rawLines.length,
      cleanedLines:  trimmedResult.length,
      noiseLines:    noiseIndices,
    },
  };
}

/* ──────────────────────────────────────────────────────────
   §8  YARDIMCI POST-PROCESS FONKSİYONLARI
   ────────────────────────────────────────────────────────── */

/**
 * 3 veya daha fazla art arda boş satırı 2'ye indirir.
 * @param {string[]} lines
 * @returns {string[]}
 */
function collapseConsecutiveBlanks(lines) {
  const result = [];
  let blanks   = 0;
  for (const line of lines) {
    if (line === "") {
      blanks++;
      if (blanks <= 2) result.push("");
    } else {
      blanks = 0;
      result.push(line);
    }
  }
  return result;
}

/**
 * Baştaki ve sondaki boş satırları kaldırır.
 * @param {string[]} lines
 * @returns {string[]}
 */
function trimEdgeBlanks(lines) {
  let start = 0;
  let end   = lines.length - 1;
  while (start <= end && lines[start]  === "") start++;
  while (end >= start && lines[end]    === "") end--;
  return lines.slice(start, end + 1);
}

/* ──────────────────────────────────────────────────────────
   §9  HIZLI ERİŞİM — Sadece temiz metni döndür
   ────────────────────────────────────────────────────────── */

/**
 * cleanRawText'in basit sarmalayıcısı — sadece string döndürür.
 * @param {string} rawText
 * @param {object} [options]
 * @returns {string}
 */
export function clean(rawText, options = {}) {
  return cleanRawText(rawText, options).text;
}