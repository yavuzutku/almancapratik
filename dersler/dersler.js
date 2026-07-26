import { onAdminChange } from "../src/admin.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, getDoc,
  doc, deleteDoc, query, orderBy, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ── Firebase ── */
const firebaseConfig = {
  apiKey:            "AIzaSyCGpRMUNNSx4Kla2YrmDOBHlLSt4rOM1wQ",
  authDomain:        "lernen-deutsch-bea69.firebaseapp.com",
  projectId:         "lernen-deutsch-bea69",
  storageBucket:     "lernen-deutsch-bea69.firebasestorage.app",
  messagingSenderId: "653560965391",
  appId:             "1:653560965391:web:545142e9be6d130a54b67a"
};
const app = getApps().find(a => a.name === "[DEFAULT]") || initializeApp(firebaseConfig);
const db  = getFirestore(app);
const LESSONS_COL = collection(db, "lessons");

/* ── State ── */
let isAdmin          = false;
let currentUser      = null;
let deleteTargetId   = null;
let activeCatFilter  = "all";
let activeTypeFilter = "all";
let searchTerm       = "";
let allLessons       = [];
let _currentLessonId = null;

/* ── Ders "tamamlandı/okundu" takibi (tarayıcı yerel depolama, giriş gerektirmez) ── */
const COMPLETED_KEY = "ap_completed_lessons";
function getCompletedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(COMPLETED_KEY)) || []); }
  catch { return new Set(); }
}
function markLessonCompleted(lesson) {
  const key = lesson.slug || lesson.id;
  if (!key) return;
  const set = getCompletedSet();
  set.add(key);
  try { localStorage.setItem(COMPLETED_KEY, JSON.stringify([...set])); } catch {}
}
function isLessonCompleted(lesson) {
  const key = lesson.slug || lesson.id;
  return key ? getCompletedSet().has(key) : false;
}

/* ── Admin dinle ── */
onAdminChange((adminStatus, user) => {
  isAdmin     = adminStatus;
  currentUser = user;
});

/* ══════════════════════════════════════════════
   VIEW YÖNETİMİ + URL ROUTING
══════════════════════════════════════════════ */
/* Ders sayfası artık /dersler/ders-adi şeklinde GERÇEK bir yol (path) kullanır,
   ?ders= gibi bir sorgu parametresi değil. Bu hem link olarak daha temiz görünür
   hem de Google'ın dersleri ayrı birer sayfa olarak algılamasına yardımcı olur.
   Eski ?ders= / ?id= linkleri de geriye dönük çalışmaya devam eder (aşağıda). */
function showView(id, urlParams = {}) {
  ["viewList","viewLesson"].forEach(v => {
    document.getElementById(v).classList.toggle("active", v === id);
  });
  window.scrollTo(0, 0);
  const url = new URL(window.location.href);
  url.search = "";
  url.pathname = "/dersler/";

  if (id === "viewLesson" && urlParams.slug) {
    url.pathname = "/dersler/" + encodeURIComponent(urlParams.slug);
  } else if (id === "viewLesson" && !urlParams.slug && urlParams.id) {
    url.searchParams.set("id", urlParams.id);
  }
  history.pushState({ view: id, ...urlParams }, "", url.toString());
}

