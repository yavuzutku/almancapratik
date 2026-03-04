/* =============================================
   db.js işlevleri — IndexedDB üzerinden geçmiş
   ============================================= */

const DB_NAME = "AlmancaApp";
const DB_VERSION = 1;
const STORE_NAME = "metinGecmisi";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("tarih", "tarih", { unique: false });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror  = (e) => reject(e.target.error);
  });
}

async function getAllMetinler() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("tarih");
    const req   = index.getAll();
    req.onsuccess = (e) => resolve(e.target.result.reverse()); // en yeni önce
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function deleteMetin(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function clearAllMetinler() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.clear();
    req.onsuccess = () => resolve();
    req.onerror   = (e) => reject(e.target.error);
  });
}

/* =============================================
   UI
   ============================================= */

let allMetinler = [];
let activeId    = null;

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function renderList(list) {
  const container = document.getElementById("historyList");
  const empty     = document.getElementById("emptyState");

  // Eski kartları temizle (empty state'i koruyarak)
  [...container.querySelectorAll(".history-card")].forEach(el => el.remove());

  if (list.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  list.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.style.animationDelay = (idx * 40) + "ms";

    card.innerHTML = `
      <div class="card-meta">
        <span class="card-date">${formatDate(item.tarih)}</span>
        <span class="card-wordcount">${wordCount(item.metin)} kelime</span>
      </div>
      <div class="card-preview">${item.metin}</div>
    `;

    card.addEventListener("click", () => openModal(item));
    container.appendChild(card);
  });
}

function openModal(item) {
  activeId = item.id;
  document.getElementById("modalDate").textContent = formatDate(item.tarih);
  document.getElementById("modalText").textContent = item.metin;
  document.getElementById("previewModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("previewModal").style.display = "none";
  activeId = null;
}

async function loadHistory() {
  try {
    allMetinler = await getAllMetinler();
    renderList(allMetinler);
  } catch (err) {
    console.error("Geçmiş yüklenemedi:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadHistory();

  // Arama
  document.getElementById("searchInput").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allMetinler.filter(m => m.metin.toLowerCase().includes(q));
    renderList(filtered);
  });

  // Modal kapat
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("previewModal").addEventListener("click", (e) => {
    if (e.target.id === "previewModal") closeModal();
  });

  // Okumaya başla
  document.getElementById("modalRead").addEventListener("click", () => {
    const item = allMetinler.find(m => m.id === activeId);
    if (!item) return;
    // okuma.js'in beklediği savedText'i geçici olarak sessionStorage'a koy
    sessionStorage.setItem("savedText", item.metin);
    window.location.href = "okuma.html";
  });

  // Tek metin sil
  document.getElementById("modalDelete").addEventListener("click", async () => {
    if (activeId === null) return;
    await deleteMetin(activeId);
    closeModal();
    await loadHistory();
  });

  // Tümünü sil
  document.getElementById("clearAllBtn").addEventListener("click", async () => {
    if (!confirm("Tüm geçmiş silinsin mi?")) return;
    await clearAllMetinler();
    await loadHistory();
  });
});