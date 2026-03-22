/* ═══════════════════════════════════════════════════════════
   metin.js  —  AlmancaPratik Metin Editörü  v3
   ═══════════════════════════════════════════════════════════
   v3 eklemeleri:
   - Sidebar'da "Geçmiş Metinler" paneli
   - Geçmiş metne tıklayınca editöre yükle
   - Auth değişince geçmiş otomatik güncellenir
   ═══════════════════════════════════════════════════════════ */

import { saveMetin, getMetinler } from "../js/firebase.js";
import { showToast } from "../src/components/toast.js";
import { showAuthGate, isLoggedIn } from '../src/components/authGate.js';
import { onAuthChange } from "../js/firebase.js";
import { parseText, blocksToHtml, blocksToLegacy } from "./parseText.js";
import { clean } from "./cleanRawText.js";
/* ─────────────────────────────────────────────────────────
   YARDIMCI: tek bir regex test fonksiyonu
   ───────────────────────────────────────────────────────── */
const test = (re, s) => re.test(s);

/* ═══════════════════════════════════════════════════════════
   parseText  —  Almanca metin yapı çözümleyici
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   Blokları HTML'e çevir (önizleme)
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   Canlı istatistik
   ═══════════════════════════════════════════════════════════ */
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

function updateStructure(blocks) {
  const count = type => blocks.filter(b => b.type === type).length;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set("structTitles",   count("title"));
  set("structDialogs",  count("dialog"));
  set("structParas",    count("para"));
  set("structSections", count("section"));
}

function setAutoSaveState(state) {
  const dot   = document.getElementById("saveDot");
  const label = document.getElementById("saveLabel");
  if (!dot || !label) return;
  dot.className = "save-dot " + state;
  const labels = { saved: "Kaydedildi", unsaved: "Kaydedilmedi", saving: "Kaydediliyor\u2026" };
  label.textContent = labels[state] || "";
}

/* ═══════════════════════════════════════════════════════════
   Metin araçları
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   GEÇMİŞ SIDEBAR
   ═══════════════════════════════════════════════════════════ */
function formatRelativeDate(ts) {
  const diff  = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "Az önce";
  if (mins  < 60)  return `${mins} dk önce`;
  if (hours < 24)  return `${hours} sa önce`;
  if (days  < 7)   return `${days} gün önce`;
  return new Date(ts).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Sidebar geçmiş listesini render eder.
 * @param {Array} items  — Firebase'den gelen metin nesneleri dizisi
 * @param {HTMLElement} editor — contenteditable div
 */
function renderSidebarHistory(items, editor) {
  const container = document.getElementById("sidebarHistory");
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `<div class="sidebar-history-empty">Henüz kaydedilmiş metin yok.</div>`;
    return;
  }

  container.innerHTML = "";

  /* En fazla 8 metin göster */
  items.slice(0, 8).forEach((item, idx) => {
    const el = document.createElement("button");
    el.className = "sidebar-history-item";
    el.style.animationDelay = (idx * 35) + "ms";

    /* Tarih */
    const date = document.createElement("span");
    date.className = "shi-date";
    date.textContent = formatRelativeDate(item.created);

    /* Önizleme */
    const preview = document.createElement("span");
    preview.className = "shi-preview";
    preview.textContent = item.text.trim().slice(0, 80);

    /* Kelime sayısı */
    const wc = document.createElement("span");
    wc.className = "shi-wc";
    wc.textContent = wordCount(item.text) + " kelime";

    el.appendChild(date);
    el.appendChild(preview);
    el.appendChild(wc);

    el.addEventListener("click", () => loadHistoryItem(item, editor));
    container.appendChild(el);
  });
}

/**
 * Seçilen geçmiş metni editöre yükler.
 * Mevcut içerik varsa onay ister.
 */
function loadHistoryItem(item, editor) {
  const current = editor.innerText.trim();
  if (current && !confirm("Editördeki mevcut metin silinecek. Devam etmek istiyor musunuz?")) return;

  editor.innerText = item.text;
  updateStats(item.text);
  updateStructure(parseText(item.text));
  setAutoSaveState("saved");
  sessionStorage.setItem("savedText", item.text);

  /* Editöre scroll */
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
  showToast("Metin editöre yüklendi", "ok");
}

