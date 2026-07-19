"use strict";
/* ═══════════════════════════════════════════════════════════
   6) TEMA SİSTEMİ + ÖNİZLEME + EXPORT MODAL
   Bu dosya, app.js'nin bölünmesiyle oluşturulmuştur.
   Diğer js/*.js dosyalarıyla aynı global scope'u paylaşır
   (module DEĞİLDİR) — bu yüzden index.html'deki script sırası önemlidir.
   ═══════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════
     Dinamik Gradient Tema Sistemi
     ══════════════════════════════════════ */
  const themeSelect = $("#metaTheme");
  const themeColorInput = $("#metaThemeColor");
  const DEFAULT_THEME = "ocean";
  /* Hazır 25 temanın hepsi koyu zeminli gradyanlardır; sadece "Düz Renk (Özel)"
     açık bir renk olabilir. Bloklara varsayılan/otomatik metin rengi seçerken
     kıyaslanacak gerçek sayfa arka planı budur. */
  function pageBgHex() {
    return (themeSelect && themeSelect.value === "custom" && themeColorInput)
      ? (themeColorInput.value || "#0b1220") : "#0b1220";
  }
  /* Sayfa arka planı (tema ya da düz renk) değişince, kendi arka planı olmayan
     ve metin rengi elle ayarlanmamış tüm başlık/paragraf bloklarının rengini
     otomatik olarak okunaklı kalacak şekilde günceller. */
  function applyAutoTextColorsForPageBg() {
    const auto = idealTextColor(pageBgHex());
    if (!auto) return;
    blocks.forEach(b => {
      if ((b.type === "heading" || b.type === "paragraph") && !b.bgColor && !b.colorManual && b.color !== auto) {
        b.color = auto;
        applyBlockStyle(b);
        if (b.id === activeBlockId) {
          const input = $('.block[data-id="' + b.id + '"] input[type="color"][data-f="color"]');
          if (input) input.value = auto;
        }
      }
    });
  }
  function applyTheme(value) {
    document.body.className = (value && value !== "none") ? "theme-" + value : "";
    themeColorInput.style.display = value === "custom" ? "" : "none";
    if (value === "custom") document.body.style.setProperty("--custom-bg", themeColorInput.value);
  }
  applyTheme(themeSelect.value || DEFAULT_THEME);
  themeSelect.addEventListener("change", () => { applyTheme(themeSelect.value); applyAutoTextColorsForPageBg(); });
  themeColorInput.addEventListener("input", () => {
    if (themeSelect.value === "custom") document.body.style.setProperty("--custom-bg", themeColorInput.value);
    applyAutoTextColorsForPageBg();
  });

  const overlay = $("#exportModalOverlay");
  $("#btnExport").addEventListener("click", () => {
    if (!blocks.length) { toast("Önce en az bir blok ekleyin.", "err"); return; }
    overlay.classList.add("open");
  });
  $("#closeExportModal").addEventListener("click", () => overlay.classList.remove("open"));
  $("#cancelExport").addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.classList.remove("open"); });

  /* ══════════════════════════════════════
     URL Slug — başlıktan otomatik önerilir,
     kullanıcı elle değiştirirse artık otomatik güncellenmez.
     ══════════════════════════════════════ */
  const TR_MAP = { ç:"c", Ç:"c", ğ:"g", Ğ:"g", ı:"i", İ:"i", ö:"o", Ö:"o", ş:"s", Ş:"s", ü:"u", Ü:"u" };
  function slugify(str) {
    return String(str || "")
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, ch => TR_MAP[ch] || ch)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }
  const metaTitleInput = $("#metaTitle");
  const metaSlugInput = $("#metaSlug");
  let slugManuallyEdited = false;
  metaSlugInput.addEventListener("input", () => { slugManuallyEdited = metaSlugInput.value.trim() !== slugify(metaTitleInput.value); });
  metaTitleInput.addEventListener("input", () => {
    if (!slugManuallyEdited) metaSlugInput.value = slugify(metaTitleInput.value);
  });

  $("#confirmExport").addEventListener("click", () => {
    const title = $("#metaTitle").value.trim();
    const slug = ($("#metaSlug").value.trim() || slugify(title));
    const description = $("#metaDesc").value.trim();
    const level = $("#metaLevel").value;
    const type = $("#metaType").value;
    const difficulty = $("#metaDifficulty").value;
    const readTime = $("#metaReadTime").value || "5";
    const author = $("#metaAuthor").value.trim();
    const cover = $("#metaCover").value.trim();
    const theme = $("#metaTheme").value || "ocean";
    const themeColor = $("#metaThemeColor").value || "#0b1220";
    if (!title) { toast("Sayfa başlığı boş olamaz.", "err"); return; }
    if (!slug) { toast("URL slug boş olamaz.", "err"); return; }
    const html = buildExportHtml({ title, slug, description, level, type, difficulty, readTime, author, cover, theme, themeColor });
    downloadHtml(html);
    overlay.classList.remove("open");
    toast("index.html indirildi ✓", "ok");
  });

  function downloadHtml(htmlStr) {
    const blob = new Blob([htmlStr], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "index.html";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* ══════════════════════════════════════
     YENİ: Canlı Önizleme (Preview)
     ══════════════════════════════════════
     Not: buildExportHtml() çıktısı, siteye ait ../../css/global.css,
     ../../src/styles/tokens.css, ../lesson-static.css ve ../../js/core.js
     gibi harici site dosyalarına bağlıdır. Bu dosyalar önizlemede
     (site dışında) çözümlenemeyeceği için sayfa stilsiz görünür.
     Önizleme için bu bağlantıları geçici olarak, aynı görünümü taklit eden
     kendi kendine yeten bir CSS bloğuyla değiştiriyoruz. Gerçek "İndir"
     çıktısı (buildExportHtml) bundan etkilenmez. */
  const PREVIEW_FALLBACK_CSS = [
    "body{margin:0;background:#0a0a0f;color:#e2e8f0;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;}",
    ".bg-canvas{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;}",
    ".bg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);background-size:52px 52px;mask-image:radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 100%);}",
    ".bg-glow{position:absolute;border-radius:50%;filter:blur(120px);opacity:0.08;animation:drift 14s ease-in-out infinite alternate;}",
    ".bg-glow--1{width:600px;height:600px;top:-200px;left:-100px;background:radial-gradient(circle, #c9a84c, transparent 70%);}",
    ".bg-glow--2{width:400px;height:400px;top:30%;right:-120px;background:radial-gradient(circle, #60c8f0, transparent 70%);animation-delay:-7s;opacity:0.06;}",
    "@keyframes drift{from{transform:translate(0,0) scale(1);}to{transform:translate(30px,20px) scale(1.06);}}",
    ".lesson-wrap{position:relative;z-index:1;}",
    ".lesson-nav-row{max-width:760px;margin:0 auto;padding:22px 24px 0;}",
    ".lesson-back{display:inline-flex;align-items:center;gap:6px;color:#93c5fd;text-decoration:none;font-size:13px;font-weight:600;}",
    ".lesson-back:hover{color:#fff;}",
    ".lesson-wrap{max-width:760px;margin:0 auto;padding:22px 24px 140px;}",
    ".lesson-hero-img{width:100%;height:auto;display:block;border-radius:16px;margin:20px 0 28px;box-shadow:0 20px 50px rgba(0,0,0,0.4);}",
    ".lesson-meta-row{display:flex;align-items:center;gap:10px;margin:20px 0 14px;font-size:12.5px;color:rgba(226,232,240,0.55);}",
    ".lesson-card-dot{width:3px;height:3px;border-radius:50%;background:rgba(226,232,240,0.3);flex-shrink:0;}",
    ".lesson-heading{font-family:'Plus Jakarta Sans',sans-serif;font-size:36px;font-weight:800;line-height:1.2;letter-spacing:-0.02em;color:#fff;margin:0 0 22px;}",
    ".lesson-body{font-family:'Inter',sans-serif;font-size:17px;line-height:1.7;color:#cbd5e1;}",
    ".lesson-body h1,.lesson-body h2,.lesson-body h3{font-family:'Plus Jakarta Sans',sans-serif;color:#fff;scroll-margin-top:20px;}",
    ".preview-mode-banner{position:sticky;top:0;z-index:999;text-align:center;font-size:11.5px;font-weight:600;letter-spacing:.02em;color:#071022;background:linear-gradient(120deg,#ffd250,#ffb020);padding:7px 10px;}"
  ].join("\n");

  function getPreviewMeta() {
    const firstHeading = blocks.find(b => b.type === "heading" && b.text && b.text.trim());
    const titleVal = $("#metaTitle").value.trim() || (firstHeading ? firstHeading.text.trim() : "Ders Önizleme");
    return {
      title: titleVal,
      slug: $("#metaSlug").value.trim() || slugify(titleVal),
      description: $("#metaDesc").value.trim(),
      level: $("#metaLevel").value || "B1",
      type: $("#metaType").value || "",
      difficulty: $("#metaDifficulty").value || "Orta",
      readTime: $("#metaReadTime").value || "5",
      author: $("#metaAuthor").value.trim(),
      cover: $("#metaCover").value.trim(),
      theme: $("#metaTheme").value || "none",
      themeColor: $("#metaThemeColor").value || "#0b1220"
    };
  }

  function buildPreviewHtml() {
    let html = buildExportHtml(getPreviewMeta());
    // Sadece önizlemede çözümlenemeyecek site-özel dosyaları çıkar
    html = html.replace('<link rel="stylesheet" href="../../css/global.css">', "");
    html = html.replace('<link rel="stylesheet" href="../../src/styles/tokens.css">', "");
    html = html.replace('<link rel="stylesheet" href="../lesson-static.css">', "");
    html = html.replace(/<!-- Navbar[\s\S]*?<\/script>/, "");
    // Yerine önizlemeye özel, kendi kendine yeten yaklaşık stilleri ekle
    html = html.replace("<" + "/style>", PREVIEW_FALLBACK_CSS + "\n<" + "/style>");
    html = html.replace(/<body([^>]*)>/, '<body$1>\n<div class="preview-mode-banner">🔍 ÖNİZLEME MODU — gerçek sitede navbar ve bazı stiller farklı görünebilir</div>');
    return html;
  }

  const previewOverlay = $("#previewOverlay");
  const previewIframe = $("#previewIframe");
  let previewBlobUrl = null;

  $("#btnPreview").addEventListener("click", () => {
    if (!blocks.length) { toast("Önizlemek için önce en az bir blok ekleyin.", "err"); return; }
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    const blob = new Blob([buildPreviewHtml()], { type: "text/html;charset=utf-8" });
    previewBlobUrl = URL.createObjectURL(blob);
    previewIframe.src = previewBlobUrl;
    previewOverlay.classList.add("open");
  });
  $("#closePreview").addEventListener("click", () => previewOverlay.classList.remove("open"));
  previewOverlay.addEventListener("click", e => { if (e.target === previewOverlay) previewOverlay.classList.remove("open"); });
  $("#previewOpenTab").addEventListener("click", () => { if (previewBlobUrl) window.open(previewBlobUrl, "_blank"); });

  // ── Sesli Okuma (TTS) kontrolleri: kelime kartları ve diğer Almanca metinler için ──
  const TTS_ICO_SLOW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13c0-4 3.5-7 8-7s8 3 8 7-3.5 5-8 5-8-1-8-5Z"/><circle cx="19" cy="10" r="1.6"/><path d="M6 16l-2 3"/><path d="M9 17.6l-1 2.6"/><path d="M15 17.6l1 2.6"/><path d="M18 16l2 3"/></svg>';
  const TTS_ICO_NORMAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.3 5.7a9 9 0 0 1 0 12.6"/></svg>';
  function escJsAttr(s) { return esc(s).replace(/'/g, "\\'"); }
  // text: okunacak Almanca metin, lang: BCP47 dil kodu, sizeCls: "" (normal) veya "tts-cluster-sm" (küçük varyant),
  // extraOnclick: butonlara eklenecek ek JS (örn. sürükle-bırak alanlarında tıklamanın kabarmasını durdurmak için)
  // Paragraf/bilgi kutusu gibi zengin metin (HTML) alanlarını sesli okuma için
  // düz metne çevirir: etiketleri kaldırır, [kelime|ipucu] köşeli parantez sözdizimini
  // ve {{boşluk}} işaretlerini de sesli okumaya uygun hale getirir.
  function stripHtmlForTts(html) {
    if (!html) return "";
    let t = String(html).replace(/<[^>]*>/g, " ");
    t = t.replace(/\[([^\|\]]+)\|[^\]]*\]/g, "$1");
    t = t.replace(/\{\{([^}]*)\}\}/g, "$1");
    t = t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
    return t.replace(/\s+/g, " ").trim();
  }

  function ttsCluster(text, lang, sizeCls, extraOnclick) {
    if (!text) return "";
    const t = escJsAttr(text);
    const l = lang || "de-DE";
    const stop = extraOnclick ? extraOnclick : "";
    return '<span class="tts-cluster' + (sizeCls ? " " + sizeCls : "") + '">' +
      '<button type="button" class="tts-btn tts-slow" title="Yavaş oku" aria-label="Yavaş sesli oku" onclick="' + stop + "playSpeechText(this,'" + t + "','" + l + "',0.55)\">" + TTS_ICO_SLOW + '</button>' +
      '<button type="button" class="tts-btn tts-normal" title="Normal hızda oku" aria-label="Normal hızda sesli oku" onclick="' + stop + "playSpeechText(this,'" + t + "','" + l + "',1)\">" + TTS_ICO_NORMAL + '</button>' +
      '</span>';
  }

