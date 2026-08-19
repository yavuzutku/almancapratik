import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutFirebase,
  onAuthChange
} from "./firebase.js";

/* ===========================================================
   AYARLAR
=========================================================== */
const VERIFY_POLL_INTERVAL_MS  = 4000;   // otomatik kontrol sıklığı
const VERIFY_POLL_MAX_ATTEMPTS = 90;     // ~6 dakika sonra otomatik kontrolü durdur
const RESEND_COOLDOWN_S        = 60;     // "tekrar gönder" butonu bekleme süresi (spam önleme)
const EMAIL_RE                 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ===========================================================
   YARDIMCI FONKSİYONLAR
=========================================================== */
function showError(elId, msg) {
  const el = document.getElementById(elId);
  if (el) { el.textContent = msg; el.style.display = msg ? "block" : "none"; }
}

function setLoading(btn, span, loading, label) {
  if (!btn || !span) return;
  btn.disabled = loading;
  span.textContent = loading ? "Yükleniyor..." : label;
}

// Kullanıcıdan gelen metni innerHTML içine gömerken XSS'e karşı kaçış
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

function isValidEmail(email) {
  return EMAIL_RE.test(email);
}

function firebaseErrMsg(code) {
  const map = {
    "auth/user-not-found":         "Bu e-posta ile kayıtlı hesap bulunamadı.",
    "auth/wrong-password":         "Şifre yanlış. Lütfen tekrar deneyin.",
    "auth/invalid-credential":     "E-posta veya şifre hatalı.",
    "auth/email-already-in-use":   "Bu e-posta adresi zaten kullanımda.",
    "auth/weak-password":          "Şifre çok zayıf. En az 6 karakter kullanın.",
    "auth/invalid-email":          "Geçersiz e-posta adresi.",
    "auth/too-many-requests":      "Çok fazla deneme. Lütfen biraz bekleyin.",
    "auth/network-request-failed": "İnternet bağlantınızı kontrol edin.",
    "auth/user-disabled":          "Bu hesap devre dışı bırakılmış.",
    "auth/requires-recent-login":  "Bu işlem için tekrar giriş yapmanız gerekiyor.",
    "auth/email-not-verified":     "E-posta adresiniz doğrulanmamış.",
  };
  return map[code] || "Bir hata oluştu. Lütfen tekrar deneyin.";
}

