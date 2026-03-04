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