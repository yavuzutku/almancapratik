/* ═══════════════════════════════════════════════════════════
   pluraladd.js  —  AlmancaPratik Çoklu Kelime Ekleme
   ═══════════════════════════════════════════════════════════
   Desteklenen formatlar (genişletilmiş):
     Haus = ev           Haus → ev          Haus -> ev
     Haus - ev           Haus : ev          Haus | ev
     Haus, ev            Haus   ev          (çift boşluk)
     Haus (ev)           Haus [ev]          Haus <ev>
     «Haus» ev           "Haus" "ev"        'Haus' 'ev'
     Haus; ev            Haus :: ev         Haus / ev
     Haus bedeutet ev    Haus heißt ev      Haus means ev
     gehen => gitmek     gehen --> gitmek
     Q: Haus | A: ev     F: Haus / C: ev    (flashcard)
     1. Haus = ev        • Haus - ev        (liste işaretleri)
     der Hund = köpek    (artikel korunur)
     ev = Haus           (ters yazılmış → otomatik düzeltilir)
     HAUS = ev           (büyük harf → normalleştirilir)
     Haus=ev; Hund=köpek (aynı satırda çoklu çift)
     Sadece: Haus        (çeviri otomatik çekilir)

   İki blok modları:
     --- / === / *** / ~~~ / ___ bölücüler
     2+ boş satır ile ayrılmış bloklar
     Implicit: üst yarı Almanca, alt yarı Türkçe
   ═══════════════════════════════════════════════════════════ */

import { auth, getWords, saveWord } from "../js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { fetchTranslate, normalizeGermanWord } from "../js/german.js";

/* ─── STATE ─────────────────────────────────────────────── */
let currentUser   = null;
let existingWords = [];
let entries       = [];
let uidCounter    = 0;
let isTranslating = false;

/* ─── AUTH ──────────────────────────────────────────────── */
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    existingWords = await getWords(user.uid).catch(() => []);
    if (entries.length) reCheckDuplicates();
  }
});

/* ═══════════════════════════════════════════════════════════
   PARSER — Kapsamlı Format Desteği
   ═══════════════════════════════════════════════════════════ */

const ARTICLE_RE = /^(der|die|das|ein|eine)\s+/i;

/* Sıralı ayraç denemeleri — en kesin önce */
const SEPS = [
  /* Eşittir varyantları */
  { re: /\s*={1,3}\s*/,                                              name: '='   },
  /* Ok varyantları (unicode + ASCII) */
  { re: /\s*[→⟶➔➜⇒⟹➡🔀]\s*/,                                        name: '→'   },
  { re: /\s*-{1,2}>\s*/,                                             name: '→'   },
  { re: /\s*={1,2}>\s*/,                                             name: '→'   },
  /* Yaklaşık eşit */
  { re: /\s*[≈~≃≡]\s*/,                                              name: '≈'   },
  /* Pipe */
  { re: /\s*\|\s*/,                                                  name: '|'   },
  /* Tab */
  { re: /\t+/,                                                       name: 'tab' },
  /* Noktalı virgül */
  { re: /\s*;\s*/,                                                   name: ';'   },
  /* Çift iki nokta */
  { re: /\s*::\s*/,                                                  name: '::'  },
  /* Boşluklu tire/çizgi */
  { re: /\s+[-–—]+\s+/,                                              name: '–'   },
  /* Doğal dil anahtar kelimeleri */
  { re: /\s+(?:bedeutet|heißt|means|yani|demek(?:\s+ki)?|d\.h\.|i\.e\.)\s+/i, name: 'kw' },
  /* Tek iki nokta (en sona) */
  { re: /\s*:\s*/,                                                   name: ':'   },
];

/* ─── YARDIMCILAR ────────────────────────────────────────── */

