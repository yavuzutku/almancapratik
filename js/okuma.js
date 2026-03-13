import { saveWord, getWords } from "./firebase.js";
import { renderTagChips, getSelectedTags, extractAllTags } from "./tag.js";
import {
  fetchWikiData, fetchTranslate, normalizeGermanWord,
  artikelBadgeHtml, escapeHtml, ARTIKEL_COLORS
} from "./german.js";

document.addEventListener("DOMContentLoaded", async () => {

  const text   = sessionStorage.getItem("savedText");
  const reader = document.getElementById("readerText");

  if (!text || text.trim().length < 1) {
    reader.innerHTML = "<h2 style='color:var(--text-muted);font-family:var(--ui-font);'>Metin Bulunamadı</h2>";
    return;
  }

  loadText(text);
  updateMeta(text);
  createTranslateUI();
  initProgressBar();
  restorePrefs();

  try {
    const userId = window.getUserId?.();
    if (userId) _userWords = await getWords(userId);
  } catch(e) {}

  document.getElementById("modalMeaningInput")
    .addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveWordFromModal();
    });

  // Banner dismiss durumu
  if (sessionStorage.getItem("bannerDismissed")) dismissBanner(false);
});

/* ══════════════════════════════════════════════
   META / İSTATİSTİK
══════════════════════════════════════════════ */
function updateMeta(text) {
  const wordCount = text.trim().split(/\s+/).length;
  const minutes   = Math.max(1, Math.round(wordCount / 200));
  const el        = document.getElementById("readingMeta");
  if (el) el.textContent = `${wordCount.toLocaleString()} kelime · ~${minutes} dk`;
}

/* ══════════════════════════════════════════════
   İLERLEME ÇUBUĞU
══════════════════════════════════════════════ */
function initProgressBar() {
  const bar = document.getElementById("progressBar");
  if (!bar) return;
  const container = document.getElementById("readerText");
  window.addEventListener("scroll", () => {
    const total   = document.documentElement.scrollHeight - window.innerHeight;
    const current = window.scrollY;
    bar.style.width = total > 0 ? ((current / total) * 100) + "%" : "0%";
  });
}

/* ══════════════════════════════════════════════
   TEMA SİSTEMİ
══════════════════════════════════════════════ */
const THEMES = ["dark", "sepia", "light"];
let _themeIdx = 0;

function cycleTheme() {
  _themeIdx = (_themeIdx + 1) % THEMES.length;
  applyTheme(THEMES[_themeIdx]);
  sessionStorage.setItem("readerTheme", _themeIdx);
}

function applyTheme(name) {
  document.body.classList.remove("theme-sepia", "theme-light");
  if (name === "sepia") document.body.classList.add("theme-sepia");
  if (name === "light") document.body.classList.add("theme-light");
  const btn = document.getElementById("themeBtn");
  if (btn) btn.textContent = name === "light" ? "🌙" : name === "sepia" ? "📜" : "☀";
}

/* ══════════════════════════════════════════════
   YAZI TİPİ TOGGLE
══════════════════════════════════════════════ */
let _serifMode = true;

function toggleFont() {
  _serifMode = !_serifMode;
  const el = document.getElementById("readerText");
  el.style.fontFamily = _serifMode
    ? "var(--reader-font)"
    : "'DM Sans', system-ui, sans-serif";
  const btn = document.getElementById("fontToggleBtn");
  if (btn) btn.textContent = _serifMode ? "Tf" : "Ss";
  sessionStorage.setItem("readerSerifMode", _serifMode ? "1" : "0");
}

/* ══════════════════════════════════════════════
   ODAK MODU
══════════════════════════════════════════════ */
let _focusMode = false;

function toggleFocus() {
  _focusMode = !_focusMode;
  document.body.classList.toggle("focus-mode", _focusMode);
  const btn = document.getElementById("focusBtn");
  if (btn) btn.textContent = _focusMode ? "⊠" : "⊡";
}

