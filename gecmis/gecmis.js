/* ════════════════════════════════════════════════════════════
   gecmis.js  —  AlmancaPratik Metin Geçmişi  v2
   Yenilikler:
   - Favori sistemi (localStorage)
   - Çoklu seçim + toplu silme
   - Tümünü sil → onay kutusu
   - Geri → ../pratik/
   ════════════════════════════════════════════════════════════ */

import { getMetinler, deleteMetin, onAuthChange } from "../js/firebase.js";

/* ── State ──────────────────────────────────────────────── */
let allMetinler  = [];
let activeId     = null;
let selectedIds  = new Set();
let selectMode   = false;
let currentUserId = null;

/* ── Favoriler (localStorage) ───────────────────────────── */
function getFavKey()        { return `ap_favs_${currentUserId}`; }
function loadFavs()         { try { return new Set(JSON.parse(localStorage.getItem(getFavKey()) || "[]")); } catch { return new Set(); } }
function saveFavs(set)      { localStorage.setItem(getFavKey(), JSON.stringify([...set])); }
function isFav(id)          { return loadFavs().has(id); }
function toggleFav(id)      {
  const favs = loadFavs();
  favs.has(id) ? favs.delete(id) : favs.add(id);
  saveFavs(favs);
}

/* ── Güvenlik ───────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("tr-TR", {
    day:"2-digit", month:"long", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/* ── Hata göster ────────────────────────────────────────── */
function showError(msg) {
  const c = document.getElementById("historyList");
  if (!c) return;
  c.innerHTML = `<div style="padding:24px;border-radius:12px;background:rgba(224,82,82,.08);border:1px solid rgba(224,82,82,.2);color:#e05252;font-size:14px;text-align:center">⚠️ ${escapeHtml(msg)}</div>`;
}

/* ══════════════════════════════════════════════════════════
   LİSTE RENDER
   ══════════════════════════════════════════════════════════ */
function renderList(list) {
  const container = document.getElementById("historyList");
  const empty     = document.getElementById("emptyState");

  [...container.querySelectorAll(".history-card")].forEach(el => el.remove());

  if (list.length === 0) { empty.style.display = "block"; return; }
  empty.style.display = "none";

  // Favoriler en üste
  const sorted = [...list].sort((a, b) => {
    const af = isFav(a.id) ? 1 : 0, bf = isFav(b.id) ? 1 : 0;
    if (af !== bf) return bf - af;
    return b.created - a.created;
  });

  sorted.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "history-card" + (selectedIds.has(item.id) ? " selected" : "");
    card.dataset.id = item.id;
    card.style.animationDelay = (idx * 40) + "ms";

    /* ── Checkbox (seçim modu) */
    const checkbox = document.createElement("div");
    checkbox.className = "card-checkbox";
    checkbox.innerHTML = selectedIds.has(item.id) ? "✓" : "";

    /* ── Meta satırı */
    const metaDiv = document.createElement("div");
    metaDiv.className = "card-meta";

    const dateSpan = document.createElement("span");
    dateSpan.className = "card-date";
    dateSpan.textContent = formatDate(item.created);

    const wcSpan = document.createElement("span");
    wcSpan.className = "card-wordcount";
    wcSpan.textContent = wordCount(item.text) + " kelime";

    /* ── Favori butonu */
    const favBtn = document.createElement("button");
    favBtn.className = "card-fav-btn" + (isFav(item.id) ? " is-fav" : "");
    favBtn.title = isFav(item.id) ? "Favoriden çıkar" : "Favoriye ekle";
    favBtn.textContent = isFav(item.id) ? "★" : "☆";
    favBtn.addEventListener("click", e => {
      e.stopPropagation();
      toggleFav(item.id);
      renderList(allMetinler.filter(m =>
        m.text.toLowerCase().includes(
          (document.getElementById("searchInput")?.value || "").toLowerCase()
        )
      ));
    });

    metaDiv.appendChild(dateSpan);
    metaDiv.appendChild(wcSpan);
    metaDiv.appendChild(favBtn);

    /* ── Önizleme */
    const previewDiv = document.createElement("div");
    previewDiv.className = "card-preview";
    previewDiv.textContent = item.text;

    card.appendChild(checkbox);
    card.appendChild(metaDiv);
    card.appendChild(previewDiv);

    card.addEventListener("click", () => {
      if (selectMode) {
        toggleSelect(item.id);
      } else {
        openModal(item);
      }
    });

    container.appendChild(card);
  });

  updateSelectUI();
}

/* ══════════════════════════════════════════════════════════
   SEÇİM MODU
   ══════════════════════════════════════════════════════════ */
function toggleSelectMode() {
  selectMode = !selectMode;
  selectedIds.clear();

  const btn     = document.getElementById("selectModeBtn");
  const toolbar = document.getElementById("selectToolbar");

  if (btn)     btn.textContent = selectMode ? "İptal" : "Seç";
  if (toolbar) toolbar.style.display = selectMode ? "flex" : "none";

  document.getElementById("historyList")?.classList.toggle("select-mode", selectMode);
  renderList(allMetinler);
}

function toggleSelect(id) {
  selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);
  updateSelectUI();

  // Sadece ilgili kartın görünümünü güncelle
  const card = document.querySelector(`.history-card[data-id="${id}"]`);
  if (card) {
    card.classList.toggle("selected", selectedIds.has(id));
    const cb = card.querySelector(".card-checkbox");
    if (cb) cb.textContent = selectedIds.has(id) ? "✓" : "";
  }
}