/** Satır başındaki liste işaretlerini kaldır */
function stripMarker(line) {
  return line.replace(/^(\d+[.)]\s*|[•\-\*◦▸▹›»·#☐☑✓✗✕]\s*)/, '').trim();
}

/** Çevreleyen tırnak işaretlerini kaldır */
function stripQuotes(s) {
  return s.replace(/^["'«»„"‟""''`´❝❞❛❜]+|["'«»„"‟""''`´❝❞❛❜]+$/g, '').trim();
}

/** Sondaki noktalama temizle */
function stripTrailingPunct(s) {
  return s.replace(/[.,;:!?。、…]+$/, '').trim();
}

/** ALLCAPS → Title Case normalleştir: "HAUS" → "Haus" */
function normalizeCaps(s) {
  if (!s || s.length < 2) return s;
  const hasLower = /[a-zäöüß]/.test(s);
  if (!hasLower && /[A-ZÜÖÄ]{2,}/.test(s)) {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }
  return s;
}

/** Kelime/ifadeyi kapsamlı temizle */
function cleanPart(s) {
  if (!s) return '';
  s = s.trim();
  s = stripQuotes(s);
  s = stripTrailingPunct(s);
  s = normalizeCaps(s);
  return s.trim();
}

/** Türkçe'ye has karakter/pattern var mı? */
function looksLikeTurkish(s) {
  if (!s) return false;
  if (/[şğıçŞĞİÇ]/.test(s)) return true;
  /* Küçük harfle başlıyorsa (Almanca isimler büyük başlar) */
  if (/^[a-zäöü]/.test(s)) return true;
  /* Kısa ve sadece latin */
  if (s.length < 25 && !/[A-ZÜÖÄ]/.test(s) && /[a-z]/.test(s)) return true;
  return false;
}

/** Almancaya özgü işaret var mı? */
function looksLikeGerman(s) {
  if (!s) return false;
  if (/[ÄÖÜäöüß]/.test(s)) return true;
  if (ARTICLE_RE.test(s)) return true;
  if (/^[A-ZÜÖÄ]/.test(s)) return true;
  return false;
}

/**
 * Ters yazılmış mı? (Türkçe sol, Almanca sağ)
 * Otomatik taraf değiştir.
 */
function maybeSwap(de, tr) {
  if (de && tr && looksLikeTurkish(de) && looksLikeGerman(tr)) {
    return { de: tr, tr: de };
  }
  return { de, tr };
}

/* ─── ÖZEL FORMAT PARSERLARI ─────────────────────────────── */

/** Köşeli / açılı parantez / guillemet formatları */
function tryBracketFormats(line) {
  /* Sonda parantez: Haus (ev) → kelime <anlam> */
  const endParen = line.match(/^(.+?)\s*[(\[<«]\s*(.+?)\s*[)\]>»]\s*$/);
  if (endParen) {
    const left  = endParen[1].trim();
    const right = endParen[2].trim();
    if (left && right) {
      /* Sağ taraf çeviri gibi görünüyor mu? */
      if (looksLikeTurkish(right) || (!looksLikeGerman(right) && right.length < 30)) {
        return { de: left, tr: right, method: '<>' };
      }
      /* Sağ taraf plural/artikel bilgisi olabilir → atla */
    }
  }

  /* Başta parantez: [Haus] ev veya <Haus> ev */
  const startParen = line.match(/^[(\[<«]\s*(.+?)\s*[)\]>»]\s+(.+)$/);
  if (startParen) {
    const de = startParen[1].trim();
    const tr = startParen[2].trim();
    if (de && tr) return { de, tr, method: '<>' };
  }

  return null;
}

/** Tırnaklı format: "Haus" "ev" veya 'Haus' 'ev' */
function tryQuotedFormat(line) {
  /* Her iki taraf tırnakla: "Haus" = "ev" veya "Haus" "ev" */
  const bothQ = line.match(/^(["'„"❝`])(.+?)\1\s*[=:→\-|]?\s*(["'„"❝`])(.+?)\3\s*$/);
  if (bothQ) {
    const de = bothQ[2].trim();
    const tr = bothQ[4].trim();
    if (de && tr) return { de, tr, method: '""' };
  }
  /* Sadece sağ taraf tırnakla: Haus = "ev" */
  const rightQ = line.match(/^(.+?)\s*[=:→\-|]\s*(["'„"❝`])(.+?)\2\s*$/);
  if (rightQ) {
    const de = rightQ[1].trim();
    const tr = rightQ[3].trim();
    if (de && tr) return { de, tr, method: '""' };
  }
  /* Sadece sol taraf tırnakla: "Haus" = ev */
  const leftQ = line.match(/^(["'„"❝`])(.+?)\1\s*[=:→\-|]\s*(.+)$/);
  if (leftQ) {
    const de = leftQ[2].trim();
    const tr = leftQ[3].trim();
    if (de && tr) return { de, tr, method: '""' };
  }
  return null;
}

/** Flashcard / soru-cevap formatı */
function tryFlashcardFormat(line) {
  /* Q: Haus | A: ev  /  F: Haus / C: ev  /  Soru: Haus - Cevap: ev */
  const fc = line.match(
    /^(?:q|f|frage|soru|question|s)\s*[:.)]\s*(.+?)\s*[|/\-]\s*(?:a|c|answer|antwort|cevap)\s*[:.)]\s*(.+)$/i
  );
  if (fc) {
    const de = fc[1].trim();
    const tr = fc[2].trim();
    if (de && tr) return { de, tr, method: 'Q/A' };
  }
  return null;
}