/* ══════════════════════════════════════════════
   BANNER
══════════════════════════════════════════════ */
function dismissBanner(save = true) {
  const el = document.getElementById("featuresBanner");
  if (el) el.classList.add("hidden");
  if (save) sessionStorage.setItem("bannerDismissed", "1");
}

/* ══════════════════════════════════════════════
   PREFS RESTORE
══════════════════════════════════════════════ */
function restorePrefs() {
  const themeIdx = parseInt(sessionStorage.getItem("readerTheme") || "0", 10);
  _themeIdx = themeIdx;
  applyTheme(THEMES[_themeIdx]);

  const serif = sessionStorage.getItem("readerSerifMode");
  if (serif === "0") toggleFont();

  const size = sessionStorage.getItem("readerFontSize");
  if (size) {
    currentSize = parseInt(size, 10);
    document.getElementById("readerText").style.fontSize = currentSize + "px";
  }
}

/* ══════════════════════════════════════════════
   GENEL
══════════════════════════════════════════════ */
function goBack() {
  sessionStorage.removeItem("returnPage");
  window.location.href = "../metin/";
}

let currentSize = 19;

function increaseFont() {
  currentSize = Math.min(32, currentSize + 1);
  document.getElementById("readerText").style.fontSize = currentSize + "px";
  sessionStorage.setItem("readerFontSize", currentSize);
}

function decreaseFont() {
  currentSize = Math.max(13, currentSize - 1);
  document.getElementById("readerText").style.fontSize = currentSize + "px";
  sessionStorage.setItem("readerFontSize", currentSize);
}

function loadText(text) {
  document.getElementById("readerText").innerText = text;
}

/* global erişim */
window.goBack             = goBack;
window.increaseFont       = increaseFont;
window.decreaseFont       = decreaseFont;
window.cycleTheme         = cycleTheme;
window.toggleFont         = toggleFont;
window.toggleFocus        = toggleFocus;
window.dismissBanner      = dismissBanner;
window.openAddWordModal   = openAddWordModal;
window.closeAddWordModal  = closeAddWordModal;
window.saveWordFromModal  = saveWordFromModal;
window.closeMiniTranslate = closeMiniTranslate;
window.saveWordFromPopup  = saveWordFromPopup;

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */
let selectedWordGlobal = "";
let _userWords         = [];
let _popupWikiData     = null;

/* ══════════════════════════════════════════════
   ÇEVİRİ POPUP SİSTEMİ
══════════════════════════════════════════════ */
function createTranslateUI() {
  const readerText = document.getElementById("readerText");
  const btn   = document.getElementById("floatingMeaningBtn");
  const popup = document.getElementById("miniTranslatePopup");

  readerText.addEventListener("mouseup", function() {
    const selObj = window.getSelection();
    if (!selObj || selObj.rangeCount === 0) { btn.style.display = "none"; return; }

    let selection = selObj.toString().trim();
    selection = selection.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
    if (selection.length === 0) { btn.style.display = "none"; return; }

    selectedWordGlobal = selection;
    const range = selObj.getRangeAt(0);
    const rect  = range.getBoundingClientRect();
    if (!rect || rect.width === 0) { btn.style.display = "none"; return; }

    popup.style.display = "none";
    btn.style.display   = "flex";
    btn.style.top  = (window.scrollY + rect.bottom + 10) + "px";
    btn.style.left = (window.scrollX + rect.left) + "px";
  });

  btn.addEventListener("click", openMiniTranslate);

  document.addEventListener("mousedown", function(e) {
    const wordModalOverlay = document.getElementById("wordModalOverlay");
    const clickedInside =
      readerText.contains(e.target) ||
      btn.contains(e.target)        ||
      popup.contains(e.target)      ||
      (wordModalOverlay && wordModalOverlay.contains(e.target));

    if (!clickedInside) {
      btn.style.display   = "none";
      popup.style.display = "none";
      window.getSelection().removeAllRanges();
      selectedWordGlobal = "";
    }
  });
}

