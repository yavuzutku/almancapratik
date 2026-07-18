import { auth, logoutFirebase, onAuthChange } from "./firebase.js";

function requireAuth() {
  const isLocal = location.hostname === "127.0.0.1" || location.hostname === "localhost";
  onAuthChange((user) => {
    if (!user && !isLocal) window.location.href = "/login.html";
  });
}

/* ─────────────────────────────────────────────
   loadNavbar — YAN NAVBAR
   • Masaüstü: açılıp kapanabilir fixed sidebar
   • Kapalı mod: 64px, sadece ikonlar + hover tooltip
   • Mobil: hidden + top bar + hamburger
───────────────────────────────────────────── */
function loadNavbar() {
  if (document.getElementById("sideNav")) return;

  const p           = window.location.pathname;
  const isDersler   = p.includes("/dersler");
  const isBlog      = p.includes("/blog");
  const isMetin     = p.includes("/metin");
  const isArtikel   = p.includes("/artikel/");
  const isCumle     = p.includes("/cumlebul/");
  const isFiil      = p.includes("/fiil");
  const isQuiz      = p.includes("/quiz");
  const isKelimeler = p.includes("/kelimeler");

  const COLLAPSED_KEY = "sn_collapsed";
  let isCollapsed = localStorage.getItem(COLLAPSED_KEY) === "1";

  /* ══════════════════════════════════════════
     STYLES
  ══════════════════════════════════════════ */
  const style = document.createElement("style");
  style.textContent = `
    :root {
      --sn-w:        260px;
      --sn-cw:       64px;
      --sn-mobile-h: 58px;
      --sn-bg:       rgba(8,12,24,0.97);
      --sn-surf:     #171f33;
      --sn-surf-h:   rgba(34,42,61,0.70);
      --sn-border:   rgba(67,70,85,0.36);
      --sn-text:     #dae2fd;
      --sn-muted:    #6b7280;
      --sn-primary:  #b4c5ff;
      --sn-pc:       #2563eb;
      --sn-pc-on:    #eeefff;
      --sn-radius:   10px;
      --sn-tr:       0.17s ease;
      --sn-slide:    0.25s cubic-bezier(0.4,0,0.2,1);
    }

    body.has-sidenav {
      padding-left: var(--sn-w);
      min-height: 100vh;
      transition: padding-left var(--sn-slide);
    }
    body.has-sidenav.sn-col { padding-left: var(--sn-cw); }

    @media (max-width: 680px) {
      body.has-sidenav,
      body.has-sidenav.sn-col {
        padding-left: 0 !important;
        padding-top: var(--sn-mobile-h) !important;
      }
    }

    /* ── SHELL ── */
    #sideNav {
      position: fixed;
      inset: 0 auto 0 0;
      width: var(--sn-w);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      background: var(--sn-bg);
      backdrop-filter: blur(28px) saturate(180%);
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      border-right: 1px solid var(--sn-border);
      border-radius: 0 20px 20px 0;
      overflow: hidden;
      transition: width var(--sn-slide), transform 0.28s cubic-bezier(0.4,0,0.2,1);
    }
    #sideNav.sn-col { width: var(--sn-cw); }

    /* ── LOGO WRAP ── */
    .sn-logo-wrap {
      display: flex;
      align-items: center;
      padding: 14px 12px 13px;
      border-bottom: 1px solid var(--sn-border);
      flex-shrink: 0;
      min-height: 64px;
      gap: 6px;
    }
    .sn-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    .sn-brand-text {
      min-width: 0;
      overflow: hidden;
      max-width: 180px;
      transition: max-width var(--sn-slide), opacity 0.16s ease;
    }
    #sideNav.sn-col .sn-brand-text { max-width: 0; opacity: 0; }
    .sn-brand-name {
      display: block;
      font-family: 'Manrope', system-ui, sans-serif;
      font-size: 15px; font-weight: 800;
      color: var(--sn-text);
      letter-spacing: -0.03em;
      line-height: 1.15;
      white-space: nowrap;
    }
    .sn-brand-accent { color: var(--sn-primary); }
    .sn-brand-tag {
      display: block;
      font-family: 'Space Grotesk', monospace;
      font-size: 9px; font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--sn-muted);
      white-space: nowrap;
      margin-top: 2px;
    }

    /* ── TOGGLE BUTTON ── */
    .sn-toggle-btn {
      width: 30px; height: 30px;
      border-radius: 8px;
      background: transparent;
      border: 1px solid var(--sn-border);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--sn-muted);
      flex-shrink: 0;
      transition: background var(--sn-tr), color var(--sn-tr), border-color var(--sn-tr);
    }
    .sn-toggle-btn:hover {
      background: var(--sn-surf);
      color: var(--sn-text);
      border-color: rgba(100,116,139,0.5);
    }
    .sn-toggle-btn svg { transition: transform var(--sn-slide); }
    #sideNav.sn-col .sn-toggle-btn svg { transform: rotate(180deg); }

    /* Daraltılmışta logo alanını ortala */
    #sideNav.sn-col .sn-logo-wrap {
      justify-content: center;
      padding: 14px 10px 13px;
    }

    /* Daraltılmışta logo linkini gizle, sadece toggle btn göster */
    #sideNav.sn-col .sn-logo {
      display: none;
    }

    /* ── SCROLL ── */
    .sn-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 8px 4px;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .sn-scroll::-webkit-scrollbar { width: 3px; }
    .sn-scroll::-webkit-scrollbar-track { background: transparent; }
    .sn-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 3px; }

    /* ── NAV ITEM ── */
    .sn-item {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 9px 12px;
      border-radius: var(--sn-radius);
      font-family: 'Manrope', system-ui, sans-serif;
      font-size: 13px; font-weight: 600;
      color: rgba(195,198,215,0.72);
      text-decoration: none;
      cursor: pointer;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
      transition: background var(--sn-tr), color var(--sn-tr), padding var(--sn-slide), justify-content var(--sn-slide);
      letter-spacing: -0.01em;
      position: relative;
      white-space: nowrap;
    }
    .sn-ico {
      flex-shrink: 0;
      opacity: 0.6;
      min-width: 15px;
      transition: opacity var(--sn-tr);
    }
    .sn-item:hover { color: var(--sn-text); background: var(--sn-surf-h); }
    .sn-item:hover .sn-ico { opacity: 1; }

    .sn-item--active { color: var(--sn-primary); background: rgba(37,99,235,0.12); }
    .sn-item--active .sn-ico { opacity: 1; }
    .sn-item--active::before {
      content: '';
      position: absolute;
      left: 0; top: 22%; bottom: 22%;
      width: 3px;
      background: var(--sn-pc);
      border-radius: 0 3px 3px 0;
    }

    /* Label collapse */
    .sn-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      max-width: 180px;
      transition: max-width var(--sn-slide), opacity 0.14s ease;
    }
    #sideNav.sn-col .sn-label { max-width: 0; opacity: 0; }

    /* Chevron collapse */
    .sn-chevron {
      flex-shrink: 0;
      opacity: 0.3;
      max-width: 16px;
      overflow: hidden;
      transition: transform 0.22s ease, opacity var(--sn-tr), max-width var(--sn-slide);
    }
    .sn-group.open .sn-chevron { transform: rotate(180deg); opacity: 0.65; }
    #sideNav.sn-col .sn-chevron { max-width: 0; opacity: 0; }

    /* Daraltılmış item */
    #sideNav.sn-col .sn-item { padding: 10px; justify-content: center; }

    /* ── ACCORDION ── */
    .sn-sub {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.26s ease;
      padding-left: 6px;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .sn-group.open .sn-sub { max-height: 440px; }
    #sideNav.sn-col .sn-sub { max-height: 0 !important; }

    .sn-level-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border-radius: 9px;
      text-decoration: none;
      transition: background var(--sn-tr);
    }
    .sn-level-card:hover { background: var(--sn-surf-h); }
    .sn-lv-badge {
      font-family: 'Manrope', sans-serif;
      font-size: 10.5px; font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      flex-shrink: 0;
      min-width: 30px;
      text-align: center;
    }
    .lv-a1{background:rgba(34,197,94,0.10);border:1px solid rgba(34,197,94,0.20);color:#4ade80}
    .lv-a2{background:rgba(134,239,172,0.08);border:1px solid rgba(134,239,172,0.16);color:#86efac}
    .lv-b1{background:rgba(125,211,252,0.09);border:1px solid rgba(125,211,252,0.18);color:#7dd3fc}
    .lv-b2{background:rgba(165,180,252,0.09);border:1px solid rgba(165,180,252,0.18);color:#a5b4fc}
    .lv-c1{background:rgba(180,197,255,0.09);border:1px solid rgba(180,197,255,0.18);color:#b4c5ff}
    .sn-lv-title { font-family:'Manrope',sans-serif; font-size:12.5px; font-weight:600; color:rgba(218,226,253,0.82); line-height:1.2; }
    .sn-lv-sub { font-size:11px; color:var(--sn-muted); margin-top:1px; }

    .sn-all-link {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 10px; border-radius: 9px;
      font-size: 12px; font-weight: 600;
      color: rgba(195,198,215,0.42);
      text-decoration: none;
      transition: all var(--sn-tr);
      margin-top: 1px;
    }
    .sn-all-link:hover { background: var(--sn-surf-h); color: rgba(218,226,253,0.78); }

    .sn-divider { height: 1px; background: var(--sn-border); margin: 5px 4px; }

    /* ── ALT BAĞLANTILAR (Sponsorlar / Kullanım Koşulları / Gizlilik) ── */
    .sn-legal {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 8px;
      padding: 2px 10px 6px;
    }
    .sn-legal a {
      font-family: 'Manrope', system-ui, sans-serif;
      font-size: 11px;
      font-weight: 500;
      color: rgba(195,198,215,0.42);
      text-decoration: none;
      white-space: nowrap;
      transition: color var(--sn-tr);
    }
    .sn-legal a:hover { color: var(--sn-primary); }
    .sn-legal-dot {
      width: 2px; height: 2px; border-radius: 50%;
      background: rgba(195,198,215,0.3);
      flex-shrink: 0;
    }
    #sideNav.sn-col .sn-legal { display: none; }

    /* ── FOOTER ── */
    .sn-footer {
      padding: 10px 8px 14px;
      border-top: 1px solid var(--sn-border);
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;
    }

    .sn-cta {
      display: flex; align-items: center; justify-content: center; gap: 7px;
      padding: 10px 14px;
      background: var(--sn-pc); color: var(--sn-pc-on);
      font-family: 'Manrope', sans-serif; font-size: 12.5px; font-weight: 700;
      border-radius: 10px; text-decoration: none;
      overflow: hidden; white-space: nowrap;
      transition: filter var(--sn-tr), transform var(--sn-tr);
    }
    .sn-cta:hover { filter: brightness(1.14); transform: translateY(-1px); }
    .sn-cta-lbl {
      overflow: hidden; max-width: 160px;
      transition: max-width var(--sn-slide), opacity 0.14s ease;
    }
    #sideNav.sn-col .sn-cta-lbl { max-width: 0; opacity: 0; }
    #sideNav.sn-col .sn-cta { padding: 10px; }

    .sn-login-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 12px;
      background: transparent; border: 1px solid var(--sn-border);
      border-radius: 10px;
      color: rgba(195,198,215,0.7);
      font-family: 'Manrope', sans-serif; font-size: 12.5px; font-weight: 600;
      text-decoration: none; cursor: pointer;
      overflow: hidden; white-space: nowrap;
      transition: background var(--sn-tr), color var(--sn-tr);
    }
    .sn-login-btn:hover { background: var(--sn-surf); color: var(--sn-text); }
    .sn-login-lbl { overflow: hidden; max-width: 140px; transition: max-width var(--sn-slide), opacity 0.14s ease; }
    #sideNav.sn-col .sn-login-lbl { max-width: 0; opacity: 0; }
    #sideNav.sn-col .sn-login-btn { padding: 9px; justify-content: center; }

    .sn-profile-wrap { position: relative; }
    .sn-profile-trigger {
      display: flex; align-items: center; gap: 9px;
      padding: 7px 10px;
      background: transparent; border: 1px solid var(--sn-border);
      border-radius: 10px; cursor: pointer; width: 100%;
      overflow: hidden;
      transition: background var(--sn-tr), gap var(--sn-slide), padding var(--sn-slide);
    }
    .sn-profile-trigger:hover { background: var(--sn-surf); }
    .sn-avatar {
      width: 30px; height: 30px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      border: 1.5px solid rgba(180,197,255,0.2);
      display: block;
    }
    .sn-profile-info {
      flex: 1; min-width: 0; text-align: left;
      overflow: hidden; max-width: 140px;
      transition: max-width var(--sn-slide), opacity 0.14s ease;
    }
    #sideNav.sn-col .sn-profile-info { max-width: 0; opacity: 0; }
    #sideNav.sn-col .sn-profile-trigger {
      padding: 7px;
      justify-content: center;
      gap: 0;
    }
    .sn-profile-lbl { display:block; font-family:'Space Grotesk',monospace; font-size:9px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--sn-muted); white-space:nowrap; }
    .sn-profile-email { display:block; font-size:11.5px; font-weight:500; color:rgba(195,198,215,0.7); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sn-profile-caret { flex-shrink:0; opacity:0.3; max-width:16px; overflow:hidden; transition:max-width var(--sn-slide); }
    #sideNav.sn-col .sn-profile-caret { max-width:0; }

    .sn-profile-drop {
      position: absolute; bottom: calc(100% + 8px); left: 0; right: 0;
      min-width: 180px;
      background: #090f1d; border: 1px solid var(--sn-border);
      border-radius: 12px; padding: 5px;
      box-shadow: 0 -18px 40px rgba(0,0,0,0.6);
      display: none; z-index: 20;
    }
    .sn-profile-drop.open { display: block; }
    #sideNav.sn-col .sn-profile-drop { left: calc(var(--sn-cw) + 8px); bottom: 0; right: auto; width: 180px; }

    .sn-logout-btn {
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 9px 12px;
      background: transparent; border: none; border-radius: 8px;
      font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 500;
      color: rgba(240,112,104,0.72); cursor: pointer; text-align: left; white-space: nowrap;
      transition: background var(--sn-tr), color var(--sn-tr);
    }
    .sn-logout-btn:hover { background: rgba(240,112,104,0.09); color: #f07068; }

    /* ── TOOLTIP (daraltılmış mod) ── */
    #snTooltip {
      position: fixed;
      background: #1a2540;
      border: 1px solid rgba(67,70,85,0.6);
      color: #dae2fd;
      padding: 5px 11px;
      border-radius: 8px;
      font-family: 'Manrope', system-ui, sans-serif;
      font-size: 12px; font-weight: 600;
      letter-spacing: -0.01em;
      white-space: nowrap;
      pointer-events: none;
      z-index: 9999;
      display: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.45);
      transform: translateY(-50%);
    }
    #snTooltip::before {
      content: '';
      position: absolute;
      right: 100%; top: 50%; transform: translateY(-50%);
      border: 5px solid transparent;
      border-right-color: rgba(67,70,85,0.6);
    }
    #snTooltip::after {
      content: '';
      position: absolute;
      right: calc(100% - 1px); top: 50%; transform: translateY(-50%);
      border: 5px solid transparent;
      border-right-color: #1a2540;
    }

    /* ── MOBİL TOP BAR ── */
    #snMobileBar {
      display: none;
      position: fixed; top: 0; left: 0; right: 0;
      height: var(--sn-mobile-h);
      z-index: 1001;
      background: rgba(8,12,24,0.95);
      backdrop-filter: blur(22px) saturate(180%);
      border-bottom: 1px solid var(--sn-border);
      padding: 0 16px;
      align-items: center;
      justify-content: space-between;
    }
    .sn-hamburger {
      display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 5px;
      width: 40px; height: 40px;
      background: transparent; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px; cursor: pointer; padding: 0;
      -webkit-tap-highlight-color: transparent; touch-action: manipulation; flex-shrink: 0;
      transition: border-color var(--sn-tr);
    }
    .sn-hamburger span { display:block; width:18px; height:1.5px; background:rgba(218,226,253,0.7); border-radius:2px; transition:all 0.24s ease; transform-origin:center; }
    .sn-hamburger:hover { border-color: rgba(255,255,255,0.22); }
    .sn-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
    .sn-hamburger.open span:nth-child(2) { opacity:0; transform:scaleX(0); }
    .sn-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

    #snOverlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:999; backdrop-filter:blur(2px); }
    #snOverlay.visible { display:block; }

    @media (max-width: 680px) {
      #sideNav {
        transform: translateX(-100%); top: 0; height: 100dvh; z-index: 1002;
        width: min(var(--sn-w), 86vw) !important;
        border-radius: 0 20px 20px 0;
      }
      #sideNav.mobile-open { transform: translateX(0); }
      #snMobileBar { display: flex; }
      .sn-toggle-btn { display: none !important; }
    }

    /* ── FAB: MAVİ TEMA ── */
    .fab-main { background:linear-gradient(140deg,#1d4ed8,#3b82f6)!important; color:#eeefff!important; box-shadow:0 4px 24px rgba(37,99,235,0.45)!important; }
    .fab-wrapper.active .fab-main { background:rgba(239,68,68,0.88)!important; box-shadow:0 4px 20px rgba(239,68,68,0.35)!important; }
    .fab-item-content { background:#0c1424!important; border-color:rgba(37,99,235,0.4)!important; color:#93c5fd!important; }
    .fab-label { background:#1d4ed8!important; color:#eeefff!important; box-shadow:0 4px 10px rgba(0,0,0,0.35)!important; }
    .fab-label::after { border-color:#1d4ed8 transparent transparent transparent!important; }
    .item-4 .fab-label::after { border-color:transparent transparent transparent #1d4ed8!important; }
    @media (hover:hover) { .fab-item:hover .fab-item-content { background:#2563eb!important; color:#eeefff!important; } }
    @media (hover:none)  { .fab-item:active .fab-item-content { background:#2563eb!important; color:#eeefff!important; } }
  `;
  document.head.appendChild(style);

  document.body.classList.add("has-sidenav");
  if (isCollapsed) document.body.classList.add("sn-col");

  /* ══════════════════════════════════════════
     SIDE NAV HTML
  ══════════════════════════════════════════ */
  const sidenav = document.createElement("aside");
  sidenav.id = "sideNav";
  sidenav.setAttribute("aria-label", "Ana gezinti");
  if (isCollapsed) sidenav.classList.add("sn-col");

  const mkItem = (href, label, active, svgInner) => `
    <a class="sn-item${active ? " sn-item--active" : ""}" href="${href}" data-label="${label}">
      <svg class="sn-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgInner}</svg>
      <span class="sn-label">${label}</span>
    </a>`;

  sidenav.innerHTML = `
    <div class="sn-logo-wrap">
      <a class="sn-logo" href="/" aria-label="AlmancaPratik ana sayfa">
        <div class="sn-brand-text">
          <span class="sn-brand-name">Almanca<span class="sn-brand-accent">Pratik</span></span>
          <span class="sn-brand-tag">Türkçe · Ücretsiz · A1–C1</span>
        </div>
      </a>
      <button class="sn-toggle-btn" id="snToggleBtn" aria-label="Menüyü daralt veya genişlet">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
    </div>

    <div class="sn-scroll" role="navigation" aria-label="Sayfa gezintisi">

      <div class="sn-group${isDersler ? " open" : ""}" id="snDerslerGroup">
        <button class="sn-item${isDersler ? " sn-item--active" : ""}" id="snDerslerToggle"
          aria-expanded="${isDersler ? "true" : "false"}" aria-controls="snDerslerSub" data-label="Dersler">
          <svg class="sn-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          <span class="sn-label">Dersler</span>
          <svg class="sn-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div class="sn-sub" id="snDerslerSub">
          <a class="sn-level-card" href="/dersler/?cat=A1"><span class="sn-lv-badge lv-a1">A1</span><div><div class="sn-lv-title">Başlangıç</div><div class="sn-lv-sub">Temel kelimeler</div></div></a>
          <a class="sn-level-card" href="/dersler/?cat=A2"><span class="sn-lv-badge lv-a2">A2</span><div><div class="sn-lv-title">Temel</div><div class="sn-lv-sub">Günlük konuşma</div></div></a>
          <a class="sn-level-card" href="/dersler/?cat=B1"><span class="sn-lv-badge lv-b1">B1</span><div><div class="sn-lv-title">Orta</div><div class="sn-lv-sub">Karmaşık cümleler</div></div></a>
          <a class="sn-level-card" href="/dersler/?cat=B2"><span class="sn-lv-badge lv-b2">B2</span><div><div class="sn-lv-title">Üst Orta</div><div class="sn-lv-sub">İleri gramer</div></div></a>
          <a class="sn-level-card" href="/dersler/?cat=C1"><span class="sn-lv-badge lv-c1">C1</span><div><div class="sn-lv-title">İleri</div><div class="sn-lv-sub">Akademik Almanca</div></div></a>
          <div class="sn-divider"></div>
          <a class="sn-all-link" href="/dersler/">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Tüm Dersleri Gör
          </a>
        </div>
      </div>

      ${mkItem("/metin/", "Metin Analizi", isMetin, '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>')}
      ${mkItem("/artikel/", "Artikel Bulucu", isArtikel, '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>')}
      ${mkItem("/cumlebul/", "Cümle Örnekleri", isCumle, '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')}
      ${mkItem("/fiil/", "Fiil Çekimleme", isFiil, '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>')}
      ${mkItem("/quiz/", "Kelime Quizi", isQuiz, '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>')}
      ${mkItem("/kelimeler/", "Kelimelerim", isKelimeler, '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>')}

      <div class="sn-divider"></div>

      ${mkItem("/blog/", "Blog", isBlog, '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>')}
    </div>

    <div class="sn-footer">
      <a class="sn-cta" href="/seviyeler/seviyetespit/" data-label="Seviye Testi">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
          <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
        </svg>
        <span class="sn-cta-lbl">Seviye Testi — Ücretsiz</span>
      </a>

      <a class="sn-login-btn" id="snLoginBtn" href="/login.html" data-label="Giriş Yap">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        <span class="sn-login-lbl">Giriş Yap</span>
      </a>

      <div class="sn-profile-wrap" id="snProfileWrap" style="display:none">
        <button class="sn-profile-trigger" id="snProfileTrigger" aria-label="Profil menüsü" aria-expanded="false">
          <img class="sn-avatar" id="snAvatarImg"
            src="https://ui-avatars.com/api/?name=U&background=131b2e&color=b4c5ff&size=64" alt="Profil">
          <div class="sn-profile-info">
            <span class="sn-profile-lbl">Giriş yapıldı</span>
            <span class="sn-profile-email" id="snProfileEmail">Yükleniyor...</span>
          </div>
          <svg class="sn-profile-caret" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div class="sn-profile-drop" id="snProfileDrop" role="menu">
          <button class="sn-logout-btn" id="snLogoutBtn" role="menuitem">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Çıkış Yap
          </button>
        </div>
      </div>

      <nav class="sn-legal" aria-label="Yasal bağlantılar">
        <a href="/sponsorlar/">Sponsorlar</a>
        <span class="sn-legal-dot"></span>
        <a href="/kullanim-sartlari.html">Kullanım Koşulları</a>
        <span class="sn-legal-dot"></span>
        <a href="/privacy.html">Gizlilik</a>
      </nav>
    </div>
  `;

  document.body.prepend(sidenav);

  /* ── Mobil Top Bar ── */
  const mobileBar = document.createElement("div");
  mobileBar.id = "snMobileBar";
  mobileBar.innerHTML = `
    <a href="/" style="display:flex;align-items:center;gap:9px;text-decoration:none;">
      <span class="sn-brand-name" style="font-size:14px;">Almanca<span class="sn-brand-accent">Pratik</span></span>
    </a>
    <button class="sn-hamburger" id="snHamburger" aria-label="Menüyü aç" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  `;
  document.body.prepend(mobileBar);

  const overlay = document.createElement("div");
  overlay.id = "snOverlay";
  document.body.appendChild(overlay);

  /* ── Tooltip ── */
  const tooltip = document.createElement("div");
  tooltip.id = "snTooltip";
  document.body.appendChild(tooltip);

  /* ══════════════════════════════════════════
     ETKİLEŞİM
  ══════════════════════════════════════════ */

  /* Toggle: daralt / genişlet */
  function collapseNav() {
    sidenav.classList.add("sn-col");
    document.body.classList.add("sn-col");
    localStorage.setItem(COLLAPSED_KEY, "1");
    isCollapsed = true;
    /* Açık accordion'u kapat (daraltılmışta gösteremeyiz) */
    document.getElementById("snDerslerGroup")?.classList.remove("open");
    tooltip.style.display = "none";
  }
  function expandNav() {
    sidenav.classList.remove("sn-col");
    document.body.classList.remove("sn-col");
    localStorage.setItem(COLLAPSED_KEY, "0");
    isCollapsed = false;
    tooltip.style.display = "none";
  }

  document.getElementById("snToggleBtn").addEventListener("click", () => {
    isCollapsed ? expandNav() : collapseNav();
  });

  /* Tooltip: daraltılmış mod ikonlar */
  sidenav.querySelectorAll("[data-label]").forEach((item) => {
    item.addEventListener("mouseenter", () => {
      if (!isCollapsed || window.innerWidth <= 680) return;
      const label = item.dataset.label;
      const rect  = item.getBoundingClientRect();
      tooltip.textContent    = label;
      tooltip.style.left     = (rect.right + 10) + "px";
      tooltip.style.top      = (rect.top + rect.height / 2) + "px";
      tooltip.style.display  = "block";
    });
    item.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });
    item.addEventListener("click",      () => { tooltip.style.display = "none"; });
  });

  /* Dersler accordion */
  const derslerGroup  = document.getElementById("snDerslerGroup");
  const derslerToggle = document.getElementById("snDerslerToggle");
  derslerToggle.addEventListener("click", () => {
    if (isCollapsed) {
      expandNav();
      setTimeout(() => {
        derslerGroup.classList.add("open");
        derslerToggle.setAttribute("aria-expanded", "true");
      }, 60);
      return;
    }
    const open = derslerGroup.classList.toggle("open");
    derslerToggle.setAttribute("aria-expanded", String(open));
  });

  /* Mobil hamburger */
  const hamburger  = document.getElementById("snHamburger");
  const navOverlay = document.getElementById("snOverlay");

  function openMobile() {
    sidenav.classList.add("mobile-open");
    hamburger.classList.add("open");
    navOverlay.classList.add("visible");
    hamburger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeMobile() {
    sidenav.classList.remove("mobile-open");
    hamburger.classList.remove("open");
    navOverlay.classList.remove("visible");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  hamburger.addEventListener("click", () => {
    sidenav.classList.contains("mobile-open") ? closeMobile() : openMobile();
  });
  navOverlay.addEventListener("click", closeMobile);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeMobile(); tooltip.style.display = "none"; }
  });
  sidenav.querySelectorAll("a:not(.sn-all-link):not(.sn-level-card)").forEach((link) => {
    link.addEventListener("click", () => { if (window.innerWidth <= 680) closeMobile(); });
  });

  /* Profil dropdown */
  const profileTrigger = document.getElementById("snProfileTrigger");
  const profileDrop    = document.getElementById("snProfileDrop");
  if (profileTrigger) {
    profileTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = profileDrop.classList.toggle("open");
      profileTrigger.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (!profileDrop.contains(e.target) && e.target !== profileTrigger) {
        profileDrop.classList.remove("open");
        profileTrigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Logout */
  document.getElementById("snLogoutBtn")?.addEventListener("click", async () => {
    try { await logoutFirebase(); } catch (e) { console.error(e); }
    finally { window.location.href = "/"; }
  });

  /* ── AUTH STATE ── */
  onAuthChange((user) => {
    const loginBtn  = document.getElementById("snLoginBtn");
    const profileWr = document.getElementById("snProfileWrap");
    if (!loginBtn || !profileWr) return;

    if (user) {
      loginBtn.style.display  = "none";
      profileWr.style.display = "block";

      const emailEl = document.getElementById("snProfileEmail");
      if (emailEl) emailEl.textContent = user.email || user.displayName || "Kullanıcı";

      const name = user.displayName || user.email || "U";
      const src  = user.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=131b2e&color=b4c5ff&size=64&bold=true`;
      const img = document.getElementById("snAvatarImg");
      if (img) img.src = src;
    } else {
      loginBtn.style.display  = "flex";
      profileWr.style.display = "none";
    }
  });
}

/* ─────────────────────────────────────────────
   loadFloatingMenu — Radyal FAB (mavi tema)
───────────────────────────────────────────── */
function loadFloatingMenu() {
  if (document.getElementById("globalFab")) return;

  function fabItem(href, label, cls, svgPath) {
    return `
      <a href="${href}" class="fab-item ${cls}" aria-label="${label}">
        <div class="fab-item-content">
          <span class="fab-label">${label}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            ${svgPath}
          </svg>
        </div>
      </a>`;
  }

  const fabContainer = document.createElement("div");
  fabContainer.className = "fab-wrapper";
  fabContainer.id = "globalFab";

  fabContainer.innerHTML = `
    ${fabItem("/kelimeler/", "Kelimelerim", "item-1",
      '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>')}
    ${fabItem("/wordsadd/", "Yeni Kelime", "item-2",
      '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>')}
    ${fabItem("/quiz/", "Quiz", "item-3",
      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>')}
    ${fabItem("/notlarim/", "Notlarım", "item-4",
      '<path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><polyline points="15 3 15 9 21 9"/>')}
    <button class="fab-main" id="fabToggle" aria-label="Hızlı menü" aria-expanded="false">+</button>
  `;
  document.body.appendChild(fabContainer);

  const toggleBtn = document.getElementById("fabToggle");
  const open  = () => { fabContainer.classList.add("active");    toggleBtn.setAttribute("aria-expanded","true");  };
  const close = () => { fabContainer.classList.remove("active"); toggleBtn.setAttribute("aria-expanded","false"); };

  toggleBtn.addEventListener("click", (e) => { e.stopPropagation(); fabContainer.classList.contains("active") ? close() : open(); });
  document.addEventListener("click",  (e) => { if (!fabContainer.contains(e.target)) close(); });
  document.addEventListener("keydown",(e) => { if (e.key === "Escape") close(); });
  fabContainer.querySelectorAll(".fab-item").forEach((item) => item.addEventListener("click", () => setTimeout(close, 150)));
}

function getUserId() {
  return auth.currentUser ? auth.currentUser.uid : null;
}

loadFloatingMenu();

export { requireAuth, loadNavbar, getUserId };
window.requireAuth = requireAuth;
window.loadNavbar  = loadNavbar;
window.getUserId   = getUserId;