function getSlugFromPath() {
  const m = window.location.pathname.match(/^\/dersler\/([^\/?#]+)\/?$/);
  if (!m) return null;
  const decoded = decodeURIComponent(m[1]);
  /* index.html ya da boş segment gibi durumları göz ardı et */
  if (!decoded || decoded === "index.html") return null;
  return decoded;
}

window.addEventListener("popstate", () => {
  const p        = new URLSearchParams(window.location.search);
  const pathSlug = getSlugFromPath();
  const slug     = pathSlug || p.get("ders");
  const id       = p.get("id");
  if (slug)       loadLessonBySlug(slug);
  else if (id)    loadLessonById(id);
  else { showViewOnly("viewList"); loadLessons(); resetSeoTags(); }
});

function showViewOnly(id) {
  ["viewList","viewLesson"].forEach(v => {
    document.getElementById(v).classList.toggle("active", v === id);
  });
  window.scrollTo(0, 0);
}

/* ══════════════════════════════════════════════
   SEVİYE AKORDEONU (sağ sütun)
══════════════════════════════════════════════ */
const LEVEL_LABELS = { A1: "Başlangıç", A2: "Temel", B1: "Orta", B2: "Üst Orta", C1: "İleri" };
let expandedLevel = "A1";

function buildLevelAccordion(lessons) {
  const wrap = document.getElementById("levelAccordion");
  if (!wrap) return;
  const stdCats = ["A1","A2","B1","B2","C1"];

  wrap.innerHTML = stdCats.map(cat => {
    const inLevel = lessons.filter(l => l.category === cat);
    const isOpen  = expandedLevel === cat;
    const body = inLevel.length
      ? inLevel.map(l => `<button type="button" class="level-acc-lesson" data-id="${esc(l.id)}">${esc(l.title || "Başlıksız")}</button>`).join("")
      : `<div class="level-acc-empty">Yakında</div>`;
    return `
      <div class="level-acc-item${isOpen ? " open" : ""}" data-cat="${cat}">
        <button type="button" class="level-acc-header" data-cat="${cat}">
          <span class="level-acc-badge">${cat}</span>
          <span class="level-acc-label">${LEVEL_LABELS[cat]}</span>
          <svg class="level-acc-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="level-acc-body">${body}</div>
      </div>`;
  }).join("");

  wrap.querySelectorAll(".level-acc-header").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      if (expandedLevel === cat) { expandedLevel = null; setCatFilter("all"); }
      else { expandedLevel = cat; setCatFilter(cat); }
    });
  });
  wrap.querySelectorAll(".level-acc-lesson").forEach(btn => {
    btn.addEventListener("click", () => {
      const lesson = allLessons.find(l => l.id === btn.dataset.id);
      if (lesson) { if (lesson.isStatic) window.location.href = `/dersler/${encodeURIComponent(lesson.slug)}/`; else openLesson(lesson); }
    });
  });
}

function setCatFilter(cat) {
  activeCatFilter = cat;
  const filtered = filterLessons(allLessons);
  updateLessonsCount(filtered.length);
  renderLessons(filtered);
  buildLevelAccordion(isAdmin ? allLessons : allLessons.filter(l => l.published));
}

function filterLessons(lessons) {
  let out = activeCatFilter === "all" ? lessons : lessons.filter(l => l.category === activeCatFilter);
  if (activeTypeFilter !== "all") out = out.filter(l => l.type === activeTypeFilter);
  if (searchTerm) {
    const q = searchTerm.toLocaleLowerCase("tr");
    out = out.filter(l =>
      (l.title || "").toLocaleLowerCase("tr").includes(q) ||
      (l.excerpt || "").toLocaleLowerCase("tr").includes(q)
    );
  }
  return out;
}

/* ── Tür pilleri: Kültür / İletişim / Gramer / Tüm Dersler ── */
function setTypeFilter(type) {
  if (type === "all") { activeTypeFilter = "all"; activeCatFilter = "all"; expandedLevel = null; }
  else activeTypeFilter = type;
  document.querySelectorAll(".type-pill").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.type === (type === "all" ? "all" : activeTypeFilter))
  );
  const filtered = filterLessons(allLessons);
  updateLessonsCount(filtered.length);
  renderLessons(filtered, (isAdmin ? allLessons : allLessons.filter(l => l.published)).length);
  buildLevelAccordion(isAdmin ? allLessons : allLessons.filter(l => l.published));
}
document.querySelectorAll(".type-pill").forEach(btn => {
  btn.addEventListener("click", () => setTypeFilter(btn.dataset.type));
});
window.setTypeFilter = setTypeFilter;

/* ── Tarih yardımcı fonksiyonu: Firestore Timestamp'i de,
   statik manifest'ten gelen düz ISO string tarihi de anlar ── */
