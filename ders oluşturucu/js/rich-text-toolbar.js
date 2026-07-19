"use strict";
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

