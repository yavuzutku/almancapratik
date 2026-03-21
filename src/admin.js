/**
 * src/admin.js
 * ─────────────────────────────────────────────
 * Merkezi admin yönetim modülü.
 *
 * Kullanım:
 *
 *   import { isAdmin, onAdminChange, requireAdmin } from '../src/admin.js';
 *
 *   // Anlık kontrol (auth durumu biliniyorsa):
 *   if (isAdmin()) { ... }
 *
 *   // Auth değişimini dinle:
 *   onAdminChange((adminStatus, user) => {
 *     if (adminStatus) showAdminPanel();
 *     else hideAdminPanel();
 *   });
 *
 *   // Sayfayı tamamen koru (admin değilse yönlendir):
 *   
 */

import { onAuthChange } from '../js/firebase.js';

/* ── Admin e-posta listesi — tek kaynak ── */
export const ADMIN_EMAILS = [
  "yavuzutku144@gmail.com",
  "almancapratik80@gmail.com",
];

/* ── İç state ── */
let _currentUser   = null;
let _isAdmin       = false;
let _listeners     = [];
let _authResolved  = false;

/* ── Auth dinleyicisi (modül yüklenince otomatik başlar) ── */
onAuthChange((user) => {
  _currentUser  = user;
  _isAdmin      = !!(user && ADMIN_EMAILS.includes(user.email));
  _authResolved = true;
  _listeners.forEach(fn => fn(_isAdmin, user));
});

/* ─────────────────────────────────────────────
   isAdmin()
   Anlık admin durumunu döndürür (boolean).
   Auth henüz çözülmediyse false döner.
───────────────────────────────────────────── */
export function isAdmin() {
  return _isAdmin;
}

/* ─────────────────────────────────────────────
   getCurrentAdminUser()
   Admin ise aktif Firebase user objesini,
   değilse null döndürür.
───────────────────────────────────────────── */
export function getCurrentAdminUser() {
  return _isAdmin ? _currentUser : null;
}

/* ─────────────────────────────────────────────
   onAdminChange(callback)
   Auth durumu değiştiğinde çağrılır.
   callback(isAdmin: boolean, user: FirebaseUser|null)
   Modül yüklendiğinde auth zaten çözüldüyse
   hemen çağrılır.
───────────────────────────────────────────── */
export function onAdminChange(callback) {
  _listeners.push(callback);
  if (_authResolved) callback(_isAdmin, _currentUser);
  return () => {
    _listeners = _listeners.filter(fn => fn !== callback);
  };
}

/* ─────────────────────────────────────────────
   requireAdmin(options?)
   Admin değilse belirtilen URL'e yönlendirir
   veya varsayılan "erişim reddedildi" UI'ını gösterir.

   options: {
     redirectTo?: string,       // yönlendirilecek URL
     showDeniedId?: string,     // gösterilecek element id'si
     showContentId?: string,    // gizlenecek içerik id'si
   }
───────────────────────────────────────────── */
export function requireAdmin({
  redirectTo    = null,
  showDeniedId  = "accessDenied",
  showContentId = null,
} = {}) {
  onAdminChange((adminStatus, user) => {
    if (adminStatus) {
      /* Admin — içeriği göster */
      if (showDeniedId) {
        const el = document.getElementById(showDeniedId);
        if (el) el.style.display = "none";
      }
      if (showContentId) {
        const el = document.getElementById(showContentId);
        if (el) el.style.display = "flex";
      }
    } else {
      /* Admin değil */
      if (redirectTo) {
        window.location.href = redirectTo;
        return;
      }
      if (showDeniedId) {
        const el = document.getElementById(showDeniedId);
        if (el) el.style.display = "flex";
      }
      if (showContentId) {
        const el = document.getElementById(showContentId);
        if (el) el.style.display = "none";
      }
    }
  });
}

/* ─────────────────────────────────────────────
   showIfAdmin(elementId)
   Verilen id'li elementi admin ise gösterir,
   değilse gizler. Tekrarlayan pattern için
   kısayol.
───────────────────────────────────────────── */
export function showIfAdmin(elementId, display = "flex") {
  onAdminChange((adminStatus) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.style.display = adminStatus ? display : "none";
    if (adminStatus && typeof el._adminClickBound === "undefined") {
      el._adminClickBound = true;
    }
  });
}

/* ─────────────────────────────────────────────
   adminBadgeHtml()
   Navbar / başlık için admin rozeti HTML'i döndürür.
───────────────────────────────────────────── */
export function adminBadgeHtml() {
  return `<span class="admin-badge">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    Admin
  </span>`;
}