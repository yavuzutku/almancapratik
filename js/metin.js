/* ═══════════════════════════════════════════
   metin.js — AlmancaPratik Editör Modülü
   ═══════════════════════════════════════════

   YENİ ÖZELLİKLER:
   1. Yapı Analizi    — parseText() ile canlı başlık/diyalog/paragraf sayımı
   2. Canlı İstatistik— kelime, karakter, cümle, okuma süresi
   3. Metin Araçları  — Temizle, Tireleri Düzelt, Tırnakları Düzelt
   4. Otomatik Kayıt  — 2 sn debounce ile sessionStorage'a yaz
   5. Önizleme Modu   — Kitap görünümünü modal'da göster
*/

import { saveMetin } from "./firebase.js";

/* ─── Yardımcı: Toast bildirimi ─────────────────── */
function toast(msg, type = "") {
  let el = document.getElementById("_toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "_toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `toast show ${type ? "toast-" + type : ""}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
}

/* ─── Metin Parser ──────────────────────────────── */
function parseText(raw) {
  const lines = raw.split("\n");
  const blocks = [];
  let buf = [];

  const flush = () => {
    if (buf.length) { blocks.push({ type: "para", lines: [...buf] }); buf = []; }
  };

  const isSectionBreak = l => /^\s*(\*\s*\*\s*\*|---+|###)\s*$/.test(l.trim());
  const isDialogue = l => /^[„"–—]\s/.test(l.trim()) || /^„/.test(l.trim()) || /^[-–—]\s/.test(l.trim());
  const isQuote = l => /^>\s/.test(l.trim());
  const isTitle = (l, i, arr) => {
    const t = l.trim();
    if (!t) return false;
    if (/^#{1,3}\s/.test(t)) return true;
    if (i === 0 && t.length < 70 && !/[.!?,;]$/.test(t)) return true;
    const prev = arr[i - 1]?.trim() || "_";
    const next = arr[i + 1]?.trim() || "_";
    return prev === "" && next === "" && t.length < 70 && !/[.!?,;„]/.test(t);
  };

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const t = l.trim();
    if (isSectionBreak(t))  { flush(); blocks.push({ type: "section" }); continue; }
    if (!t)                 { flush(); continue; }
    if (isTitle(t, i, lines)) { flush(); blocks.push({ type: "title",  text: t.replace(/^#{1,3}\s*/, "") }); continue; }
    if (isDialogue(t))      { flush(); blocks.push({ type: "dialog", text: t }); continue; }
    if (isQuote(t))         { flush(); blocks.push({ type: "quote",  text: t.replace(/^>\s*/, "") }); continue; }
    buf.push(t);
  }
  flush();
  return blocks;
}

/* ─── Parser'ı HTML'e dönüştür (önizleme için) ─── */
function blocksToHtml(blocks) {
  const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  let html = "";
  for (const b of blocks) {
    if (b.type === "title")   html += `<div class="pv-title">${esc(b.text)}</div>`;
    else if (b.type === "dialog")  html += `<div class="pv-dialog">${esc(b.text)}</div>`;
    else if (b.type === "quote")   html += `<div class="pv-quote">${esc(b.text)}</div>`;
    else if (b.type === "section") html += `<div class="pv-section">✦ &nbsp; ✦ &nbsp; ✦</div>`;
    else if (b.type === "para")    html += `<div class="pv-para">${b.lines.map(esc).join("<br>")}</div>`;
  }
  return html || `<span style="color:var(--muted)">Metin boş.</span>`;
}

/* ─── Canlı İstatistikleri Güncelle ─────────────── */
function updateStats(text) {
  const words     = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars     = text.length;
  const sentences = (text.match(/[.!?…]+/g) || []).length;
  const readTime  = Math.max(1, Math.round(words / 200));

  document.getElementById("statWords").textContent     = words.toLocaleString("tr");
  document.getElementById("statChars").textContent     = chars.toLocaleString("tr");
  document.getElementById("statSentences").textContent = sentences.toLocaleString("tr");
  document.getElementById("statTime").textContent      = readTime + " dk";
  document.getElementById("charCount").textContent     = chars.toLocaleString("tr");
}

/* ─── Yapı Analizini Güncelle ───────────────────── */
function updateStructure(blocks) {
  const count = t => blocks.filter(b => b.type === t).length;
  document.getElementById("structTitles").textContent  = count("title");
  document.getElementById("structDialogs").textContent = count("dialog");
  document.getElementById("structParas").textContent   = count("para");
  document.getElementById("structSections").textContent= count("section");
}

/* ─── Otomatik Kayıt Göstergesi ─────────────────── */
function setAutoSaveState(state) {
  const dot   = document.getElementById("saveDot");
  const label = document.getElementById("saveLabel");
  if (!dot || !label) return;
  dot.className   = "save-dot " + state;
  const labels = { saved: "Kaydedildi", unsaved: "Kaydedilmedi", saving: "Kaydediliyor…" };
  label.textContent = labels[state] || "";
}

/* ─── Metin Temizleme Araçları ──────────────────── */
function cleanText(raw) {
  return raw
    .replace(/[ \t]+/g, " ")           // birden fazla boşluk → tek boşluk
    .replace(/\n{3,}/g, "\n\n")        // 3+ boş satır → 2 boş satır
    .replace(/^\s+|\s+$/gm, s => s.replace(/ /g,"")) // satır başı/sonu boşluk
    .trim();
}

function fixDashes(raw) {
  return raw
    .replace(/\s*--\s*/g, " \u2014 ")       // -- → em-dash (—)
    .replace(/ - /g, " \u2013 ")            // yalnız tire → en-dash (–)
    .replace(/^- /gm, "\u2014 ");           // satır başı - → —
}

function fixQuotes(raw) {
  // "text" → „text" (Almanca alıntı işareti)
  return raw
    .replace(/"([^"]+)"/g, "\u201E$1\u201C")
    .replace(/'([^']+)'/g, "\u201A$1\u2018");
}

/* ═══ ANA MODÜL ═══════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {

  const editor  = document.getElementById("textArea");
  const readBtn = document.getElementById("goReadBtn");
  if (!editor) return;

  /* — URL parametresinden metin yükle — */
  const urlParams = new URLSearchParams(window.location.search);
  const urlText   = urlParams.get("text");
  if (urlText?.trim()) {
    editor.innerText = urlText.trim();
    window.history.replaceState({}, "", window.location.pathname);
  } else {
    const saved = sessionStorage.getItem("savedText");
    if (saved) editor.innerText = saved;
  }

  /* — İlk render — */
  const initial = editor.innerText;
  updateStats(initial);
  updateStructure(parseText(initial));
  if (initial.trim()) setAutoSaveState("saved");

  /* ── Akıllı Yapıştırma ── */
  editor.addEventListener("paste", e => {
    e.preventDefault();
    let text = (e.clipboardData || window.clipboardData).getData("text");
    // Satır yapısını koru, sadece gereksiz boşlukları temizle
    text = text
      .replace(/[ \t]+/g, " ")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();
    document.execCommand("insertText", false, text);
  });

  /* ── Canlı Analiz (debounce 300ms) ── */
  let analysisTimer = null;
  let autoSaveTimer = null;

  editor.addEventListener("input", () => {
    const text = editor.innerText;

    /* Anlık sayaç güncelle */
    updateStats(text);

    /* Yapı analizi 300ms sonra */
    clearTimeout(analysisTimer);
    analysisTimer = setTimeout(() => {
      updateStructure(parseText(text));
    }, 300);

    /* Otomatik kayıt 2 sn sonra */
    setAutoSaveState("unsaved");
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      if (text.trim()) {
        setAutoSaveState("saving");
        sessionStorage.setItem("savedText", text);
        setTimeout(() => setAutoSaveState("saved"), 500);
      }
    }, 2000);
  });

  /* ── Araç Butonları ── */

  /* Metni Temizle */
  document.getElementById("btnClean")?.addEventListener("click", () => {
    const cleaned = cleanText(editor.innerText);
    editor.innerText = cleaned;
    updateStats(cleaned);
    updateStructure(parseText(cleaned));
    toast("Metin temizlendi", "ok");
  });

  /* Tireleri Düzelt */
  document.getElementById("btnFixDashes")?.addEventListener("click", () => {
    const fixed = fixDashes(editor.innerText);
    editor.innerText = fixed;
    updateStats(fixed);
    updateStructure(parseText(fixed));
    toast("Tireler düzeltildi (– ve —)", "ok");
  });

  /* Tırnakları Düzelt */
  document.getElementById("btnFixQuotes")?.addEventListener("click", () => {
    const fixed = fixQuotes(editor.innerText);
    editor.innerText = fixed;
    updateStats(fixed);
    updateStructure(parseText(fixed));
    toast("Tırnak işaretleri Almanca formatına dönüştürüldü", "ok");
  });

  /* Editörü Temizle */
  document.getElementById("btnClear")?.addEventListener("click", () => {
    if (!editor.innerText.trim()) return;
    if (confirm("Editördeki metni silmek istediğinize emin misiniz?")) {
      editor.innerText = "";
      updateStats("");
      updateStructure([]);
      sessionStorage.removeItem("savedText");
      setAutoSaveState("unsaved");
      toast("Metin silindi");
    }
  });

  /* ── Önizleme Modu ── */
  const modal      = document.getElementById("previewModal");
  const modalClose = document.getElementById("previewClose");
  const backdrop   = document.getElementById("previewBackdrop");
  const content    = document.getElementById("previewContent");

  document.getElementById("btnPreview")?.addEventListener("click", () => {
    const text   = editor.innerText.trim();
    const blocks = parseText(text);
    content.innerHTML = blocksToHtml(blocks);
    modal.classList.add("open");
  });

  const closeModal = () => modal.classList.remove("open");
  modalClose?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  /* ── Okuma Moduna Geç ── */
  readBtn?.addEventListener("click", async () => {
    const text = editor.innerText.trim();

    if (text.length < 1) {
      toast("Metin boş!", "err");
      return;
    }

    const userId = window.getUserId?.();
    if (!userId) {
      alert("Oturum bulunamadı, lütfen tekrar giriş yapın.");
      window.location.href = "../";
      return;
    }

    readBtn.disabled = true;
    readBtn.textContent = "Kaydediliyor…";

    try {
      /* Metin bloklarını da kaydet — okuma sayfası kullanabilir */
      const blocks = parseText(text);
      await saveMetin(userId, text);
      sessionStorage.setItem("savedText",   text);
      sessionStorage.setItem("parsedBlocks", JSON.stringify(blocks));
      sessionStorage.setItem("returnPage",   "metin.html");
      window.location.href = "../okuma/";
    } catch (err) {
      console.error("Kayıt hatası:", err);
      toast("Kayıt sırasında bir hata oluştu", "err");
      readBtn.disabled = false;
      readBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> Okuma Moduna Geç`;
    }
  });

});