/** Eğik çizgi ayracı — artikel varyantlarına dikkat */
function trySlashSep(line) {
  /* "der/die/das" gibi artikel varyantları içeriyorsa ayraç olarak kullanma */
  if (/\b(?:der|die|das)\s*\/\s*(?:der|die|das)\b/i.test(line)) return null;
  /* Sadece tek eğik çizgi olmalı */
  const slashes = (line.match(/\//g) || []).length;
  if (slashes !== 1) return null;
  const m = line.match(/^([^/]+)\s*\/\s*([^/]+)$/);
  if (!m) return null;
  const de = m[1].trim();
  const tr = m[2].trim();
  if (!de || !tr) return null;
  /* Her iki taraf çok uzunsa (cümle olabilir) atla */
  if (de.split(/\s+/).length > 5 || tr.split(/\s+/).length > 5) return null;
  return { de, tr, method: '/' };
}

/** Çift boşluk ayracı: "Haus    ev" */
function tryMultiSpaceSep(line) {
  const m = line.match(/^(.+?)\s{2,}(.+)$/);
  if (!m) return null;
  const de = m[1].trim();
  const tr = m[2].trim();
  if (!de || !tr) return null;
  /* Hiçbir taraf zaten çok boşluk içermemeli */
  if (de.match(/\s{2,}/) || tr.match(/\s{2,}/)) return null;
  return { de, tr, method: '··' };
}

/* ─── ÇOKLU ÇİFT (aynı satırda birden fazla) ─────────────── */

/**
 * "Haus=ev; Hund=köpek" → iki entry
 * "Haus=ev, Hund=köpek" → iki entry (her biri kendi ayracına sahipse)
 */
function tryMultiPairLine(line) {
  /* Noktalı virgülle ayrılmış çiftler */
  if (/;/.test(line)) {
    const parts = line.split(';').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const parsed = parts.map(p => parseSingleLine(p)).filter(Boolean);
      if (parsed.length === parts.length && parsed.every(p => p.tr)) {
        return parsed;
      }
    }
  }
  /* Virgülle ayrılmış çiftler (her biri açık bir ayraç içeriyorsa) */
  if (/,/.test(line)) {
    const parts = line.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.every(p => /[=→\-:|]/.test(p))) {
      const parsed = parts.map(p => parseSingleLine(p)).filter(Boolean);
      if (parsed.length === parts.length && parsed.every(p => p.tr)) {
        return parsed;
      }
    }
  }
  return null;
}

/* ─── ANA SATIR PARSER ───────────────────────────────────── */