/**
 * Geçmişi Firebase'den çeker ve sidebar'ı günceller.
 */
async function loadSidebarHistory(editor) {
  const container = document.getElementById("sidebarHistory");
  if (!container) return;

  if (!isLoggedIn()) {
    container.innerHTML = `<div class="sidebar-history-empty">Geçmişi görmek için giriş yapın.</div>`;
    return;
  }

  container.innerHTML = `<div class="sidebar-history-empty">Yükleniyor…</div>`;

  try {
    const userId = window.getUserId?.();
    if (!userId) throw new Error("Kullanıcı bulunamadı");
    const items = await getMetinler(userId);
    renderSidebarHistory(items, editor);
  } catch (err) {
    container.innerHTML = `<div class="sidebar-history-empty sidebar-history-error">Geçmiş yüklenemedi.</div>`;
    console.error("Sidebar geçmiş hatası:", err);
  }
}

/* ═══════════════════════════════════════════════════════════
   ANA MODÜL
   ═══════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {

  const editor  = document.getElementById("textArea");
  const readBtn = document.getElementById("goReadBtn");
  if (!editor) return;

  /* URL parametresinden metin yükle */
  const urlParams = new URLSearchParams(window.location.search);
  const urlText   = urlParams.get("text");
  if (urlText?.trim()) {
    editor.innerText = urlText.trim();
    window.history.replaceState({}, "", window.location.pathname);
  } else {
    const saved = sessionStorage.getItem("savedText");
    if (saved) editor.innerText = saved;
  }

  /* İlk render */
  const initial = editor.innerText;
  updateStats(initial);
  updateStructure(parseText(initial));
  if (initial.trim()) setAutoSaveState("saved");

  /* Auth değişince geçmişi güncelle */
  onAuthChange(() => loadSidebarHistory(editor));

  /* ── Akıllı yapıştırma ── */
  editor.addEventListener("paste", e => {
    e.preventDefault();
    let text = (e.clipboardData || window.clipboardData).getData("text");
    text = clean(text);   // ← tek satır, hepsini halleder
    document.execCommand("insertText", false, text);
  });

  /* ── Canlı analiz (debounce) ── */
  let analysisTimer = null;
  let autoSaveTimer = null;

  editor.addEventListener("input", () => {
    const text = editor.innerText;
    updateStats(text);
    clearTimeout(analysisTimer);
    analysisTimer = setTimeout(() => updateStructure(parseText(text)), 300);
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

  /* ── Araç butonları ── */
  // YENİ:
  


  /* ── Önizleme modal ── */
  const modal      = document.getElementById("previewModal");
  const modalClose = document.getElementById("previewClose");
  const backdrop   = document.getElementById("previewBackdrop");
  const content    = document.getElementById("previewContent");

  document.getElementById("btnPreview")?.addEventListener("click", () => {
    const blocks = parseText(editor.innerText.trim());
    content.innerHTML = blocksToHtml(blocks);
    modal.classList.add("open");
  });

  const closeModal = () => modal.classList.remove("open");
  modalClose?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click",  closeModal);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  /* ── Okuma moduna geç ── */
  readBtn?.addEventListener("click", async () => {
    const text = editor.innerText.trim();
    if (!text) { showToast("Metin boş!", "err"); return; }

    if (!isLoggedIn()) {
      const blocks = parseText(text);
      sessionStorage.setItem("savedText",    text);
      sessionStorage.setItem("parsedBlocks", JSON.stringify(blocksToLegacy(blocks)));
      sessionStorage.setItem("returnPage",   "../metin/");
      window.location.href = "../okuma/";
      return;
    }

    readBtn.disabled    = true;
    readBtn.textContent = "Kaydediliyor…";
    try {
      const blocks = parseText(text);
      await saveMetin(window.getUserId(), text);
      /* Kayıt sonrası sidebar'ı güncelle */
      loadSidebarHistory(editor);
      sessionStorage.setItem("savedText",    text);
      sessionStorage.setItem("parsedBlocks", JSON.stringify(blocks));
      sessionStorage.setItem("returnPage",   "../metin/");
      window.location.href = "../okuma/";
    } catch (err) {
      showToast("Kayıt sırasında bir hata oluştu", "err");
      readBtn.disabled    = false;
      readBtn.innerHTML   = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> Okuma Moduna Geç`;
    }
  });

});