"use strict";
/* ═══════════════════════════════════════════════════════════
   3) CANVAS / BLOK YÖNETİMİ (ekle-taşı-sil-render)
   Bu dosya, app.js'nin bölünmesiyle oluşturulmuştur.
   Diğer js/*.js dosyalarıyla aynı global scope'u paylaşır
   (module DEĞİLDİR) — bu yüzden index.html'deki script sırası önemlidir.
   ═══════════════════════════════════════════════════════════ */
  function toast(msg, type) {
    $all(".dc-toast").forEach(t => t.remove());
    const el = document.createElement("div");
    el.className = "dc-toast " + (type || "ok");
    el.innerHTML = (type === "err" ? ICO.warn : ICO.check) + "<span>" + esc(msg) + "</span>";
    document.body.appendChild(el);
    setTimeout(() => { el.style.transition = "opacity .3s"; el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 2400);
  }

  function addBlock(type) {
    const block = Object.assign({ id: nextId(), type: type }, defaultsFor(type));
    if (type === "heading" || type === "paragraph") {
      const auto = idealTextColor(pageBgHex());
      if (auto) block.color = auto;
    }
    blocks.push(block);
    focusedBlockId = block.id;
    renderAll();
    const el = $('.block[data-id="' + block.id + '"]');
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function moveBlock(id, dir) {
    const i = blocks.findIndex(b => b.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= blocks.length) return;
    const tmp = blocks[i]; blocks[i] = blocks[j]; blocks[j] = tmp;
    renderAll();
  }
  function deleteBlock(id) {
    if (!confirm("Bu bloğu silmek istediğinize emin misiniz?")) return;
    blocks = blocks.filter(b => b.id !== id);
    if (activeBlockId === id) activeBlockId = null;
    if (focusedBlockId === id) focusedBlockId = null;
    renderAll();
  }
  function clearAll() {
    if (!blocks.length) return;
    if (!confirm("Tüm bloklar silinecek. Emin misiniz?")) return;
    blocks = []; activeBlockId = null; focusedBlockId = null; renderAll();
  }

  /* Her bloğun kendi ayar panelini açar/kapatır (artık tek, ortak bir üst
     editör barı yok — ayarlar ⚙ ikonuna basılan bloğun kendi üzerinde açılır) */
  function toggleBlockSettings(block) {
    activeBlockId = (activeBlockId === block.id) ? null : block.id;
    if (activeBlockId) focusedBlockId = activeBlockId;
    renderAll();
  }
  function closeBlockSettings() {
    if (!activeBlockId) return;
    activeBlockId = null;
    renderAll();
  }
  /* Panelin gövdesini üretir: başlık + kapat düğmesi + ayar alanları */
  function buildBlockSettingsPanel(block) {
    const panel = document.createElement("div");
    panel.className = "block-settings-panel open";
    const header = document.createElement("div");
    header.className = "bsp-header";
    header.innerHTML = '<span class="bsp-label">' + iconFor(block.type) + '<span>' + TYPE_LABEL[block.type] + ' Ayarları</span></span>';
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "bsp-close";
    closeBtn.title = "Ayarları kapat (Esc)";
    closeBtn.innerHTML = ICO.close;
    closeBtn.addEventListener("click", (e) => { e.stopPropagation(); closeBlockSettings(); });
    header.appendChild(closeBtn);
    panel.appendChild(header);
    const settingsEl = buildSettingsEl(block);
    settingsEl.classList.add("open");
    panel.appendChild(settingsEl);
    return panel;
  }
  /* Dışarı (herhangi bir bloğun ve çubukların dışına) tıklayınca ya da
     Esc'e basınca açık olan ayar panelini kapat */
  document.addEventListener("mousedown", (e) => {
    if (!activeBlockId) return;
    if (e.target.closest(".block") || e.target.closest(".rt-toolbar") ||
        e.target.closest(".modal-overlay") || e.target.closest(".preview-overlay")) return;
    closeBlockSettings();
  });
  /* Bir bloğa tıklanınca araç çubuğunu göster; boş bir alana ya da başka bir
     bloğa tıklanınca gizle (ayar panelini/RT araç çubuğunu/modalları etkilemeden) */
  document.addEventListener("mousedown", (e) => {
    const blockEl = e.target.closest(".block");
    if (blockEl) { setBlockFocus(blockEl.dataset.id); return; }
    if (e.target.closest(".rt-toolbar") || e.target.closest(".modal-overlay") ||
        e.target.closest(".preview-overlay")) return;
    setBlockFocus(null);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeBlockId) closeBlockSettings();
  });

  function renderAll() {
    const canvas = $("#canvas");
    canvas.innerHTML = "";
    $("#blockCount").textContent = blocks.length + " blok";
    if (!blocks.length) {
      canvas.innerHTML =
        '<div class="empty-state"><div class="es-ico"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>' +
        '<h3>Henüz blok yok</h3><p>Soldaki panelden bir blok türü seçerek dersinizi oluşturmaya başlayın.</p></div>';
      activeBlockId = null;
      return;
    }
    blocks.forEach((block, idx) => canvas.appendChild(buildBlockEl(block, idx)));
    const active = blocks.find(b => b.id === activeBlockId);
    if (!active) activeBlockId = null;
  }

  function buildBlockEl(block, idx) {
    const wrap = document.createElement("div");
    wrap.className = "block"; wrap.dataset.id = block.id; wrap.dataset.type = block.type;
    if (block.id === activeBlockId) wrap.classList.add("block-active");
    if (block.id === focusedBlockId) wrap.classList.add("block-focused");

    const toolbar = document.createElement("div");
    toolbar.className = "block-toolbar";
    toolbar.innerHTML =
      '<div class="block-type-label"><span class="block-drag-handle" draggable="true" title="Sürükleyerek taşı">' + ICO.grip + '</span>' + iconFor(block.type) + '<span>' + TYPE_LABEL[block.type] + '</span></div>' +
      '<div class="block-actions">' +
        '<button data-act="up" title="Yukarı taşı"' + (idx === 0 ? " disabled" : "") + '>' + ICO.up + '</button>' +
        '<button data-act="down" title="Aşağı taşı"' + (idx === blocks.length - 1 ? " disabled" : "") + '>' + ICO.down + '</button>' +
        '<button data-act="settings" title="Ayarları aç/kapat">' + ICO.gear + '</button>' +
        '<button data-act="delete" class="danger" title="Bloğu sil">' + ICO.trash + '</button>' +
      '</div>';
    wrap.appendChild(toolbar);
    toolbar.querySelector('[data-act="up"]').addEventListener("click", (e) => { e.stopPropagation(); moveBlock(block.id, "up"); });
    toolbar.querySelector('[data-act="down"]').addEventListener("click", (e) => { e.stopPropagation(); moveBlock(block.id, "down"); });
    toolbar.querySelector('[data-act="delete"]').addEventListener("click", (e) => { e.stopPropagation(); deleteBlock(block.id); });
    toolbar.querySelector('[data-act="settings"]').addEventListener("click", (e) => { e.stopPropagation(); toggleBlockSettings(block); });

    const handle = toolbar.querySelector(".block-drag-handle");
    handle.addEventListener("dragstart", (e) => {
      draggingBlockId = block.id;
      wrap.classList.add("block-dragging");
      document.body.classList.add("block-tool-dragging");
      try { e.dataTransfer.setData("text/plain", "block:" + block.id); } catch (err) {}
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setDragImage(wrap, 24, 24); } catch (err) {}
    });
    handle.addEventListener("dragend", () => {
      draggingBlockId = null;
      wrap.classList.remove("block-dragging");
      document.body.classList.remove("block-tool-dragging");
      $all(".block.block-drop-before, .block.block-drop-after", $("#canvas")).forEach(el => el.classList.remove("block-drop-before", "block-drop-after"));
    });

    if (block.id === activeBlockId) {
      wrap.appendChild(buildBlockSettingsPanel(block));
    }

    const content = document.createElement("div");
    content.className = "block-content";
    content.style.cssText = wrapperStyle(block, block.type === "paragraph");
    buildContentEl(block, content);
    wrap.appendChild(content);
    return wrap;
  }

  // Bloklar arası sürükle-bırak ile yeniden sıralama: soldaki tutamaçtan (grip)
  // sürüklenen bir blok, canvas üzerindeki diğer blokların arasına bırakılabilir.
  function setupBlockDragReorder() {
    const canvasEl = document.getElementById("canvas");
    if (!canvasEl) return;

    canvasEl.addEventListener("dragover", (e) => {
      if (!draggingBlockId) return;
      const target = e.target.closest(".block");
      if (!target || target.dataset.id === draggingBlockId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const rect = target.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      $all(".block.block-drop-before, .block.block-drop-after", canvasEl).forEach(el => { if (el !== target) el.classList.remove("block-drop-before", "block-drop-after"); });
      target.classList.toggle("block-drop-before", before);
      target.classList.toggle("block-drop-after", !before);
    });

    canvasEl.addEventListener("dragleave", (e) => {
      const target = e.target.closest(".block");
      if (target) target.classList.remove("block-drop-before", "block-drop-after");
    });

    canvasEl.addEventListener("drop", (e) => {
      if (!draggingBlockId) return;
      const target = e.target.closest(".block");
      if (!target || target.dataset.id === draggingBlockId) return;
      e.preventDefault();
      const before = target.classList.contains("block-drop-before");
      target.classList.remove("block-drop-before", "block-drop-after");

      const fromIdx = blocks.findIndex(b => b.id === draggingBlockId);
      let toIdx = blocks.findIndex(b => b.id === target.dataset.id);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

      const [moved] = blocks.splice(fromIdx, 1);
      toIdx = blocks.findIndex(b => b.id === target.dataset.id);
      const insertAt = before ? toIdx : toIdx + 1;
      blocks.splice(insertAt, 0, moved);

      draggingBlockId = null;
      renderAll();
      const el = $('.block[data-id="' + moved.id + '"]');
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