/** Tek satırı parse et (liste işareti vb. zaten soyulmuş) */
function parseSingleLine(line) {
  if (!line.trim()) return null;

  /* Flashcard */
  const fc = tryFlashcardFormat(line);
  if (fc) return fc;

  /* Tırnaklı */
  const quoted = tryQuotedFormat(line);
  if (quoted) {
    const r = maybeSwap(cleanPart(quoted.de), cleanPart(quoted.tr));
    return { de: r.de, tr: r.tr, method: '""' };
  }

  /* Açık ayraçlar (SEPS) */
  for (const sep of SEPS) {
    const m = line.match(sep.re);
    if (!m || m.index === 0) continue;
    const idx = m.index;
    let de = line.slice(0, idx).trim();
    let tr = line.slice(idx + m[0].length).trim();

    /* Saat formatı kontrolü (10:30) */
    if (sep.name === ':' && /^\d{1,2}:\d{2}/.test(line)) continue;
    /* URL kontrolü */
    if (sep.name === ':' && tr.includes('://')) continue;

    de = cleanPart(de);
    tr = cleanPart(tr);
    if (!de) continue;

    const r = maybeSwap(de, tr);
    return { de: r.de, tr: r.tr, method: sep.name };
  }

  /* Köşeli / açılı parantez */
  const bracket = tryBracketFormats(line);
  if (bracket) {
    const r = maybeSwap(cleanPart(bracket.de), cleanPart(bracket.tr));
    return { de: r.de, tr: r.tr, method: bracket.method };
  }

  /* Eğik çizgi */
  const slash = trySlashSep(line);
  if (slash) {
    const r = maybeSwap(cleanPart(slash.de), cleanPart(slash.tr));
    return { de: r.de, tr: r.tr, method: '/' };
  }

  /* Virgül (heuristik) */
  const ci = line.indexOf(',');
  if (ci > 0) {
    const de = cleanPart(line.slice(0, ci));
    const tr = cleanPart(line.slice(ci + 1));
    if (de && tr && looksLikeTurkish(tr)) {
      const r = maybeSwap(de, tr);
      return { de: r.de, tr: r.tr, method: ',' };
    }
  }

  /* Çift boşluk */
  const multi = tryMultiSpaceSep(line);
  if (multi) {
    const r = maybeSwap(cleanPart(multi.de), cleanPart(multi.tr));
    return { de: r.de, tr: r.tr, method: '··' };
  }

  /* Ayraç yok → tek Almanca kelime */
  const cleaned = cleanPart(line);
  if (cleaned) return { de: cleaned, tr: '', method: '?' };
  return null;
}

/** Dışarıdan çağrılan satır parser (liste işaretini soy, sonra parse et) */
function parseLine(raw) {
  const stripped = stripMarker(raw.trim());
  return parseSingleLine(stripped);
}

/* ═══════════════════════════════════════════════════════════
   ANA GİRDİ PARSE FONKSİYONU
   ═══════════════════════════════════════════════════════════ */
export function parseInput(raw) {
  if (!raw.trim()) return [];

  /* ── İki-blok modu ── */
  const twoBlock = tryTwoBlockMode(raw);
  if (twoBlock) return twoBlock;

  /* ── Normal satır-satır mod ── */
  const lines   = raw.split(/\r?\n/);
  const results = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    /* Aynı satırda çoklu çift? */
    const multi = tryMultiPairLine(line);
    if (multi) {
      multi.forEach(p => results.push(makeEntry(p.de, p.tr, p.method)));
      continue;
    }

    const p = parseLine(line);
    if (!p) continue;
    results.push(makeEntry(p.de, p.tr, p.method));
  }

  return results;
}