function updateSelectUI() {
  const label = document.getElementById("selectedCount");
  const delBtn = document.getElementById("deleteSelectedBtn");
  const selAll = document.getElementById("selectAllBtn");

  if (label)  label.textContent = `${selectedIds.size} seçildi`;
  if (delBtn) delBtn.disabled = selectedIds.size === 0;
  if (selAll) selAll.textContent = selectedIds.size === allMetinler.length ? "Seçimi kaldır" : "Tümünü seç";
}

function toggleSelectAll() {
  if (selectedIds.size === allMetinler.length) {
    selectedIds.clear();
  } else {
    allMetinler.forEach(m => selectedIds.add(m.id));
  }
  renderList(allMetinler);
}

/* ══════════════════════════════════════════════════════════
   SİLME İŞLEMLERİ
   ══════════════════════════════════════════════════════════ */
async function deleteSelected() {
  if (selectedIds.size === 0) return;
  const n = selectedIds.size;
  if (!confirm(`Seçilen ${n} metin silinecek. Emin misiniz?`)) return;

  const userId = currentUserId;
  if (!userId) return;

  try {
    await Promise.all([...selectedIds].map(id => deleteMetin(userId, id)));
    selectedIds.clear();
    toggleSelectMode(); // seçim modundan çık
    await loadHistory();
  } catch (err) {
    alert("Silme hatası: " + err.message);
  }
}

async function deleteAll() {
  if (allMetinler.length === 0) return;
  if (!confirm(`Tüm ${allMetinler.length} metin kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?`)) return;

  const userId = currentUserId;
  if (!userId) return;

  try {
    await Promise.all(allMetinler.map(m => deleteMetin(userId, m.id)));
    await loadHistory();
  } catch (err) {
    alert("Silme hatası: " + err.message);
  }
}

/* ══════════════════════════════════════════════════════════
   MODAL
   ══════════════════════════════════════════════════════════ */
function openModal(item) {
  activeId = item.id;

  document.getElementById("modalDate").textContent = formatDate(item.created);
  document.getElementById("modalText").textContent = item.text;

  /* Favori durumunu modal'da göster */
  const favToggle = document.getElementById("modalFavBtn");
  if (favToggle) {
    favToggle.textContent = isFav(item.id) ? "★ Favoriden çıkar" : "☆ Favoriye ekle";
    favToggle.classList.toggle("is-fav", isFav(item.id));
  }

  document.getElementById("previewModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("previewModal").style.display = "none";
  activeId = null;
}

/* ══════════════════════════════════════════════════════════
   VERİ YÜKLEME
   ══════════════════════════════════════════════════════════ */
async function loadHistory() {
  const userId = currentUserId;
  if (!userId) return;
  try {
    allMetinler = await getMetinler(userId);
    renderList(allMetinler);
  } catch (err) {
    showError(err.message);
  }
}

/* ══════════════════════════════════════════════════════════
   BAŞLANGIÇ
   ══════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {

  /* Auth */
  onAuthChange(user => {
    if (user) {
      currentUserId = user.uid ?? window.getUserId?.();
      loadHistory();
    }
  });

  /* Arama */
  document.getElementById("searchInput")?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    renderList(allMetinler.filter(m => m.text.toLowerCase().includes(q)));
  });

  /* Tümünü sil */
  document.getElementById("clearAllBtn")?.addEventListener("click", deleteAll);

  /* Seçim modu aç/kapat */
  document.getElementById("selectModeBtn")?.addEventListener("click", toggleSelectMode);

  /* Tümünü seç */
  document.getElementById("selectAllBtn")?.addEventListener("click", toggleSelectAll);

  /* Seçilenleri sil */
  document.getElementById("deleteSelectedBtn")?.addEventListener("click", deleteSelected);

  /* Modal kapat */
  document.getElementById("modalClose")?.addEventListener("click", closeModal);
  document.getElementById("previewModal")?.addEventListener("click", e => {
    if (e.target.id === "previewModal") closeModal();
  });

  /* Modal: Favori toggle */
  document.getElementById("modalFavBtn")?.addEventListener("click", () => {
    if (!activeId) return;
    toggleFav(activeId);
    const item = allMetinler.find(m => m.id === activeId);
    if (item) openModal(item); // yenile
  });

  /* Modal: Okumaya başla */
  document.getElementById("modalRead")?.addEventListener("click", () => {
    const item = allMetinler.find(m => m.id === activeId);
    if (!item) return;
    sessionStorage.setItem("savedText",  item.text);
    sessionStorage.setItem("returnPage", "../gecmis/");
    window.location.href = "../okuma/";
  });

  /* Modal: Sil */
  document.getElementById("modalDelete")?.addEventListener("click", async () => {
    if (!activeId) return;
    if (!confirm("Bu metin silinecek. Emin misiniz?")) return;
    const userId = currentUserId;
    if (!userId) return;
    try {
      await deleteMetin(userId, activeId);
      closeModal();
      await loadHistory();
    } catch (err) {
      alert("Silme hatası: " + err.message);
    }
  });

  /* Geri butonu */
  document.querySelector(".back-btn")?.addEventListener("click", () => {
    window.location.href = "../pratik/";
  });
});