function getLessonDate(lesson) {
  if (lesson.createdAt?.toDate) return lesson.createdAt.toDate();
  if (lesson.createdAt) {
    const d = new Date(lesson.createdAt);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function updateLessonsCount(n) {
  const el = document.getElementById("lessonsCount");
  if (el) el.textContent = n ? `${n} ders` : "";
}

function renderSkeletonCards(n = 6) {
  return Array.from({ length: n }).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-cover"></div>
      <div class="skeleton-body">
        <div class="skeleton-line skeleton-line--meta"></div>
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line skeleton-line--excerpt1"></div>
        <div class="skeleton-line skeleton-line--excerpt2"></div>
      </div>
    </div>`).join("");
}

document.getElementById("lessonSearchInput")?.addEventListener("input", (e) => {
  searchTerm = e.target.value.trim();
  const filtered = filterLessons(allLessons);
  updateLessonsCount(filtered.length);
  renderLessons(filtered);
});

/* ── Komut paleti hissi: Ctrl+K / ⌘K ile aramaya odaklan ── */
(function initSearchShortcut() {
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const hint  = document.getElementById("searchKbdHint");
  if (hint) hint.textContent = isMac ? "⌘K" : "Ctrl K";
  document.addEventListener("keydown", (e) => {
    const isShortcut = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k";
    if (!isShortcut) return;
    if (!document.getElementById("viewList")?.classList.contains("active")) return;
    e.preventDefault();
    document.getElementById("lessonSearchInput")?.focus();
  });
})();

/* ══════════════════════════════════════════════
   LIST
══════════════════════════════════════════════ */
/* /dersler/ klasörüne eklenen statik ders sayfaları (Ders Builder çıktıları),
   her push'ta bir GitHub Action tarafından taranıp /dersler/lessons.json
   içine yazılır. Burada o dosyayı okuyup Firestore derslerinin yanına
   ekliyoruz — böylece yeni bir statik ders eklendiğinde elle bir şey
   yapmana gerek kalmadan listede görünür. */
async function loadStaticLessonsManifest() {
  try {
    const res = await fetch("/dersler/lessons.json", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(l => ({
      id:        "static-" + l.slug,
      isStatic:  true,
      slug:      l.slug,
      title:     l.title || "Başlıksız",
      excerpt:   l.excerpt || "",
      category:  l.category || "",
      type:      l.type || "",
      published: l.published !== false,
      coverUrl:  l.cover ? `/dersler/${encodeURIComponent(l.slug)}/${l.cover}` : "",
      createdAt: l.date || null,
      readTime:  l.readTime || null
    }));
  } catch(e) {
    console.error("Statik ders manifesti okunamadı:", e);
    return [];
  }
}

async function loadLessons() {
  const grid = document.getElementById("lessonsGrid");
  grid.innerHTML = renderSkeletonCards(6);
  try {
    const [snap, staticLessons] = await Promise.all([
      getDocs(query(LESSONS_COL, orderBy("createdAt","desc"))),
      loadStaticLessonsManifest()
    ]);
    const dynamicLessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    allLessons = [...dynamicLessons, ...staticLessons].sort((a, b) => {
      const da = getLessonDate(a)?.getTime() || 0;
      const dbb = getLessonDate(b)?.getTime() || 0;
      return dbb - da;
    });
    const visible = isAdmin ? allLessons : allLessons.filter(l => l.published);
    buildLevelAccordion(visible);
    updateLessonsCount(visible.length);
    renderLessons(filterLessons(visible), visible.length);
  } catch(e) {
    document.getElementById("lessonsGrid").innerHTML =
      `<div class="grid-empty"><div class="grid-empty-text">Dersler yüklenirken hata oluştu.</div></div>`;
    console.error(e);
  }
}

function renderLessons(list, totalVisible = list.length) {
  const grid = document.getElementById("lessonsGrid");
  if (!list.length) {
    /* Site genelinde hiç ders yoksa (admin için de) — yapım aşaması vitrini */
    if (!totalVisible) {
      if (isAdmin) {
        grid.innerHTML = `<div class="grid-empty">
          <div class="grid-empty-icon">📚</div>
          <div class="grid-empty-text">Henüz ders yok. İlk dersi ekle!</div>
        </div>`;
      } else {
        grid.innerHTML = `<div class="coming-soon">
          <div class="coming-soon-icon">📖</div>
          <div class="coming-soon-eyebrow"><span class="eyebrow-dot"></span>Yapım Aşamasında</div>
          <h3 class="coming-soon-title">Dersler özenle hazırlanıyor</h3>
          <p class="coming-soon-desc">
            A1'den C1'e kadar her seviye için içerikler üzerinde çalışıyoruz.
            İlk dersler yayınlandığında burada karşına çıkacak — takipte kal.
          </p>
          <div class="coming-soon-roadmap">
            ${["A1","A2","B1","B2","C1"].map(cat => `
              <div class="roadmap-chip" data-cat="${cat}">
                <span class="roadmap-chip-level">${cat}</span>
                <span class="roadmap-chip-status">Yakında</span>
              </div>`).join("")}
          </div>
        </div>`;
      }
      return;
    }
    /* Sadece seçili kategoride ders yok, diğerlerinde var */
    grid.innerHTML = `<div class="grid-empty">
      <div class="grid-empty-icon">🔍</div>
      <div class="grid-empty-text">Bu filtrede henüz ders yayınlanmamış.</div>
      <button class="grid-empty-link" onclick="resetAllFilters()">Tüm dersleri göster</button>
    </div>`;
    return;
  }
  grid.innerHTML = "";
  list.forEach((lesson, i) => {
    const card = document.createElement("a");
    card.className = "lesson-card";
    card.style.animationDelay = (i * 50) + "ms";
    card.href = lesson.isStatic
      ? `/dersler/${encodeURIComponent(lesson.slug)}/`
      : (lesson.slug
        ? `/dersler/${encodeURIComponent(lesson.slug)}`
        : `/dersler/?id=${encodeURIComponent(lesson.id)}`);

    const cat      = lesson.category || "";
    const typeMap  = { iletisim: "İletişim", kultur: "Kültür", gramer: "Gramer" };
    const typeLabel = lesson.type && typeMap[lesson.type]
      ? `<span class="lesson-type-tag">${typeMap[lesson.type]}</span>`
      : "";
    const dateObj  = getLessonDate(lesson);
    const date     = dateObj
      ? dateObj.toLocaleDateString("tr-TR",{day:"2-digit",month:"long",year:"numeric"})
      : "—";
    const readMin  = lesson.readTime
      ? lesson.readTime
      : Math.max(1, Math.round(wordCountText(lesson.content || "") / 200));

    const coverHtml = lesson.coverUrl
      ? `<img class="lesson-card-cover" src="${esc(lesson.coverUrl)}" alt="${esc(lesson.title)}" loading="lazy">`
      : `<div class="lesson-card-cover-placeholder">📖</div>`;

    const levelBadge = cat ? `<span class="lesson-card-level-badge">${esc(cat)}</span>` : "";

    /* Statik (Ders Builder ile üretilmiş, gerçek HTML dosyası olan) dersler
       Firestore'da bir doküman değildir; bu yüzden admin panelinden
       silinemezler — o buton sadece Firestore derslerinde gösterilir. */
    const adminBtns = (isAdmin && !lesson.isStatic) ? `
      <div class="lesson-card-admin" onclick="event.stopPropagation();event.preventDefault()">
        <button class="btn-icon-sm danger" title="Sil" onclick="confirmDeleteLesson('${lesson.id}');event.preventDefault()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>` : "";

    const draftBadge = isAdmin && !lesson.published
      ? `<span class="draft-badge">Taslak</span>` : "";

    card.innerHTML = `
      <div class="lesson-card-cover-wrap">
        ${coverHtml}
      </div>
      <div class="lesson-card-body">
        <div class="lesson-card-top-row">
          ${levelBadge}
          ${typeLabel}
          ${draftBadge}
        </div>
        <div class="lesson-card-title">${esc(lesson.title || "Başlıksız")}</div>
        ${lesson.excerpt ? `<div class="lesson-card-excerpt">${esc(lesson.excerpt)}</div>` : ""}
        <div class="lesson-card-meta">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>${date}</span>
          <span class="lesson-card-dot"></span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>
          <span>${readMin} dk</span>
        </div>
        <div class="lesson-card-footer">
          <span class="lesson-card-read">Derse başla <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
          ${adminBtns}
        </div>
      </div>`;

    card.addEventListener("click", e => {
      /* Statik dersler gerçek bir HTML dosyasıdır — SPA'ya sokmadan
         normal bağlantı gibi davranıp tarayıcının o dosyayı
         doğrudan yüklemesine izin veriyoruz. */
      if (lesson.isStatic) return;
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      openLesson(lesson);
    });

    grid.appendChild(card);
  });
}