/* ─── İKİ-BLOK MODU ─────────────────────────────────────── */
function tryTwoBlockMode(raw) {
  /* Açık bölücüler: ---, ===, ***, ~~~, ___ */
  const dividerRe = /^[-=_*~#]{3,}\s*$/m;
  if (dividerRe.test(raw)) {
    const parts  = raw.split(dividerRe);
    const blockA = parts[0];
    const blockB = parts.slice(1).join('\n');
    const deLines = blockA.trim().split(/\r?\n/).map(l => cleanPart(stripMarker(l))).filter(Boolean);
    const trLines = blockB.trim().split(/\r?\n/).map(l => cleanPart(stripMarker(l))).filter(Boolean);
    if (deLines.length > 0 && deLines.length === trLines.length) {
      return deLines.map((de, i) => makeEntry(de, trLines[i], 'blok'));
    }
  }

  /* 2+ boş satır ile ayrılmış bloklar */
  const doubleBlankRe = /\n{3,}/;
  if (doubleBlankRe.test(raw)) {
    const blocks = raw.split(doubleBlankRe).map(b => b.trim()).filter(Boolean);
    if (blocks.length === 2) {
      const deLines = blocks[0].split(/\r?\n/).map(l => cleanPart(stripMarker(l))).filter(Boolean);
      const trLines = blocks[1].split(/\r?\n/).map(l => cleanPart(stripMarker(l))).filter(Boolean);
      if (deLines.length > 0 && deLines.length === trLines.length) {
        return deLines.map((de, i) => makeEntry(de, trLines[i], 'blok'));
      }
    }
  }

  /* Implicit iki-blok: üst yarı büyük harfli Almanca, alt yarı küçük Türkçe */
  const allLines = raw.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (allLines.length >= 4 && allLines.length % 2 === 0) {
    const half    = allLines.length / 2;
    const topHalf = allLines.slice(0, half);
    const botHalf = allLines.slice(half);
    const topGerman  = topHalf.every(l => !parseLine(l)?.tr && /^[A-ZÜÖÄ]/.test(stripMarker(l)));
    const botTurkish = botHalf.every(l => looksLikeTurkish(stripMarker(l)));
    if (topGerman && botTurkish) {
      return topHalf.map((de, i) => makeEntry(
        cleanPart(stripMarker(de)),
        cleanPart(stripMarker(botHalf[i])),
        'blok'
      ));
    }
  }

  return null;
}

/* ─── ENTRY FABRİKASI ───────────────────────────────────── */
function makeEntry(de, tr, method) {
  return {
    id:          uidCounter++,
    de:          de.trim(),
    tr:          tr.trim(),
    method,
    selected:    true,
    status:      'new',
    translating: false,
  };
}

/* ─── DUPLICATE CHECK ───────────────────────────────────── */
function reCheckDuplicates() {
  entries = entries.map(e => ({
    ...e,
    status: e.status === 'saved' ? 'saved' : isDuplicate(e.de) ? 'duplicate' : 'new',
  }));
  renderTable();
  updateBar();
}

function isDuplicate(de) {
  if (!de) return false;
  return existingWords.some(w =>
    (w.word || '').toLowerCase().trim() === de.toLowerCase().trim()
  );
}

/* ═══════════════════════════════════════════════════════════
   OTO-ÇEVİRİ
   ═══════════════════════════════════════════════════════════ */
async function autoTranslateMissing() {
  if (isTranslating) return;
  const missing = entries.filter(e => e.selected && !e.tr && e.status !== 'saved');
  if (!missing.length) { showToast("Eksik çeviri yok!", "ok"); return; }

  isTranslating = true;
  const btn = document.getElementById("btnAutoTranslate");
  if (btn) { btn.disabled = true; btn.textContent = "Çevriliyor…"; }

  const progWrap = document.getElementById("translateProgress");
  const progBar  = document.getElementById("translateBar");
  const progText = document.getElementById("translateText");
  if (progWrap) progWrap.style.display = "flex";

  let done = 0;
  for (const entry of missing) {
    const live = entries.find(e => e.id === entry.id);
    if (!live || !live.selected) { done++; continue; }

    live.translating = true;
    updateRowTranslating(live.id, true);

    try {
      const { main } = await fetchTranslate(live.de);
      live.tr          = main || '';
      live.translating = false;
      updateRowTranslating(live.id, false, main);
    } catch {
      live.translating = false;
      updateRowTranslating(live.id, false);
    }

    done++;
    const pct = Math.round((done / missing.length) * 100);
    if (progBar)  progBar.style.width = pct + '%';
    if (progText) progText.textContent = `${done} / ${missing.length}`;
    await sleep(220);
  }

  isTranslating = false;
  if (btn) { btn.disabled = false; btn.textContent = "Eksikleri Otomatik Çevir"; }
  if (progWrap) setTimeout(() => { progWrap.style.display = "none"; }, 1200);
  updateBar();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function updateRowTranslating(id, loading, value) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (!row) return;
  const inp = row.querySelector('.tr-input');
  if (!inp) return;
  if (loading) {
    inp.placeholder = "çevriliyor…";
    inp.disabled    = true;
    row.classList.add('row--translating');
  } else {
    inp.disabled    = false;
    inp.placeholder = "Türkçe anlam…";
    row.classList.remove('row--translating');
    if (value !== undefined) inp.value = value;
  }
}

/* ═══════════════════════════════════════════════════════════
   KAYDET
   ═══════════════════════════════════════════════════════════ */
async function saveSelected() {
  if (!currentUser) { showToast("Lütfen giriş yapın!", "err"); return; }

  const toSave = entries.filter(e => e.selected && e.de && e.tr && e.status !== 'saved');
  if (!toSave.length) { showToast("Kaydedilecek kelime yok!", "err"); return; }

  const btn = document.getElementById("btnSave");
  if (btn) { btn.disabled = true; btn.textContent = "Kaydediliyor…"; }

  let saved = 0, skipped = 0, errors = 0;

  for (const entry of toSave) {
    const normalizedDe = normalizeGermanWord(entry.de, null);
    try {
      const dup = existingWords.find(w =>
        (w.word    || '').toLowerCase().trim() === normalizedDe.toLowerCase().trim() &&
        (w.meaning || '').toLowerCase().trim() === entry.tr.toLowerCase().trim()
      );
      if (dup) { entry.status = 'duplicate'; skipped++; continue; }

      await saveWord(currentUser.uid, normalizedDe, entry.tr, []);
      entry.status = 'saved';
      existingWords.push({ word: normalizedDe, meaning: entry.tr });
      updateRowStatus(entry.id, 'saved');
      saved++;
    } catch {
      entry.status = 'error';
      updateRowStatus(entry.id, 'error');
      errors++;
    }
    await sleep(60);
  }

  if (btn) { btn.disabled = false; btn.textContent = `Seçilileri Kaydet (${getSelectCount()})`; }
  showSummary(saved, skipped, errors);
  updateBar();
}

function updateRowStatus(id, status) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (!row) return;
  row.dataset.status = status;
  const badge = row.querySelector('.status-badge');
  if (badge) {
    badge.className   = `status-badge status-badge--${status}`;
    badge.textContent = STATUS_LABELS[status] || status;
  }
}