function buildGoogleBtn(containerId, label) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "google-btn";
  btn.setAttribute("aria-label", label);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20"); svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 48 48"); svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  `;
  const span = document.createElement("span");
  span.textContent = label;
  btn.appendChild(svg); btn.appendChild(span);
  container.appendChild(btn);
  btn.addEventListener("click", async () => {
    btn.disabled = true; span.textContent = "Yükleniyor...";
    try { await loginWithGoogle(); }
    catch (err) {
      btn.disabled = false; span.textContent = label;
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        showError(
          containerId.includes("kayit") ? "err-kayit" : "err-giris",
          "Google ile giriş başarısız."
        );
      }
    }
  });
}

/* ===========================================================
   E-POSTA DOĞRULAMA GÖNDERİMİ — TEK MERKEZİ FONKSİYON
   (hem overlay'deki "tekrar gönder", hem giriş ekranındaki
   "tekrar gönder" hem de kayıt akışı bunu kullanır)
=========================================================== */
async function sendVerificationEmailRequest(email, name) {
  const body = { type: "verify", email };
  if (name) body.name = name;
  const r = await fetch('https://api.almancapratik.com/api/auth-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('Gönderim başarısız');
}

/* ===========================================================
   DOĞRULAMA BEKLEME EKRANI (OVERLAY)
=========================================================== */
let verifyPollInterval     = null;
let verifyPollAttempts     = 0;
let resendCooldownTimer    = null;
// Kayıt sırasında doğrulama e-postası gönderilemezse, overlay henüz
// oluşturulmamış olabilir. Bu bayrak overlay açıldığında okunur.
let pendingVerifyEmailWarning = null;

function setOverlayStatus(msg, tone = "info") {
  const el = document.getElementById("verify-overlay-status");
  if (!el) return;
  el.textContent = msg;
  el.style.color = tone === "warning" ? "#fbbf24" : tone === "error" ? "#f87171" : "rgba(255,255,255,.7)";
}

function showVerifyWaitingOverlay(user) {
  if (document.getElementById("verify-waiting-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "verify-waiting-overlay";
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(15,23,42,.94);
    display:flex; align-items:center; justify-content:center;
    z-index:9999; padding:24px; text-align:center;
  `;
  overlay.innerHTML = `
    <div style="max-width:400px; color:#fff; font-family:sans-serif;">
      <h2 style="margin:0 0 12px;">📧 E-postanı doğrula</h2>
      <p style="opacity:.85; line-height:1.6; margin:0 0 6px;">
        <strong>${escapeHtml(user.email)}</strong> adresine bir doğrulama bağlantısı gönderdik.
        Bağlantıya tıkladıktan sonra bu sayfa <strong>otomatik olarak devam edecek</strong>,
        tekrar giriş yapmana gerek yok.
      </p>
      <p id="verify-overlay-status" style="font-size:13px; opacity:.7; min-height:18px; margin:0 0 18px;"></p>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <button id="verifyCheckNowBtn" type="button" style="
          padding:10px; border:none; border-radius:8px;
          background:#2563eb; color:#fff; font-size:14px;
          font-weight:600; cursor:pointer;">Şimdi Kontrol Et</button>
        <button id="verifyResendBtn" type="button" style="
          padding:10px; border:1px solid rgba(255,255,255,.25); border-radius:8px;
          background:transparent; color:#fff; font-size:14px;
          cursor:pointer;">Doğrulama E-postasını Tekrar Gönder</button>
        <button id="verifySignOutBtn" type="button" style="
          padding:8px; border:none; background:transparent;
          color:rgba(255,255,255,.55); font-size:13px;
          text-decoration:underline; cursor:pointer;">Çıkış yap / farklı hesap kullan</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("verifyCheckNowBtn")
    .addEventListener("click", () => manualCheckNow(user));
  document.getElementById("verifyResendBtn")
    .addEventListener("click", (e) => handleResendClick(e.currentTarget, user.email));
  document.getElementById("verifySignOutBtn")
    .addEventListener("click", async () => {
      stopVerifyPolling();
      stopResendCooldown();
      try { await logoutFirebase(); } catch {}
      // user null olunca onAuthChange overlay'i zaten kaldırıp login ekranına döndürür
    });

  // Kayıt sırasında e-posta gönderimi başarısız olduysa burada bildir
  if (pendingVerifyEmailWarning) {
    setOverlayStatus(pendingVerifyEmailWarning, "warning");
    pendingVerifyEmailWarning = null;
  }
}

function hideVerifyWaitingOverlay() {
  document.getElementById("verify-waiting-overlay")?.remove();
}

async function manualCheckNow(user) {
  const btn = document.getElementById("verifyCheckNowBtn");
  if (!btn) return;
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Kontrol ediliyor...";
  try {
    await user.reload();
    if (user.emailVerified) {
      stopVerifyPolling();
      hideVerifyWaitingOverlay();
      proceedToApp(user);
      return;
    }
    setOverlayStatus("Henüz doğrulanmadı. Bağlantıya tıkladıktan sonra tekrar dene.", "warning");
  } catch (err) {
    console.error("[manualCheckNow] hata:", err);
    setOverlayStatus("Kontrol edilemedi. İnternet bağlantınızı kontrol edin.", "error");
  } finally {
    if (document.getElementById("verifyCheckNowBtn")) {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  }
}

function stopResendCooldown() {
  if (resendCooldownTimer) { clearInterval(resendCooldownTimer); resendCooldownTimer = null; }
}

async function handleResendClick(btn, email) {
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  const originalLabel = btn.textContent;
  btn.textContent = "Gönderiliyor...";

  const isOverlayBtn = btn.id === "verifyResendBtn";
  const reportStatus = (msg, tone) => {
    if (isOverlayBtn) setOverlayStatus(msg, tone);
    else showError("err-giris", msg);
  };

  try {
    await sendVerificationEmailRequest(email);
    reportStatus("✅ Doğrulama e-postası gönderildi. Gelen kutunuzu kontrol edin.", "info");
  } catch (err) {
    console.error("[handleResendClick] hata:", err);
    reportStatus("❌ Gönderilemedi. Lütfen birazdan tekrar dene.", "error");
  }

  // Spam'i / API kötüye kullanımını önlemek için butonu geri sayımla kilitle
  let remaining = RESEND_COOLDOWN_S;
  btn.textContent = `Tekrar gönder (${remaining}sn)`;
  stopResendCooldown();
  resendCooldownTimer = setInterval(() => {
    remaining -= 1;
    if (!btn.isConnected) { stopResendCooldown(); return; }
    if (remaining <= 0) {
      stopResendCooldown();
      btn.disabled = false;
      btn.textContent = originalLabel;
    } else {
      btn.textContent = `Tekrar gönder (${remaining}sn)`;
    }
  }, 1000);
}

function stopVerifyPolling() {
  if (verifyPollInterval) { clearInterval(verifyPollInterval); verifyPollInterval = null; }
  verifyPollAttempts = 0;
}

function startVerifyPolling(user) {
  if (verifyPollInterval) return;
  verifyPollAttempts = 0;
  verifyPollInterval = setInterval(async () => {
    verifyPollAttempts += 1;

    // Sonsuz polling'i engelle: belirli bir süre sonra otomatik kontrolü durdur.
    // "Şimdi Kontrol Et" butonu her zaman aktif kalmaya devam eder.
    if (verifyPollAttempts > VERIFY_POLL_MAX_ATTEMPTS) {
      stopVerifyPolling();
      setOverlayStatus("Otomatik kontrol durduruldu. Doğruladıysan \"Şimdi Kontrol Et\" butonuna bas.", "warning");
      return;
    }

    try {
      await user.reload();
      if (user.emailVerified) {
        stopVerifyPolling();
        hideVerifyWaitingOverlay();
        proceedToApp(user);
      }
    } catch (err) {
      // Kullanıcı silinmiş / token geçersiz olabilir — sessizce sonsuza kadar denemek yerine durdur
      console.error("[startVerifyPolling] hata:", err);
      stopVerifyPolling();
      setOverlayStatus("Oturum doğrulanamadı. Lütfen çıkış yapıp tekrar giriş yap.", "error");
    }
  }, VERIFY_POLL_INTERVAL_MS);
}

/* ===========================================================
   GİRİŞ SONRASI TEK YÖNLENDİRME NOKTASI — HER ZAMAN ANASAYFA
   Arayüz güncellemesi başarısız olsa bile yönlendirme MUTLAKA gerçekleşir
   (try/finally ile garanti altına alınmıştır).
=========================================================== */
function proceedToApp(user) {
  try {
    const loginView = document.getElementById("login-view");
    if (loginView) loginView.style.display = "none";

    const uv = document.getElementById("user-view");
    if (uv) uv.style.display = "flex";

    const nameEl   = document.getElementById("user-name");
    const emailEl  = document.getElementById("user-email");
    const avatarEl = document.getElementById("user-avatar");

    if (nameEl)  nameEl.textContent  = user.displayName || "Kullanıcı";
    if (emailEl) emailEl.textContent = user.email || "";
    if (avatarEl) {
      avatarEl.src = user.photoURL || "";
      avatarEl.alt = (user.displayName || "Kullanıcı") + " profil fotoğrafı";
      avatarEl.style.display = user.photoURL ? "block" : "none";
    }
  } catch (err) {
    console.error("[proceedToApp] Arayüz güncellenemedi, yine de yönlendiriliyor:", err);
  } finally {
    setTimeout(() => { window.location.href = "/"; }, 700);
  }
}

/* ===========================================================
   AUTH DURUM DİNLENMESİ
=========================================================== */
onAuthChange((user) => {
  if (!user) {
    hideVerifyWaitingOverlay();
    stopVerifyPolling();
    stopResendCooldown();
    return;
  }

  const isPasswordProvider = user.providerData?.[0]?.providerId === "password";
  if (isPasswordProvider && !user.emailVerified) {
    showVerifyWaitingOverlay(user);
    startVerifyPolling(user);
    return;
  }

  hideVerifyWaitingOverlay();
  stopVerifyPolling();
  proceedToApp(user);
});

/* ===========================================================
   DOM DİNLENMESİ
=========================================================== */
document.addEventListener("DOMContentLoaded", () => {

  const tabGiris  = document.getElementById("tab-giris");
  const tabKayit  = document.getElementById("tab-kayit");
  const formGiris = document.getElementById("form-giris");
  const formKayit = document.getElementById("form-kayit");

  function switchTab(active) {
    const isGiris = active === "giris";
    tabGiris?.classList.toggle("tab--active", isGiris);
    tabKayit?.classList.toggle("tab--active", !isGiris);
    if (formGiris) formGiris.style.display = isGiris  ? "flex" : "none";
    if (formKayit) formKayit.style.display = !isGiris ? "flex" : "none";
    ["err-giris", "err-kayit"].forEach(id => showError(id, ""));
  }

  tabGiris?.addEventListener("click", () => switchTab("giris"));
  tabKayit?.addEventListener("click", () => switchTab("kayit"));

  buildGoogleBtn("google-btn-giris", "Google ile Giriş Yap");
  buildGoogleBtn("google-btn-kayit", "Google ile Kayıt Ol");

  /* ---------- E-posta ile Giriş ---------- */
  const btnGiris  = document.getElementById("btn-giris");
  const spanGiris = btnGiris?.querySelector("span");

  btnGiris?.addEventListener("click", async () => {
    const email = document.getElementById("giris-email").value.trim();
    const pass  = document.getElementById("giris-sifre").value;
    showError("err-giris", "");

    if (!email || !pass) { showError("err-giris", "E-posta ve şifre zorunludur."); return; }
    if (!isValidEmail(email)) { showError("err-giris", "Geçersiz e-posta adresi."); return; }

    setLoading(btnGiris, spanGiris, true, "Giriş Yap");
    try {
      await loginWithEmail(email, pass);
      setLoading(btnGiris, spanGiris, false, "Giriş Yap");
      // Yönlendirme onAuthChange üzerinden proceedToApp ile yapılır.
    } catch (err) {
      setLoading(btnGiris, spanGiris, false, "Giriş Yap");

      if (err.code === "auth/email-not-verified") {
        const errEl = document.getElementById("err-giris");
        errEl.style.display = "block";
        errEl.innerHTML = `
          ⚠️ E-posta adresiniz doğrulanmamış.
          <button id="resendVerifyBtn" type="button" style="
            display:block; margin-top:8px; width:100%;
            padding:8px; border:none; border-radius:8px;
            background:#2563eb; color:#fff; font-size:13px;
            cursor:pointer; font-weight:500;
          ">Doğrulama e-postasını tekrar gönder</button>
        `;
        document.getElementById("resendVerifyBtn")
          .addEventListener("click", (e) => handleResendClick(e.currentTarget, email));
        return;
      }

      showError("err-giris", firebaseErrMsg(err.code));
    }
  });

  /* ---------- E-posta ile Kayıt ---------- */
  const btnKayit  = document.getElementById("btn-kayit");
  const spanKayit = btnKayit?.querySelector("span");

  btnKayit?.addEventListener("click", async () => {
    const name  = document.getElementById("kayit-ad").value.trim();
    const email = document.getElementById("kayit-email").value.trim();
    const pass  = document.getElementById("kayit-sifre").value;
    const pass2 = document.getElementById("kayit-sifre2").value;
    showError("err-kayit", "");

    if (!name || !email || !pass)  { showError("err-kayit", "Tüm alanlar zorunludur."); return; }
    if (!isValidEmail(email))      { showError("err-kayit", "Geçersiz e-posta adresi."); return; }
    if (pass !== pass2)            { showError("err-kayit", "Şifreler eşleşmiyor."); return; }
    if (pass.length < 6)           { showError("err-kayit", "Şifre en az 6 karakter olmalıdır."); return; }

    setLoading(btnKayit, spanKayit, true, "Kayıt Ol");

    // 1) Hesabı oluştur. Yalnızca BU adım başarısız olursa gerçek bir
    //    "kayıt başarısız" hatası göster — çünkü kullanıcı hesabı henüz yok.
    try {
      await registerWithEmail(email, pass, name);
    } catch (err) {
      setLoading(btnKayit, spanKayit, false, "Kayıt Ol");
      showError("err-kayit", firebaseErrMsg(err.code));
      return;
    }

    setLoading(btnKayit, spanKayit, false, "Kayıt Ol");
    // Bu noktadan itibaren hesap KESİN olarak oluşturuldu.
    // onAuthChange az sonra tetiklenip doğrulama ekranını (overlay) gösterecek.

    // 2) Doğrulama e-postası — başarısız olsa bile bunu "kayıt başarısız"
    //    olarak GÖSTERME (hesap zaten var, kullanıcı tekrar denerse
    //    "e-posta zaten kullanımda" hatasıyla karşılaşırdı). Bunun yerine
    //    overlay'de bir uyarı göster; kullanıcı "Tekrar Gönder" ile telafi edebilir.
    try {
      await sendVerificationEmailRequest(email, name);
    } catch (err) {
      console.error("[Kayıt] Doğrulama e-postası gönderilemedi:", err);
      pendingVerifyEmailWarning = "Doğrulama e-postası gönderilemedi. Aşağıdan tekrar gönderebilirsin.";
      setOverlayStatus(pendingVerifyEmailWarning, "warning"); // overlay zaten açıksa hemen göster
    }

    // 3) Hoş geldin e-postası — tamamen best-effort, kritik değil, akışı bloklamaz.
    fetch('https://api.almancapratik.com/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'AlmancaPratik - Hoş Geldin!',
        html: `<h2>Merhaba ${escapeHtml(name)},</h2><p>AlmancaPratik'e hoş geldin! Hesabın başarıyla oluşturuldu.</p>`
      })
    }).catch(err => console.error("[Kayıt] Hoş geldin e-postası gönderilemedi:", err));
  });

  /* ---------- Şifremi Unuttum ---------- */
  const forgotLink = document.getElementById("forgot-link");
  let forgotCooldown = false;

  forgotLink?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (forgotCooldown) return;

    const email = document.getElementById("giris-email").value.trim();
    if (!email) { showError("err-giris", "Önce e-posta adresinizi girin."); return; }
    if (!isValidEmail(email)) { showError("err-giris", "Geçersiz e-posta adresi."); return; }

    forgotCooldown = true;
    setTimeout(() => { forgotCooldown = false; }, RESEND_COOLDOWN_S * 1000);

    try {
      const r = await fetch('https://api.almancapratik.com/api/auth-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reset', email })
      });
      if (!r.ok) throw new Error('Gönderim başarısız');
      showError("err-giris", "✅ Şifre sıfırlama e-postası gönderildi.");
    } catch (err) {
      showError("err-giris", "Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  });

  /* ---------- Çıkış ---------- */
  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    try { await logoutFirebase(); } catch {}
    window.location.reload();
  });
});