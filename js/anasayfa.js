/* =============================================
   IndexedDB helpers (anasayfa için)
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
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
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
   Anasayfa UI
   ============================================= */

document.addEventListener("DOMContentLoaded", () => {

  const logoutBtn = document.getElementById("logoutBtn");
  const newTextBtn = document.getElementById("newTextBtn");
  const gecmisBtn  = document.getElementById("gecmisBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("userToken");
      window.location.href = "index.html";
    });
  }

  if (newTextBtn) {
    newTextBtn.addEventListener("click", () => {
      window.location.href = "metin.html";
    });
  }

  if (gecmisBtn) {
    gecmisBtn.addEventListener("click", () => {
      window.location.href = "gecmis.html";
    });
  }

  // metin.js'deki readBtn için IndexedDB kayıt fonksiyonunu global'e aç
  window.saveMetinToDB = saveMetin;
});