/* ══════════════════════════════════════════════
   DERS OKUMA
══════════════════════════════════════════════ */
async function loadLessonById(id) {
  try {
    const snap = await getDoc(doc(db, "lessons", id));
    if (!snap.exists()) { showViewOnly("viewList"); loadLessons(); return; }
    openLesson({ id: snap.id, ...snap.data() }, false);
  } catch(e) { console.error(e); showViewOnly("viewList"); loadLessons(); }
}

async function loadLessonBySlug(slug) {
  try {
    const snap = await getDocs(query(LESSONS_COL, where("slug","==",slug)));
    if (snap.empty) { showViewOnly("viewList"); loadLessons(); return; }
    const d = snap.docs[0];
    openLesson({ id: d.id, ...d.data() }, false);
  } catch(e) { console.error(e); showViewOnly("viewList"); loadLessons(); }
}

function openLesson(lesson, pushUrl = true) {
  _currentLessonId = lesson.id;
  document.title   = (lesson.title || "Ders") + " — AlmancaPratik";
  markLessonCompleted(lesson);

  const heroImg = document.getElementById("lessonHeroImg");
  if (lesson.coverUrl) { heroImg.src = lesson.coverUrl; heroImg.style.display = "block"; }
  else heroImg.style.display = "none";

  const catBadge = document.getElementById("lessonCatBadge");
  if (lesson.category) {
    catBadge.textContent   = lesson.category;
    catBadge.dataset.cat   = lesson.category;
    catBadge.className     = "lesson-cat-badge";
    catBadge.style.display = "inline-flex";
  } else { catBadge.style.display = "none"; }

  const typeMapFull = { iletisim: "İletişim", kultur: "Kültür", gramer: "Gramer" };
  const typeTagEl = document.getElementById("lessonTypeTag");
  if (lesson.type && typeMapFull[lesson.type]) {
    typeTagEl.textContent   = typeMapFull[lesson.type];
    typeTagEl.dataset.type  = lesson.type;
    typeTagEl.style.display = "inline-flex";
  } else { typeTagEl.style.display = "none"; }

  document.getElementById("lessonDraftBadge").style.display =
    (isAdmin && !lesson.published) ? "inline-flex" : "none";

  const date = lesson.createdAt?.toDate
    ? lesson.createdAt.toDate().toLocaleDateString("tr-TR",{day:"2-digit",month:"long",year:"numeric"})
    : "—";
  document.getElementById("lessonDate").textContent     = date;
  const wc = wordCountText(lesson.content || "");
  document.getElementById("lessonReadTime").textContent = Math.max(1, Math.round(wc / 200)) + " dk okuma";
  document.getElementById("lessonHeading").textContent  = lesson.title || "Başlıksız";
  document.getElementById("lessonBody").innerHTML        = lesson.content || "";
  document.getElementById("lessonAdminActions").style.display = isAdmin ? "flex" : "none";

  updateSeoTags(lesson);
  buildBreadcrumb(lesson);
  buildPrevNext(lesson);
  buildRelated(lesson);

  if (pushUrl) {
    showView("viewLesson", lesson.slug ? { slug: lesson.slug } : { id: lesson.id });
  } else { showViewOnly("viewLesson"); }
}

