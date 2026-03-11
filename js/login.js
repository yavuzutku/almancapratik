import { loginWithGoogle, logoutFirebase, onAuthChange } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {

  /* Kullanıcı zaten giriş yapmışsa direkt yönlendir */
  onAuthChange((user) => {
    if (user) {
      /* Giriş yapıldı panelini göster */
      const loginView = document.getElementById("login-view");
      const userView  = document.getElementById("user-view");

      if (loginView) loginView.style.display = "none";
      if (userView)  userView.style.display  = "flex";

      /* textContent ile kullanıcı verisi — innerHTML DEĞİL */
      const nameEl   = document.getElementById("user-name");
      const emailEl  = document.getElementById("user-email");
      const avatarEl = document.getElementById("user-avatar");

      if (nameEl)   nameEl.textContent  = user.displayName || "";
      if (emailEl)  emailEl.textContent = user.email || "";
      if (avatarEl) {
        avatarEl.src = user.photoURL || "";
        avatarEl.alt = user.displayName ? user.displayName + " profil fotoğrafı" : "Profil fotoğrafı";
      }

      /* Kısa bir gecikme ile yönlendir (panel görünsün) */
      setTimeout(() => {
        window.location.href = "anasayfa/";
      }, 600);
    }
  });

  /* ── Google ile Giriş Butonu ── */
  const container = document.getElementById("google-btn-container");
  if (container) {

    /*
     * ✅ ERİŞİLEBİLİRLİK: Inline style yerine CSS class kullan.
     *    Butonun stil tanımları login.css içindeki .google-btn sınıfında.
     * ✅ aria-label: ekran okuyucular için anlamlı etiket.
     */
    const btn = document.createElement("button");
    btn.id          = "googleSignInBtn";
    btn.className   = "google-btn";
    btn.type        = "button";
    btn.setAttribute("aria-label", "Google hesabınla giriş yap");

    /* SVG (dekoratif, aria-hidden) */
    const svgNS = "http://www.w3.org/2000/svg";
    const svg   = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width",  "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox","0 0 48 48");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable",   "false");
    svg.innerHTML = `
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    `;

    const span = document.createElement("span");
    span.textContent = "Google ile Giriş Yap";

    btn.appendChild(svg);
    btn.appendChild(span);
    container.appendChild(btn);

    btn.addEventListener("click", async () => {
      btn.disabled     = true;
      span.textContent = "Yükleniyor...";
      try {
        await loginWithGoogle();
        /* onAuthChange zaten yönlendiriyor */
      } catch (err) {
        console.error("Giriş hatası:", err);
        btn.disabled     = false;
        span.textContent = "Google ile Giriş Yap";
        if (err.code !== "auth/popup-closed-by-user") {
          alert("Giriş yapılamadı. Lütfen tekrar deneyin.");
        }
      }
    });
  }

  /* ── Çıkış Butonu ── */
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await logoutFirebase();
      } catch (err) {
        console.error("Çıkış hatası:", err);
      } finally {
        window.location.reload();
      }
    });
  }
});