function openMiniTranslate() {
  const btn   = document.getElementById("floatingMeaningBtn");
  const popup = document.getElementById("miniTranslatePopup");

  // Popup'ı butonun yerine konumlandır
  popup.style.top  = btn.style.top;
  popup.style.left = btn.style.left;
  btn.style.display   = "none";
  popup.style.display = "block";

  _popupWikiData = null;

  popup.innerHTML = `
    <div class="popup-loading">
      <div class="dots"><span></span><span></span><span></span></div>
      <span>Çevriliyor…</span>
    </div>`;

  Promise.all([
    fetchTranslate(selectedWordGlobal),
    fetchWikiData(selectedWordGlobal),
  ])
  .then(([{ main, alts }, wiki]) => {
    window._lastTranslated = main;
    _popupWikiData = wiki;

    const artikelHtml = artikelBadgeHtml(wiki.artikel, { size: 11 });

    const typeHtml = wiki.wordType
      ? `<span class="popup-type-badge">${wiki.wordType}</span>`
      : "";

    const baseFormHtml = wiki.baseForm
      ? `<div class="popup-base-form">
           <span>Temel form: <strong>${escapeHtml(wiki.baseForm)}</strong></span>
           <button class="popup-apply-base" id="popupApplyBase">kullan →</button>
         </div>`
      : "";

    const altsHtml = alts.length > 0
      ? `<div class="popup-alts">
           ${alts.slice(0, 5).map(a =>
             `<button class="popup-alt-chip" data-alt="${escapeHtml(a)}">${escapeHtml(a)}</button>`
           ).join("")}
         </div>`
      : "";

    popup.innerHTML = `
      <div class="popup-header">
        <div class="popup-word-row">
          ${artikelHtml}
          <span class="popup-word">${escapeHtml(selectedWordGlobal)}</span>
          ${typeHtml}
        </div>
        <button class="popup-close" onclick="closeMiniTranslate()">✕</button>
      </div>

      <div class="popup-body">
        <div class="popup-main-tr" id="popupMainTranslation">${escapeHtml(main)}</div>
        ${altsHtml}
        ${baseFormHtml}

        <div class="popup-tag-section">
          <div class="popup-tag-label">Etiket</div>
          <div id="popupTagChips" class="tag-chips" style="gap:5px;"></div>
        </div>
      </div>

      <div class="popup-footer">
        <button class="popup-save-btn" id="popupSaveBtn">＋ Sözlüğe Ekle</button>
      </div>
    `;

    renderTagChips("popupTagChips", wiki.autoTags, extractAllTags(_userWords));

    popup.querySelectorAll(".popup-alt-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        window._lastTranslated = chip.dataset.alt;
        popup.querySelector("#popupMainTranslation").textContent = chip.dataset.alt;
      });
    });

    const applyBtn = popup.querySelector("#popupApplyBase");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        selectedWordGlobal = wiki.baseForm;
        closeMiniTranslate();
        document.getElementById("floatingMeaningBtn").style.display = "flex";
        openMiniTranslate();
      });
    }

    popup.querySelector("#popupSaveBtn").addEventListener("click", saveWordFromPopup);
  })
  .catch(() => {
    popup.innerHTML = `
      <div style="padding:16px;color:var(--error);font-size:13px;">
        Çeviri alınamadı. Lütfen tekrar deneyin.
      </div>`;
  });
}

function closeMiniTranslate() {
  const popup = document.getElementById("miniTranslatePopup");
  if (popup) popup.style.display = "none";
  selectedWordGlobal = "";
  _popupWikiData = null;
}

async function saveWordFromPopup() {
  let word      = selectedWordGlobal;
  const meaning = window._lastTranslated;

  if (!word || !meaning) {
    showToast("Kelime veya çeviri bulunamadı.", "error");
    return;
  }

  const saveBtn = document.getElementById("popupSaveBtn");
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Kaydediliyor…"; }

  try {
    const userId = window.getUserId();
    if (!userId) throw new Error("Oturum yok");

    word = normalizeGermanWord(word, _popupWikiData);
    const tags = getSelectedTags("popupTagChips");

    await saveWord(userId, word, meaning, tags);
    closeMiniTranslate();
    window._lastTranslated = "";
    showToast(`"${word}" sözlüğe eklendi`, "success");

  } catch(err) {
    console.error(err);
    showToast("Kayıt başarısız.", "error");
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "＋ Sözlüğe Ekle"; }
  }
}

