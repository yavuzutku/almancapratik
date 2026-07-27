"use strict";
/* ═══════════════════════════════════════════════════════════
   JS 4/4 — ZENGİN METİN ARAÇ ÇUBUĞU + PROJE KAYDET/YÜKLE
   + HAZIR ŞABLONLAR
   2 parça dosyadan birleştirilmiştir (sıra ve işlev korunmuştur):
   rich-text-toolbar.js, project-io-templates.js
   ═══════════════════════════════════════════════════════════ */

/* ---------- rich-text-toolbar.js ---------- */
/* ═══════════════════════════════════════════════════════════
   9) ZENGİN METİN ARAÇ ÇUBUĞU
   Bu dosya, app.js'nin bölünmesiyle oluşturulmuştur.
   Diğer js/*.js dosyalarıyla aynı global scope'u paylaşır
   (module DEĞİLDİR) — bu yüzden index.html'deki script sırası önemlidir.
   ═══════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════
     Zengin Metin (Rich Text Toolbar) Logic
     Seçili metin üzerinde açılan biçimlendirme çubuğu: yazı tipi, boyut,
     kalın/italik/altı çizili, bağlantı, vurgu, biçim temizleme.
     Kapanma davranışı: metin seçimi kalkınca, dışarı tıklayınca,
     Esc'e basınca, sayfa kaydırılınca ya da X'e tıklayınca kapanır.
     ══════════════════════════════════════ */
  const RT_FONT_OPTIONS = [
    ["Inter", "Inter"],
    ["Plus Jakarta Sans", "Plus Jakarta Sans"],
    ["Lora", "Lora"],
    ["Merriweather", "Merriweather"],
    ["Playfair Display", "Playfair Display"],
    ["Poppins", "Poppins"],
    ["Montserrat", "Montserrat"],
    ["Nunito", "Nunito"]
  ];
  const RT_SIZE_OPTIONS = [
    ["1", "Çok Küçük"], ["2", "Küçük"], ["3", "Normal"],
    ["4", "Orta"], ["5", "Büyük"], ["6", "Çok Büyük"], ["7", "Dev"]
  ];
  // Google Dokümanlar tarzı renk paleti: gri tonlar + canlı renk sıraları.
  const RT_COLOR_PALETTE = [
    ["#ffffff","#f1f5f9","#cbd5e1","#94a3b8","#64748b","#334155","#1e293b","#0f172a","#000000"],
    ["#fecaca","#fca5a5","#f87171","#ef4444","#dc2626","#f97316","#fb923c","#f59e0b","#facc15"],
    ["#bbf7d0","#86efac","#4ade80","#22c55e","#16a34a","#14b8a6","#2dd4bf","#06b6d4","#38bdf8"],
    ["#bfdbfe","#93c5fd","#60a5fa","#3b82f6","#2563eb","#6366f1","#818cf8","#a78bfa","#c084fc"],
    ["#fbcfe8","#f9a8d4","#f472b6","#ec4899","#db2777","#e11d48","#f43f5e","#fb7185","#fda4af"]
  ];
  const RT_ALIGN_OPTIONS = [
    ["justifyLeft", ICO.alignL, "Sola Yasla"],
    ["justifyCenter", ICO.alignC, "Ortala"],
    ["justifyRight", ICO.alignR, "Sağa Yasla"],
    ["justifyFull", ICO.alignJ, "İki Yana Yasla"]
  ];

  function rtColorGrid(cmd, allowNone) {
    let html = '<div class="rt-popover-grid">';
    if (allowNone) {
      html += '<button class="rt-swatch rt-swatch-none" data-color-cmd="' + cmd + '" data-color="__none" title="Vurguyu Kaldır">' + ICO.close + '</button>';
    }
    RT_COLOR_PALETTE.forEach(row => {
      row.forEach(hex => {
        html += '<button class="rt-swatch" data-color-cmd="' + cmd + '" data-color="' + hex + '" style="background:' + hex + '" title="' + hex + '"></button>';
      });
    });
    html += '</div>' +
      '<label class="rt-custom-color">Özel renk<input type="color" data-color-cmd="' + cmd + '" class="rt-custom-color-input" value="#3b82f6"></label>';
    return html;
  }

  function rtLinkPopoverHtml() {
    return '<div class="rt-link-pop">' +
      '<label class="rt-link-field">Bağlantı Adresi (URL)<input type="text" class="rt-link-url" placeholder="https://..."></label>' +
      '<div class="rt-popover-label">Bağlantı Metni Rengi <span class="rt-link-color-current">(varsayılan)</span></div>' +
      rtColorGrid("link", true) +
      '<button type="button" class="rt-link-apply btn btn-sm btn-blue">' + ICO.check + ' Bağlantıyı Ekle</button>' +
    '</div>';
  }

  const rtToolbar = document.createElement("div");
  rtToolbar.className = "rt-toolbar";
  rtToolbar.innerHTML =
    '<select class="rt-select rt-select-font" data-cmd="fontName" title="Yazı Tipi">' +
      RT_FONT_OPTIONS.map(f => '<option value="' + f[0] + '">' + f[1] + '</option>').join("") +
    '</select>' +
    '<select class="rt-select rt-select-size" data-cmd="fontSize" title="Yazı Boyutu">' +
      RT_SIZE_OPTIONS.map(s => '<option value="' + s[0] + '"' + (s[0] === "3" ? " selected" : "") + '>' + s[1] + '</option>').join("") +
    '</select>' +
    '<div class="rt-divider"></div>' +
    '<button class="rt-btn" data-cmd="bold" title="Kalın (Ctrl+B)">' + ICO.bold + '</button>' +
    '<button class="rt-btn" data-cmd="italic" title="İtalik (Ctrl+I)">' + ICO.italic + '</button>' +
    '<button class="rt-btn" data-cmd="underline" title="Altı Çizili (Ctrl+U)">' + ICO.underline + '</button>' +
    '<button class="rt-btn" data-cmd="strikeThrough" title="Üstü Çizili">' + ICO.strike + '</button>' +
    '<div class="rt-divider"></div>' +
    '<button class="rt-btn rt-btn-pop" data-pop="color" title="Yazı Rengi">' +
      '<span class="rt-color-ico">' + ICO.textA + '<i class="rt-color-bar" style="background:#3b82f6"></i></span>' + ICO.chevronDown +
    '</button>' +
    '<button class="rt-btn rt-btn-pop" data-pop="hilite" title="Vurgu Rengi">' +
      '<span class="rt-color-ico">' + ICO.highlight + '<i class="rt-color-bar" style="background:#ffd250"></i></span>' + ICO.chevronDown +
    '</button>' +
    '<div class="rt-divider"></div>' +
    '<button class="rt-btn rt-btn-pop" data-pop="align" title="Hizalama">' + ICO.alignL + ICO.chevronDown + '</button>' +
    '<button class="rt-btn" data-cmd="insertUnorderedList" title="Madde İşaretli Liste">' + ICO.listUl + '</button>' +
    '<button class="rt-btn" data-cmd="insertOrderedList" title="Numaralı Liste">' + ICO.listOl + '</button>' +
    '<div class="rt-divider"></div>' +
    '<button class="rt-btn rt-btn-pop" data-pop="link" title="Bağlantı Ekle">' + ICO.link + '</button>' +
    '<button class="rt-btn" data-cmd="removeFormat" title="Biçimlendirmeyi Temizle">' + ICO.clear + '</button>' +
    '<div class="rt-divider"></div>' +
    '<button class="rt-btn rt-close" data-cmd="__close" title="Kapat (Esc)">' + ICO.close + '</button>' +
    '<div class="rt-popover" id="rtPopover"></div>';
  document.body.appendChild(rtToolbar);

  const rtPopover = rtToolbar.querySelector("#rtPopover");
  let rtSavedRange = null;

  function saveRtSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) rtSavedRange = sel.getRangeAt(0).cloneRange();
  }
  function restoreRtSelection() {
    if (!rtSavedRange) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rtSavedRange);
  }

  function closeRtPopover() {
    rtPopover.classList.remove("show");
    rtPopover.innerHTML = "";
    rtToolbar.querySelectorAll(".rt-btn-pop.active").forEach(b => b.classList.remove("active"));
  }

  function openRtPopover(trigger, html) {
    const alreadyOpenFor = rtPopover.dataset.for === trigger.dataset.pop && rtPopover.classList.contains("show");
    closeRtPopover();
    if (alreadyOpenFor) return;
    rtPopover.innerHTML = html;
    rtPopover.dataset.for = trigger.dataset.pop;
    rtPopover.style.left = trigger.offsetLeft + "px";
    rtPopover.classList.add("show");
    trigger.classList.add("active");
  }

  function hideRtToolbar() { rtToolbar.classList.remove("show"); closeRtPopover(); }

  function positionRtToolbar(range) {
    const rect = range.getBoundingClientRect();
    rtToolbar.classList.add("show");
    const tbWidth = rtToolbar.offsetWidth || 360;
    let left = rect.left + window.scrollX + (rect.width / 2) - (tbWidth / 2);
    left = Math.max(8, Math.min(left, document.documentElement.clientWidth + window.scrollX - tbWidth - 8));
    rtToolbar.style.top = (rect.top + window.scrollY - 48) + "px";
    rtToolbar.style.left = left + "px";
  }

  function refreshRtActiveStates() {
    const map = { bold: "bold", italic: "italic", underline: "underline", strikeThrough: "strikeThrough",
      insertUnorderedList: "insertUnorderedList", insertOrderedList: "insertOrderedList" };
    Object.keys(map).forEach(cmd => {
      const btn = rtToolbar.querySelector('[data-cmd="' + cmd + '"]');
      if (!btn) return;
      let state = false;
      try { state = document.queryCommandState(map[cmd]); } catch (e) { state = false; }
      btn.classList.toggle("active", !!state);
    });
    const alignBtn = rtToolbar.querySelector('[data-pop="align"]');
    if (alignBtn) {
      let cur = ICO.alignL;
      RT_ALIGN_OPTIONS.forEach(([cmd, ico]) => {
        try { if (document.queryCommandState(cmd)) cur = ico; } catch (e) {}
      });
      alignBtn.innerHTML = cur + ICO.chevronDown;
    }
  }

  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { hideRtToolbar(); return; }
    const node = sel.anchorNode ? sel.anchorNode.parentElement : null;
    if (node && node.closest("[contenteditable='true']")) {
      positionRtToolbar(sel.getRangeAt(0));
      saveRtSelection();
      refreshRtActiveStates();
    } else {
      hideRtToolbar();
    }
  });

  let rtPendingLinkColor = null;

  rtToolbar.addEventListener("mousedown", (e) => {
    if (e.target.closest("select") || e.target.closest(".rt-custom-color-input") || e.target.closest(".rt-link-url")) return; // seçim/renk/URL kutularının normal açılmasına izin ver
    e.preventDefault(); // Focus kaybını önler

    // Palet içindeki bir renk örneğine tıklandıysa
    const swatch = e.target.closest("[data-color-cmd]");
    if (swatch) {
      const scope = swatch.dataset.colorCmd;
      const color = swatch.dataset.color;
      if (scope === "link") {
        // Bağlantı rengi henüz uygulanmaz; sadece seçili olarak işaretlenir, "Bağlantıyı Ekle" ile birlikte uygulanır.
        rtPendingLinkColor = color === "__none" ? null : color;
        rtPopover.querySelectorAll(".rt-swatch").forEach(s => s.classList.remove("rt-swatch-selected"));
        swatch.classList.add("rt-swatch-selected");
        const preview = rtPopover.querySelector(".rt-link-color-current");
        if (preview) {
          preview.textContent = rtPendingLinkColor ? rtPendingLinkColor : "(varsayılan)";
          preview.style.color = rtPendingLinkColor || "";
        }
        return;
      }
      restoreRtSelection();
      const cmd = scope === "color" ? "foreColor" : "hiliteColor";
      if (color === "__none") {
        document.execCommand("hiliteColor", false, "transparent");
      } else {
        document.execCommand(cmd, false, color);
      }
      const trigger = rtToolbar.querySelector('[data-pop="' + scope + '"]');
      if (trigger) {
        const bar = trigger.querySelector(".rt-color-bar");
        if (bar && color !== "__none") bar.style.background = color;
      }
      closeRtPopover();
      return;
    }

    // Bağlantıyı ekle butonuna basıldıysa
    if (e.target.closest(".rt-link-apply")) {
      rtApplyLink();
      return;
    }

    const btn = e.target.closest("button");
    if (!btn) return;

    // Açılır panel tetikleyicileri (renk / hizalama / bağlantı)
    if (btn.dataset.pop) {
      if (btn.dataset.pop === "color") openRtPopover(btn, rtColorGrid("color", false));
      else if (btn.dataset.pop === "hilite") openRtPopover(btn, rtColorGrid("hilite", true));
      else if (btn.dataset.pop === "align") {
        openRtPopover(btn, '<div class="rt-popover-row">' +
          RT_ALIGN_OPTIONS.map(([cmd, ico, label]) => '<button class="rt-btn" data-cmd="' + cmd + '" title="' + label + '">' + ico + '</button>').join("") +
          '</div>');
      } else if (btn.dataset.pop === "link") {
        rtPendingLinkColor = null;
        openRtPopover(btn, rtLinkPopoverHtml());
        const urlInput = rtPopover.querySelector(".rt-link-url");
        if (urlInput) setTimeout(() => urlInput.focus(), 0);
      }
      return;
    }

    const cmd = btn.dataset.cmd;
    if (!cmd) return;
    if (cmd === "__close") {
      hideRtToolbar();
    } else if (RT_ALIGN_OPTIONS.some(o => o[0] === cmd)) {
      document.execCommand(cmd, false, null);
      closeRtPopover();
      refreshRtActiveStates();
    } else {
      document.execCommand(cmd, false, null);
      refreshRtActiveStates();
    }
  });

  function rtApplyLink() {
    const urlInput = rtPopover.querySelector(".rt-link-url");
    const url = urlInput ? urlInput.value.trim() : "";
    if (!url) { if (urlInput) urlInput.focus(); return; }
    restoreRtSelection();
    document.execCommand("createLink", false, url);
    if (rtPendingLinkColor) {
      const sel = window.getSelection();
      let anchor = null;
      if (sel && sel.anchorNode) {
        const startNode = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
        anchor = startNode && startNode.closest ? startNode.closest("a[href]") : null;
      }
      if (!anchor && rtSavedRange) {
        const container = rtSavedRange.commonAncestorContainer;
        const root = (container.nodeType === 3 ? container.parentElement : container).closest("[contenteditable='true']");
        if (root) {
          const candidates = root.querySelectorAll('a[href="' + url.replace(/"/g, '\\"') + '"]');
          anchor = candidates[candidates.length - 1];
        }
      }
      if (anchor) {
        anchor.style.color = rtPendingLinkColor;
        const editableRoot = anchor.closest("[contenteditable='true']");
        if (editableRoot) editableRoot.dispatchEvent(new Event("input"));
      }
    }
    rtPendingLinkColor = null;
    closeRtPopover();
  }

  rtToolbar.addEventListener("keydown", (e) => {
    if (e.target.closest(".rt-link-url") && e.key === "Enter") {
      e.preventDefault();
      rtApplyLink();
    }
  });

  rtToolbar.addEventListener("input", (e) => {
    if (!e.target.classList.contains("rt-custom-color-input")) return;
    restoreRtSelection();
    const cmd = e.target.dataset.colorCmd === "color" ? "foreColor" : "hiliteColor";
    document.execCommand(cmd, false, e.target.value);
    const trigger = rtToolbar.querySelector('[data-pop="' + e.target.dataset.colorCmd + '"]');
    if (trigger) {
      const bar = trigger.querySelector(".rt-color-bar");
      if (bar) bar.style.background = e.target.value;
    }
  });

  rtToolbar.querySelector(".rt-select-font").addEventListener("change", (e) => {
    restoreRtSelection();
    document.execCommand("fontName", false, e.target.value);
  });
  rtToolbar.querySelector(".rt-select-size").addEventListener("change", (e) => {
    restoreRtSelection();
    document.execCommand("fontSize", false, e.target.value);
  });
  rtToolbar.querySelector(".rt-select-font").addEventListener("mousedown", saveRtSelection);
  rtToolbar.querySelector(".rt-select-size").addEventListener("mousedown", saveRtSelection);

  // Asıl "kapanmıyor" hatasının düzeltmesi: dışarı tıklayınca, Esc'e basınca
  // veya sayfa kaydırılınca (konumu bayatlamasın diye) çubuğu kesin olarak kapat.
  document.addEventListener("mousedown", (e) => {
    if (!rtToolbar.classList.contains("show")) return;
    if (e.target.closest(".rt-toolbar") || e.target.closest("[contenteditable='true']")) return;
    hideRtToolbar();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideRtToolbar();
  });
  window.addEventListener("scroll", hideRtToolbar, true);


/* ---------- project-io-templates.js ---------- */
/* ═══════════════════════════════════════════════════════════
   10) PROJE KAYDET/YÜKLE + HAZIR ŞABLONLAR
   Bu dosya, app.js'nin bölünmesiyle oluşturulmuştur.
   Diğer js/*.js dosyalarıyla aynı global scope'u paylaşır
   (module DEĞİLDİR) — bu yüzden index.html'deki script sırası önemlidir.
   ═══════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════
     YENİ: JSON Proje Kaydetme & Yükleme
     ══════════════════════════════════════ */
  $("#btnSaveProject").addEventListener("click", () => {
    if (!blocks.length) { toast("Kaydedilecek blok bulunamadı.", "err"); return; }
    const projectData = JSON.stringify({ seq, blocks, tabs: projectTabs }, null, 2);
    const blob = new Blob([projectData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ders-projesi-" + Date.now() + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Proje JSON olarak kaydedildi ✓");
  });

  const loadInput = $("#loadProjectInput");
  $("#btnLoadProject").addEventListener("click", () => loadInput.click());
  loadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const data = JSON.parse(evt.target.result);
        if (Array.isArray(data.blocks)) {
          blocks = data.blocks;
          seq = data.seq || blocks.length;
          applyLoadedTabs(data.tabs);
          renderAll();
          toast("Proje başarıyla yüklendi ✓");
        } else {
          throw new Error("Geçersiz şema");
        }
      } catch (err) {
        toast("Dosya yüklenemedi. Geçersiz JSON formatı.", "err");
      }
    };
    reader.readAsText(file);
    loadInput.value = ""; // Inputu sıfırla
  });

  // Daha önce "HTML Oluştur" ile dışa aktarılmış bir index.html dosyasını
  // tekrar yükleyip düzenlemeye devam edebilmek için: export sırasında
  // sayfanın <head> içine gizlenen JSON veriyi okuyup geri yüklüyoruz.
  const loadHtmlInput = $("#loadHtmlInput");
  $("#btnLoadHtml").addEventListener("click", () => loadHtmlInput.click());
  loadHtmlInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const html = evt.target.result;
        const m = html.match(/<script type="application\/json" id="ders-builder-data">([\s\S]*?)<\/script>/);
        if (!m) throw new Error("Bu dosyada düzenleme verisi bulunamadı");
        const data = JSON.parse(m[1]);
        if (Array.isArray(data.blocks)) {
          blocks = data.blocks;
          seq = data.seq || blocks.length;
          applyLoadedTabs(data.tabs);
          activeBlockId = null;
          renderAll();
          toast("Ders HTML dosyasından yüklendi, düzenlemeye devam edebilirsiniz ✓");
        } else {
          throw new Error("Geçersiz şema");
        }
      } catch (err) {
        toast("Bu HTML dosyası bu araçla oluşturulmamış ya da bozulmuş, yüklenemedi.", "err");
      }
    };
    reader.readAsText(file);
    loadHtmlInput.value = "";
  });

  /* ══════════════════════════════════════
     Hazır Şablonlar Sistemi
     ══════════════════════════════════════ */
  function loadIntoCanvas(newBlocks, newSeq, newTabs) {
    blocks = newBlocks;
    seq = newSeq || blocks.reduce((m, b) => {
      const n = parseInt(String(b.id).replace(/^b/, ""), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, blocks.length);
    applyLoadedTabs(newTabs);
    renderAll();
  }

  // Yüklenen bir projeden/şablondan/HTML'den gelen sekme listesini (varsa)
  // geçerli bir { key, label } dizisine dönüştürüp uygular; yoksa (eski
  // dosyalar için) varsayılan Ders İçeriği / Etkinlikler ikilisine döner.
  function applyLoadedTabs(rawTabs) {
    if (Array.isArray(rawTabs) && rawTabs.length) {
      projectTabs = rawTabs
        .filter(t => t && t.key)
        .map(t => ({ key: String(t.key), label: String(t.label || t.key) }));
    }
    if (!projectTabs.length) {
      projectTabs = [
        { key: "content", label: "Ders İçeriği" },
        { key: "activity", label: "Etkinlikler" }
      ];
    }
    canvasViewTab = projectTabs[0].key;
    activeBlockId = null;
    rebuildCanvasTabsUi();
  }

  $all(".template-btn[data-template]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (blocks.length && !confirm("Mevcut çalışmanız silinecek, onaylıyor musunuz?")) return;
      const newBlocks = [];
      const type = btn.dataset.template;

      if (type === "vocab") {
        newBlocks.push(
          Object.assign({ id: nextId(), type: "heading" }, defaultsFor("heading"), { text: "Günün Almanca Kelimeleri", level: "h1" }),
          Object.assign({ id: nextId(), type: "vocab" }, defaultsFor("vocab"), { de: "der Tisch", tr: "masa", phon: "tiş", example: "Der Tisch ist sehr groß." }),
          Object.assign({ id: nextId(), type: "vocab" }, defaultsFor("vocab"), { de: "der Stuhl", tr: "sandalye", phon: "ştuul", example: "Ich sitze auf dem Stuhl." }),
          Object.assign({ id: nextId(), type: "quiz" }, defaultsFor("quiz"), { question: "Hangi kelime 'masa' anlamına gelir?", options: ["der Stuhl", "der Tisch", "das Auto"], correctIndex: 1, explanation: "Almanca'da 'der Tisch' masa demektir." })
        );
      } else if (type === "reading") {
        newBlocks.push(
          Object.assign({ id: nextId(), type: "heading" }, defaultsFor("heading"), { text: "Okuma-Anlama: Mein Tag", level: "h1" }),
          Object.assign({ id: nextId(), type: "paragraph" }, defaultsFor("paragraph"), { html: "Ich stehe jeden Morgen um [6 Uhr|saat 6'da] auf. Dann trinke ich einen Kaffee. [Danach|Ondan sonra] gehe ich zur Arbeit. Ich liebe meinen Beruf." }),
          Object.assign({ id: nextId(), type: "callout" }, defaultsFor("callout"), { theme: "blue", title: "Gramematik Notu", html: "Almanca'da saatlerden önce her zaman <b>um</b> edatı kullanılır." }),
          Object.assign({ id: nextId(), type: "quiz" }, defaultsFor("quiz"), { question: "Yazar sabah saat kaçta uyanıyor?", options: ["7 Uhr", "6 Uhr", "8 Uhr"], correctIndex: 1, explanation: "Metinde 'Ich stehe jeden Morgen um 6 Uhr auf.' ifadesi geçmektedir." })
        );
      } else if (type === "grammar") {
        newBlocks.push(
          Object.assign({ id: nextId(), type: "heading" }, defaultsFor("heading"), { text: "Belirsiz Artıkeller (Unbestimmte Artikel)", level: "h1" }),
          Object.assign({ id: nextId(), type: "paragraph" }, defaultsFor("paragraph"), { html: "Almanca'da bilinmeyen veya genel bir nesneden bahsederken belirsiz artıkeller kullanılır." }),
          Object.assign({ id: nextId(), type: "table" }, defaultsFor("table"), { headers: ["Artıkel", "Belirsiz Hali", "Olumsuz Hali"], rows: [["der (Eril)", "ein", "kein"], ["die (Dişil)", "eine", "keine"], ["das (Nötr)", "ein", "kein"]] }),
          Object.assign({ id: nextId(), type: "accordion" }, defaultsFor("accordion"), { items: [
            { q: "Neden çoğul kelimelerin belirsiz artıkeli yoktur?", a: "Çünkü belirsiz artıkel (ein/eine) 'bir' anlamına gelir. Türkçe'de de 'bir kitaplar' diyemeyeceğimiz gibi Almanca'da da çoğul isimlerin önüne belirsiz artıkel gelmez." },
            { q: "Kein/Keine olumsuzluğu ne zaman kullanılır?", a: "Belirsiz artıkelle ifade edilebilecek isimleri veya artıkeli olmayan isimleri olumsuz yapmak için 'kein' yapısı tercih edilir." }
          ] })
        );
      }
      loadIntoCanvas(newBlocks);
      toast("Şablon başarıyla uygulandı ✓");
    });
  });

  /* ══════════════════════════════════════
     Kendi Şablonların (localStorage) — en zahmetsiz yol:
     tarayıcıda saklanır, dosya indirip yüklemeye gerek yok.
     ══════════════════════════════════════ */
  const CUSTOM_TPL_KEY = "dersBuilderCustomTemplates";
  const customTplList = $("#customTemplatesList");

  function getCustomTemplates() {
    try {
      const raw = localStorage.getItem(CUSTOM_TPL_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function setCustomTemplates(arr) {
    try { localStorage.setItem(CUSTOM_TPL_KEY, JSON.stringify(arr)); }
    catch (e) { toast("Şablon kaydedilemedi (tarayıcı depolaması dolu olabilir).", "err"); }
  }

  function renderCustomTemplates() {
    const list = getCustomTemplates();
    customTplList.innerHTML = "";
    if (!list.length) {
      customTplList.innerHTML = '<div class="template-empty-hint">Henüz kaydedilmiş şablonun yok. Bir ders hazırlayıp aşağıdaki butonla şablon olarak kaydedebilirsin.</div>';
      return;
    }
    list.forEach(tpl => {
      const row = document.createElement("div");
      row.className = "custom-template-row";
      row.innerHTML =
        '<button class="template-btn" type="button"><span>' + esc(tpl.name) + '</span><small>' + tpl.blockCount + ' blok · ' + esc(tpl.savedAtLabel || "") + '</small></button>' +
        '<button class="tpl-delete-btn" type="button" title="Şablonu sil"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
      row.querySelector(".template-btn").addEventListener("click", () => {
        if (blocks.length && !confirm("Mevcut çalışmanız silinecek, onaylıyor musunuz?")) return;
        loadIntoCanvas(JSON.parse(JSON.stringify(tpl.blocks)), tpl.seq, tpl.tabs ? JSON.parse(JSON.stringify(tpl.tabs)) : undefined);
        toast('"' + tpl.name + '" şablonu yüklendi ✓');
      });
      row.querySelector(".tpl-delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        if (!confirm('"' + tpl.name + '" şablonunu silmek istediğine emin misin?')) return;
        setCustomTemplates(getCustomTemplates().filter(t => t.id !== tpl.id));
        renderCustomTemplates();
        toast("Şablon silindi");
      });
      customTplList.appendChild(row);
    });
  }

  $("#btnSaveAsTemplate").addEventListener("click", () => {
    if (!blocks.length) { toast("Şablon olarak kaydetmek için önce en az bir blok ekleyin.", "err"); return; }
    const name = prompt('Şablon için bir isim yaz (örn. "A2 Kelime Dersi"):', "");
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) { toast("Şablon adı boş olamaz.", "err"); return; }
    const list = getCustomTemplates();
    list.push({
      id: "tpl" + Date.now(),
      name: trimmed,
      blocks: JSON.parse(JSON.stringify(blocks)),
      seq: seq,
      tabs: JSON.parse(JSON.stringify(projectTabs)),
      blockCount: blocks.length,
      savedAtLabel: new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })
    });
    setCustomTemplates(list);
    renderCustomTemplates();
    toast('"' + trimmed + '" şablon olarak kaydedildi ✓');
  });

  renderCustomTemplates();