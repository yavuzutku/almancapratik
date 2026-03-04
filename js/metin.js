/* =============================================
   IndexedDB helpers (metin.js için)
   ============================================= */

const DB_NAME    = "AlmancaApp";
const DB_VERSION = 1;
const STORE_NAME = "metinGecmisi";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("tarih", "tarih", { unique: false });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function saveMetin(metin) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.add({ metin, tarih: new Date().toISOString() });
    req.onsuccess = () => resolve();
    req.onerror   = (e) => reject(e.target.error);
  });
}

/* =============================================
   Metin Editörü UI
   ============================================= */

document.addEventListener("DOMContentLoaded", () => {
  const editor  = document.getElementById("textArea");
  const readBtn = document.getElementById("goReadBtn");

  editor.addEventListener("paste", (e) => {
    e.preventDefault();
    const text    = (e.clipboardData || window.clipboardData).getData("text");
    const cleaned = cleanText(text);
    document.execCommand("insertText", false, cleaned);
  });

  if (readBtn) {
    readBtn.addEventListener("click", async () => {
      const text = document.getElementById("textArea").innerText.trim();
      if (text.length < 1) {
        alert("Metin boş! Önce metin ekle.");
        return;
      }
      try {
        await saveMetin(text);
      } catch (err) {
        console.error("Geçmişe kaydedilemedi:", err);
      }
      sessionStorage.setItem("savedText", text);
      window.location.href = "okuma.html";
    });
  }
});

function cleanText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/ +/g, " ")
    .trim();
}