const STATUS_LABELS = {
  new:       'Yeni',
  duplicate: 'Mevcut',
  saved:     'Kaydedildi',
  error:     'Hata',
};

const METHOD_LABELS = {
  '=':   '=',
  '→':   '→',
  '≈':   '≈',
  '–':   '–',
  ':':   ':',
  '::':  '::',
  ';':   ';',
  '|':   '|',
  ',':   ',',
  '/':   '/',
  '··':  '··',
  '()':  '()',
  '<>':  '<>',
  '""':  '""',
  'tab': '⇥',
  'kw':  'kw',
  'Q/A': 'Q/A',
  '?':   '?',
  'blok':'☰',
};

/* ═══════════════════════════════════════════════════════════
   RENDER
   ═══════════════════════════════════════════════════════════ */
function renderTable() {
  const tbody = document.getElementById("entryTbody");
  if (!tbody) return;
  tbody.innerHTML = '';

  entries.forEach(e => {
    const tr = document.createElement('tr');
    tr.dataset.id     = e.id;
    tr.dataset.status = e.status;
    tr.className      = e.selected ? '' : 'row--deselected';

    tr.innerHTML = `
      <td class="td-check">
        <label class="cb-wrap">
          <input type="checkbox" class="row-check" ${e.selected ? 'checked' : ''}>
          <span class="cb-box"></span>
        </label>
      </td>
      <td class="td-de">
        <input class="cell-input de-input" value="${escHtml(e.de)}" placeholder="Almanca kelime…" spellcheck="false">
      </td>
      <td class="td-arrow">
        <span class="method-badge">${METHOD_LABELS[e.method] || e.method}</span>
      </td>
      <td class="td-tr">
        <input class="cell-input tr-input" value="${escHtml(e.tr)}" placeholder="Türkçe anlam…" spellcheck="false">
      </td>
      <td class="td-status">
        <span class="status-badge status-badge--${e.status}">${STATUS_LABELS[e.status]}</span>
      </td>
      <td class="td-del">
        <button class="del-btn" title="Sil">✕</button>
      </td>
    `;

    tr.querySelector('.row-check').addEventListener('change', ev => {
      const entry = entries.find(x => x.id === e.id);
      if (entry) entry.selected = ev.target.checked;
      tr.classList.toggle('row--deselected', !ev.target.checked);
      updateBar();
    });

    tr.querySelector('.de-input').addEventListener('input', ev => {
      const entry = entries.find(x => x.id === e.id);
      if (entry) {
        entry.de     = ev.target.value;
        entry.status = isDuplicate(entry.de) ? 'duplicate' : 'new';
        updateRowStatus(e.id, entry.status);
      }
      updateBar();
    });

    tr.querySelector('.tr-input').addEventListener('input', ev => {
      const entry = entries.find(x => x.id === e.id);
      if (entry) entry.tr = ev.target.value;
      updateBar();
    });

    tr.querySelector('.del-btn').addEventListener('click', () => {
      entries = entries.filter(x => x.id !== e.id);
      tr.remove();
      updateBar();
    });

    tbody.appendChild(tr);
  });

  updateBar();
}