/* ══════════════════════════════════════════════
   MANUEL MODAL
══════════════════════════════════════════════ */
function openAddWordModal() {
  if (!selectedWordGlobal) {
    showToast("Önce metinden bir kelime seçin.", "error");
    return;
  }

  const wiki      = _popupWikiData || {};
  const artikel   = wiki.artikel || "";
  const displayEl = document.getElementById("modalWordDisplay");

  if (artikel) {
    displayEl.innerHTML = artikelBadgeHtml(artikel, { size: 14 })
      + ` ${escapeHtml(wiki.baseForm
          ? wiki.baseForm.charAt(0).toUpperCase() + wiki.baseForm.slice(1)
          : selectedWordGlobal.charAt(0).toUpperCase() + selectedWordGlobal.slice(1))}`;
  } else {
    displayEl.textContent = selectedWordGlobal;
  }

  const baseWrap = document.getElementById("modalBaseFormWrap");
  const baseSpan = document.getElementById("modalBaseFormText");
  if (baseWrap && baseSpan && wiki.baseForm) {
    baseSpan.textContent   = wiki.baseForm;
    baseWrap.style.display = "flex";
  } else if (baseWrap) {
    baseWrap.style.display = "none";
  }

  document.getElementById("modalMeaningInput").value = "";
  renderTagChips("modalTagChips", wiki.autoTags || [], extractAllTags(_userWords));

  document.getElementById("wordModalOverlay").classList.add("active");
  setTimeout(() => document.getElementById("modalMeaningInput").focus(), 100);
}

window.applyModalBaseForm = function() {
  const wiki = _popupWikiData;
  if (!wiki?.baseForm) return;
  selectedWordGlobal = wiki.baseForm;

  const baseWrap = document.getElementById("modalBaseFormWrap");
  if (baseWrap) baseWrap.style.display = "none";

  fetchWikiData(wiki.baseForm).then(newWiki => {
    _popupWikiData = newWiki;
    const displayEl = document.getElementById("modalWordDisplay");
    const a = newWiki.artikel;
    if (a) {
      displayEl.innerHTML = artikelBadgeHtml(a, { size: 14 })
        + ` ${escapeHtml(wiki.baseForm.charAt(0).toUpperCase() + wiki.baseForm.slice(1))}`;
    } else {
      displayEl.textContent = wiki.baseForm;
    }
    renderTagChips("modalTagChips", newWiki.autoTags, extractAllTags(_userWords));
  });
};

function closeAddWordModal() {
  document.getElementById("wordModalOverlay").classList.remove("active");
}

async function saveWordFromModal() {
  const meaning = document.getElementById("modalMeaningInput").value.trim();
  if (!meaning) {
    document.getElementById("modalMeaningInput").focus();
    return;
  }

  const wiki    = _popupWikiData || {};
  const tags    = getSelectedTags("modalTagChips");
  const saveBtn = document.querySelector(".word-modal-save");
  saveBtn.disabled    = true;
  saveBtn.textContent = "Kaydediliyor…";

  try {
    const userId = window.getUserId();
    if (!userId) throw new Error("Oturum yok");

    const word = normalizeGermanWord(selectedWordGlobal, wiki);

    await saveWord(userId, word, meaning, tags);
    closeAddWordModal();
    selectedWordGlobal = "";
    showToast(`"${word}" sözlüğe eklendi`, "success");

  } catch(err) {
    console.error(err);
    showToast("Kayıt başarısız.", "error");
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = "Kaydet";
  }
}

/* ══════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════ */
function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `reader-toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 2400);
}