/* ══════════════════════════════════════════════
   SEO — her ders için sayfa başlığı, açıklama,
   canonical link, Open Graph ve yapılandırılmış
   veri (JSON-LD) etiketlerini günceller.
══════════════════════════════════════════════ */
function updateSeoTags(lesson) {
  const title = (lesson.title || "Ders") + " — AlmancaPratik";
  const desc  = (lesson.excerpt || stripHtml(lesson.content || "").slice(0, 155) || "AlmancaPratik Almanca dersi.").trim();
  const slugOrId = lesson.slug || lesson.id;
  const url   = `https://almancapratik.com/dersler/${encodeURIComponent(slugOrId)}`;

  setMeta("metaDescriptionTag", desc);
  setMeta("canonicalTag", url, "href");
  setMeta("ogTitleTag", title);
  setMeta("ogDescTag", desc);
  setMeta("ogUrlTag", url);
  if (lesson.coverUrl && lesson.coverUrl.startsWith("http")) setMeta("ogImageTag", lesson.coverUrl);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": lesson.title || "Ders",
    "description": desc,
    "url": url,
    "inLanguage": "de",
    "educationalLevel": lesson.category || undefined,
    "datePublished": lesson.createdAt?.toDate ? lesson.createdAt.toDate().toISOString() : undefined,
    "publisher": { "@type": "Organization", "name": "AlmancaPratik", "url": "https://almancapratik.com" }
  };
  const ld = document.getElementById("jsonLdTag");
  if (ld) ld.textContent = JSON.stringify(jsonLd);
}