/* ─── Bar güncelle ──────────────────────────────────────── */
function updateBar() {
  const total    = entries.length;
  const selCount = entries.filter(e => e.selected).length;
  const missingTr = entries.filter(e => e.selected && !e.tr).length;
  const dupCount  = entries.filter(e => e.status === 'duplicate').length;
  const savedCnt  = entries.filter(e => e.status === 'saved').length;

  setText('barTotal',   total);
  setText('barSel',     selCount);
  setText('barMissing', missingTr);
  setText('barDup',     dupCount);
  setText('barSaved',   savedCnt);

  const saveBtn = document.getElementById("btnSave");
  if (saveBtn) saveBtn.textContent = `Seçilileri Kaydet (${getSelectCount()})`;

  const transBtn = document.getElementById("btnAutoTranslate");
  if (transBtn) transBtn.textContent =
    `Eksikleri Otomatik Çevir${missingTr ? ` (${missingTr})` : ''}`;
}

function getSelectCount() {
  return entries.filter(e => e.selected && e.de && e.tr && e.status !== 'saved').length;
}

/* ─── Özet banner ───────────────────────────────────────── */
function showSummary(saved, skipped, errors) {
  const el = document.getElementById("saveSummary");
  if (!el) return;
  let html = `<span class="sum-item sum-ok">✓ ${saved} kelime kaydedildi</span>`;
  if (skipped) html += `<span class="sum-item sum-warn">⚠ ${skipped} zaten mevcuttu</span>`;
  if (errors)  html += `<span class="sum-item sum-err">✕ ${errors} hata</span>`;
  el.innerHTML = html;
  el.style.display = 'flex';
  setTimeout(() => el.classList.add('sum--visible'), 10);
}

/* ═══════════════════════════════════════════════════════════
   FAZA GEÇİŞ
   ═══════════════════════════════════════════════════════════ */
function showPhase(n) {
  document.querySelectorAll('.phase').forEach((el, i) => {
    el.classList.toggle('phase--active', i + 1 === n);
  });
}