function resetSeoTags() {
  document.title = "Dersler — AlmancaPratik";
  setMeta("metaDescriptionTag", "AlmancaPratik Almanca dersleri. A1'den C1'e kategorilere göre yapılandırılmış Almanca ders içerikleri.");
  setMeta("canonicalTag", "https://almancapratik.com/dersler/", "href");
  setMeta("ogTitleTag", "Dersler — AlmancaPratik");
  setMeta("ogDescTag", "A1'den C1'e kategorilere göre yapılandırılmış Almanca ders içerikleri.");
  setMeta("ogUrlTag", "https://almancapratik.com/dersler/");
  const ld = document.getElementById("jsonLdTag");
  if (ld) ld.textContent = "{}";
}

function setMeta(id, value, attr = "content") {
  const el = document.getElementById(id);
  if (el) el.setAttribute(attr, value);
}

function stripHtml(html) {
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}

/* ── Breadcrumb ── */
function buildBreadcrumb(lesson) {
  const el = document.getElementById("lessonBreadcrumb");
  if (!el) return;
  el.innerHTML = `
    <a href="/">Anasayfa</a>
    <span>/</span>
    <a href="/dersler/">Dersler</a>
    ${lesson.category ? `<span>/</span><a href="/dersler/?cat=${encodeURIComponent(lesson.category)}">${esc(lesson.category)}</a>` : ""}
    <span>/</span>
    <span class="lesson-breadcrumb-current">${esc(lesson.title || "Ders")}</span>
  `;
}

/* ── Önceki / sonraki ders (aynı kategori öncelikli, sonra tüm liste) ── */
function buildPrevNext(lesson) {
  const el = document.getElementById("lessonPrevNextRow");
  if (!el) return;
  const visible = (isAdmin ? allLessons : allLessons.filter(l => l.published));
  const idx = visible.findIndex(l => l.id === lesson.id);
  if (idx === -1 || visible.length < 2) { el.innerHTML = ""; return; }

  const prev = visible[idx + 1] || null; /* liste yeniden eskiye sıralı: bir sonraki eleman = daha eski ders */
  const next = visible[idx - 1] || null;

  const card = (l, dir) => l ? `
    <a class="lesson-nav-card lesson-nav-card--${dir}" href="/dersler/${encodeURIComponent(l.slug || l.id)}">
      <span class="lesson-nav-card-label">${dir === "prev" ? "← Önceki ders" : "Sonraki ders →"}</span>
      <span class="lesson-nav-card-title">${esc(l.title || "Başlıksız")}</span>
    </a>` : `<span></span>`;

  el.innerHTML = card(prev, "prev") + card(next, "next");
  el.querySelectorAll(".lesson-nav-card").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      const target = visible.find(l => `/dersler/${encodeURIComponent(l.slug || l.id)}` === a.getAttribute("href"));
      if (target) openLesson(target);
    });
  });
}

/* ── İlgili dersler (aynı kategori, farklı ders, en fazla 3) ── */
function buildRelated(lesson) {
  const el = document.getElementById("lessonRelated");
  if (!el) return;
  const visible = (isAdmin ? allLessons : allLessons.filter(l => l.published));
  const related = visible.filter(l => l.id !== lesson.id && l.category === lesson.category).slice(0, 3);
  if (!related.length) { el.innerHTML = ""; return; }

  el.innerHTML = `
    <div class="lesson-related-title">İlgili Dersler</div>
    <div class="lesson-related-grid">
      ${related.map(l => `
        <a class="lesson-related-card" href="/dersler/${encodeURIComponent(l.slug || l.id)}">
          <span class="lesson-related-cat" data-cat="${esc(l.category || "")}">${esc(l.category || "")}</span>
          <span class="lesson-related-name">${esc(l.title || "Başlıksız")}</span>
        </a>`).join("")}
    </div>
  `;
  el.querySelectorAll(".lesson-related-card").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      const target = related.find(l => `/dersler/${encodeURIComponent(l.slug || l.id)}` === a.getAttribute("href"));
      if (target) openLesson(target);
    });
  });
}

/* ── Paylaş ── */
document.getElementById("btnShareLesson")?.addEventListener("click", async () => {
  const url = window.location.href;
  const title = document.getElementById("lessonHeading")?.textContent || "AlmancaPratik";
  if (navigator.share) {
    try { await navigator.share({ title, url }); return; } catch { /* kullanıcı iptal etti */ }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast("Link kopyalandı ✓", "ok");
  } catch { toast("Link kopyalanamadı", "err"); }
});

/* ── Okuma ilerleme çubuğu ── */
window.addEventListener("scroll", () => {
  const bar = document.getElementById("readingProgressBar");
  if (!bar || !document.getElementById("viewLesson").classList.contains("active")) return;
  const h = document.documentElement;
  const scrolled = h.scrollTop;
  const max = h.scrollHeight - h.clientHeight;
  bar.style.width = max > 0 ? Math.min(100, (scrolled / max) * 100) + "%" : "0%";
}, { passive: true });

document.getElementById("btnBackFromLesson").addEventListener("click", () => {
  document.title = "Dersler — AlmancaPratik";
  showView("viewList");
  loadLessons();
});
document.getElementById("btnDeleteCurrentLesson").addEventListener("click", () => {
  if (_currentLessonId) confirmDeleteLesson(_currentLessonId);
});

/* ══════════════════════════════════════════════
   SİLME
══════════════════════════════════════════════ */
function confirmDeleteLesson(id) {
  deleteTargetId = id;
  document.getElementById("confirmOverlay").classList.add("open");
}
document.getElementById("confirmCancel").addEventListener("click", () => {
  document.getElementById("confirmOverlay").classList.remove("open"); deleteTargetId = null;
});
document.getElementById("confirmDelete").addEventListener("click", async () => {
  if (!deleteTargetId || !isAdmin) return;
  document.getElementById("confirmOverlay").classList.remove("open");
  try {
    await deleteDoc(doc(db, "lessons", deleteTargetId));
    toast("Ders silindi", "ok");
    document.title = "Dersler — AlmancaPratik";
    showView("viewList"); await loadLessons();
  } catch(e) { toast("Silme hatası: " + e.message, "err"); }
  deleteTargetId = null;
});

/* ══════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════ */
function toast(msg, type = "ok") {
  document.querySelectorAll(".d-toast").forEach(e => e.remove());
  const el = document.createElement("div");
  el.className = `d-toast ${type}`; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0"; el.style.transition = "opacity 0.3s";
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

function esc(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function wordCountText(t) {
  return (t || "").trim().replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
}

/* ── Globals (inline onclick için) ── */
window.confirmDeleteLesson = confirmDeleteLesson;
window.setCatFilter        = setCatFilter;

function resetAllFilters() {
  expandedLevel = null;
  setTypeFilter("all");
}
window.resetAllFilters = resetAllFilters;

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
(async function init() {
  const p        = new URLSearchParams(window.location.search);
  const pathSlug = getSlugFromPath();
  const slug     = pathSlug || p.get("ders");
  const id       = p.get("id");
  const cat      = p.get("cat");
  const type     = p.get("type");

  await loadLessons();

  if (slug)       await loadLessonBySlug(slug);
  else if (id)    await loadLessonById(id);
  else {
    showViewOnly("viewList");
    if (cat) { expandedLevel = cat; setCatFilter(cat); }
    if (type) setTypeFilter(type);
  }
})();