/* ═══════════════════════════════════════════════════════════
   ANA KONTROL
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  const textarea  = document.getElementById('inputArea');
  const parseBtn  = document.getElementById('btnParse');
  const charCount = document.getElementById('inputCharCount');
  const lineCount = document.getElementById('inputLineCount');

  document.getElementById('previewClose')?.addEventListener('click', closePreviewModal);
  document.getElementById('previewCancel')?.addEventListener('click', closePreviewModal);
  document.getElementById('previewBackdrop')?.addEventListener('click', closePreviewModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePreviewModal(); });

  textarea?.addEventListener('input', () => {
    const val   = textarea.value;
    const lines = val.split('\n').filter(l => l.trim()).length;
    if (charCount) charCount.textContent = val.length;
    if (lineCount) lineCount.textContent = lines + ' satır';
  });

  parseBtn?.addEventListener('click', () => {
    const raw = textarea?.value || '';
    if (!raw.trim()) { showToast("Liste boş!", "err"); return; }

    const parsed = parseInput(raw);
    if (!parsed.length) { showToast("Kelime bulunamadı!", "err"); return; }
    openPreviewModal(parsed);

    document.getElementById("btnSelectAll")?.addEventListener('click', () => {
      entries.forEach(e => e.selected = true);
      document.querySelectorAll('.row-check').forEach(cb => cb.checked = true);
      document.querySelectorAll('tr[data-id]').forEach(r => r.classList.remove('row--deselected'));
      updateBar();
    });

    document.getElementById("btnSelectNone")?.addEventListener('click', () => {
      entries.forEach(e => e.selected = false);
      document.querySelectorAll('.row-check').forEach(cb => cb.checked = false);
      document.querySelectorAll('tr[data-id]').forEach(r => r.classList.add('row--deselected'));
      updateBar();
    });

    document.getElementById("btnSelectNew")?.addEventListener('click', () => {
      entries.forEach(e => { e.selected = e.status !== 'duplicate'; });
      document.querySelectorAll('tr[data-id]').forEach(row => {
        const id = parseInt(row.dataset.id);
        const e  = entries.find(x => x.id === id);
        const cb = row.querySelector('.row-check');
        if (cb)  cb.checked = e?.selected || false;
        row.classList.toggle('row--deselected', !e?.selected);
      });
      updateBar();
    });
  });

  document.getElementById("btnAutoTranslate")?.addEventListener('click', autoTranslateMissing);
  document.getElementById("btnSave")?.addEventListener('click', saveSelected);

  document.getElementById("btnBackToInput")?.addEventListener('click', () => {
    entries    = [];
    uidCounter = 0;
    showPhase(1);
    const sum = document.getElementById("saveSummary");
    if (sum) { sum.style.display = 'none'; sum.classList.remove('sum--visible'); }
  });

  document.getElementById("goSingleAdd")?.addEventListener('click', () => {
    window.location.href = '../singleadd/';
  });
});

/* ═══════════════════════════════════════════════════════════
   YARDIMCI FONKSİYONLAR
   ═══════════════════════════════════════════════════════════ */
function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function showToast(msg, type = '') {
  let toast = document.getElementById('_toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id        = '_toast';
    toast.className = 'wa-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className   = `wa-toast wa-toast--show${type ? ' wa-toast--' + type : ''}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('wa-toast--show'), 2800);
}
function closePreviewModal() {
  document.getElementById('previewModal')?.classList.remove('open');
}
function openPreviewModal(parsed) {
  const modal = document.getElementById('previewModal');
  const body  = document.getElementById('previewBody');
  if (!modal || !body) return;

  body.innerHTML = '';

  parsed.forEach(e => {
    const isDup = isDuplicate(e.de);
    const noTr  = !e.tr;

    const row = document.createElement('div');
    row.className = 'pv-row';

    let statusClass, statusLabel;
    if (isDup)     { statusClass = 'pv-status--dup';  statusLabel = 'Mevcut'; }
    else if (noTr) { statusClass = 'pv-status--miss'; statusLabel = 'Çevirisiz'; }
    else           { statusClass = 'pv-status--new';  statusLabel = 'Yeni'; }

    row.innerHTML = `
      <span class="pv-de">${escHtml(e.de)}</span>
      <span class="pv-sep">→</span>
      <span class="pv-tr${noTr ? ' pv-tr--empty' : ''}">${noTr ? 'çeviri yok' : escHtml(e.tr)}</span>
      <span class="pv-status ${statusClass}">${statusLabel}</span>
    `;
    body.appendChild(row);
  });

  const total = parsed.length;
  const dups  = parsed.filter(e => isDuplicate(e.de)).length;
  const miss  = parsed.filter(e => !e.tr).length;
  const yeni  = total - dups;

  const sum = document.createElement('div');
  sum.className = 'pv-summary';
  sum.innerHTML = `
    <span class="pv-sum-chip" style="background:rgba(79,214,156,.1);color:#4fd69c;border:1px solid rgba(79,214,156,.2)">${yeni} yeni</span>
    ${dups ? `<span class="pv-sum-chip" style="background:rgba(96,200,240,.1);color:#60c8f0;border:1px solid rgba(96,200,240,.2)">${dups} mevcut</span>` : ''}
    ${miss ? `<span class="pv-sum-chip" style="background:rgba(255,210,80,.1);color:#ffd250;border:1px solid rgba(255,210,80,.2)">${miss} çevirisiz</span>` : ''}
  `;
  body.appendChild(sum);

  modal.classList.add('open');

  document.getElementById('previewConfirm').onclick = () => {
    closePreviewModal();
    entries = parsed;
    reCheckDuplicates();
    renderTable();
    showPhase(2);
  };
}