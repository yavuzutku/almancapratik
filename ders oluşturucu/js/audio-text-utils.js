"use strict";
/* ═══════════════════════════════════════════════════════════
   2) SESLİ OKUMA SÜRÜKLE-BIRAK + METİN YARDIMCILARI
   Bu dosya, app.js'nin bölünmesiyle oluşturulmuştur.
   Diğer js/*.js dosyalarıyla aynı global scope'u paylaşır
   (module DEĞİLDİR) — bu yüzden index.html'deki script sırası önemlidir.
   ═══════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════
     Sürükle-Bırak Sesli Okuma Aracı
     Soldaki sabit "Sesli Okuma Aracı" istenen herhangi bir metin kutusunun
     üzerine sürüklenip bırakılınca, sadece o kutu için sesli okuma
     (TTS oynatma düğmesi) etkinleşir. block.audioSlots = { slotKey: true }
     şeklinde saklanır; tekrar tıklanınca kaldırılabilir.
     ══════════════════════════════════════ */
  let audioToolDragging = false;

  // Bir blok içindeki belirli bir "slot" (örn. "text", "title", "opt0") için
  // düzenleme ekranında görünen küçük sesli okuma rozetini üretir.
  function audioSlotBadgeHtml(block, slot) {
    const active = !!(block.audioSlots && block.audioSlots[slot]);
    return '<button type="button" class="audio-slot-badge' + (active ? ' active' : '') + '" data-audioslot="' + slot + '" ' +
      'title="' + (active ? "Sesli okumayı kaldır" : "Sesli okuma eklemek için buraya sürükleyin ya da tıklayın") + '">' + ICO.tts + '</button>';
  }

  // Belirli bir slotu sürükle-bırak (veya doğrudan tıklama) ile açıp kapatmak için
  // kutuyu saran wrapper'ın açılış etiketini üretir.
  function audioDropOpenTag(block, slot, extraCls) {
    return '<div class="audio-drop-target' + (extraCls ? " " + extraCls : "") + '" data-block="' + block.id + '" data-slot="' + slot + '">';
  }

  // DOM tabanlı editör alanları (heading/paragraph gibi contentEditable kutular) için:
  // içine hem asıl elemanı hem de sesli okuma rozetini koyabileceğimiz bir sarmalayıcı üretir.
  function audioInlineWrap(block, slot) {
    const wrap = document.createElement("div");
    wrap.className = "audio-drop-target audio-drop-inline";
    wrap.dataset.block = block.id;
    wrap.dataset.slot = slot;
    const tmp = document.createElement("div");
    tmp.innerHTML = audioSlotBadgeHtml(block, slot);
    return { wrap, badgeBtn: tmp.firstElementChild };
  }

  // Bir konteynerin içindeki tüm sesli okuma rozetlerine tıklama olayını bağlar.
  // Rozete tıklamak, o slotun sesli okuma durumunu açar/kapatır (sürüklemenin alternatifi).
  function wireAudioSlotBadges(container, block) {
    $all(".audio-slot-badge", container).forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const slot = btn.dataset.audioslot;
        block.audioSlots = block.audioSlots || {};
        block.audioSlots[slot] = !block.audioSlots[slot];
        btn.classList.toggle("active", block.audioSlots[slot]);
        btn.title = block.audioSlots[slot] ? "Sesli okumayı kaldır" : "Sesli okuma eklemek için buraya sürükleyin ya da tıklayın";
      });
    });
  }

  // Soldaki sabit sürükle-bırak aracını ve tüm ".audio-drop-target" alanlarını
  // dinleyen global sürükle-bırak mantığını kurar. Sayfa yüklenince bir kez çağrılır.
  function setupAudioDragTool() {
    const tool = document.getElementById("ttsDragTool");
    const canvasEl = document.getElementById("canvas");
    if (!tool || !canvasEl) return;

    tool.addEventListener("dragstart", (e) => {
      audioToolDragging = true;
      try { e.dataTransfer.setData("text/plain", "audio-tool"); } catch (err) {}
      e.dataTransfer.effectAllowed = "copy";
      document.body.classList.add("audio-tool-dragging");
    });
    tool.addEventListener("dragend", () => {
      audioToolDragging = false;
      document.body.classList.remove("audio-tool-dragging");
      $all(".audio-drop-target.audio-drop-hover", canvasEl).forEach(t => t.classList.remove("audio-drop-hover"));
    });

    canvasEl.addEventListener("dragover", (e) => {
      if (!audioToolDragging) return;
      const target = e.target.closest(".audio-drop-target");
      if (!target) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      target.classList.add("audio-drop-hover");
    });
    canvasEl.addEventListener("dragleave", (e) => {
      const target = e.target.closest(".audio-drop-target");
      if (target) target.classList.remove("audio-drop-hover");
    });
    canvasEl.addEventListener("drop", (e) => {
      const target = e.target.closest(".audio-drop-target");
      if (!target || !audioToolDragging) return;
      e.preventDefault();
      target.classList.remove("audio-drop-hover");
      const blockId = target.dataset.block, slot = target.dataset.slot;
      const block = blocks.find(b => b.id === blockId);
      if (!block) return;
      block.audioSlots = block.audioSlots || {};
      block.audioSlots[slot] = true;
      let badge = target.querySelector('.audio-slot-badge[data-audioslot="' + slot + '"]');
      if (!badge) badge = target.querySelector(".audio-slot-badge");
      if (badge) {
        badge.classList.add("active");
        badge.title = "Sesli okumayı kaldır";
      }
      toast("🔊 Sesli okuma eklendi ✓");
    });
  }

  // Tablo bloğunda hangi başlık/hücrelerin sesli okunacağını tutan dizileri satır/sütun sayısıyla eşitler
  // (eski projelerde bu alanlar hiç yoksa veya satır/sütun eklenip silinince boyutlar kayarsa güvenli hale getirir)
  function ensureTableAudioShape(b) {
    if (!Array.isArray(b.audioHeaders)) b.audioHeaders = [];
    while (b.audioHeaders.length < b.headers.length) b.audioHeaders.push(false);
    b.audioHeaders.length = b.headers.length;
    if (!Array.isArray(b.audioCells)) b.audioCells = [];
    while (b.audioCells.length < b.rows.length) b.audioCells.push([]);
    b.audioCells.length = b.rows.length;
    b.rows.forEach((row, ri) => {
      if (!Array.isArray(b.audioCells[ri])) b.audioCells[ri] = [];
      while (b.audioCells[ri].length < row.length) b.audioCells[ri].push(false);
      b.audioCells[ri].length = row.length;
    });
  }
  function slugify(text) {
    return text.toString().toLowerCase().trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  function convertTooltips(html) {
    return html.replace(/\[([^|\]]+)\|([^\]]+)\]/g, function(match, word, tip) {
      return '<span class="lb-tooltip">' + esc(word) + '<span class="lb-tooltip-bubble">' + esc(tip) + '</span></span>';
    });
  }

  // {{cevap}} sözdiziminden boşluk-doldurma parçalarını ayıklar
  function parseFillBlank(text) {
    const parts = [];
    const re = /\{\{([^}]+)\}\}/g;
    let last = 0, m;
    while ((m = re.exec(text || "")) !== null) {
      parts.push({ type: "text", value: text.slice(last, m.index) });
      parts.push({ type: "blank", value: m[1].trim() });
      last = re.lastIndex;
    }
    parts.push({ type: "text", value: (text || "").slice(last) });
    return parts;
  }
  function shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function parseVideoEmbed(url) {
    if (!url) return "";
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return "https://www.youtube.com/embed/" + match[2];
    }
    let vimeoReg = /vimeo\.com\/(\d+)/;
    let vimeoMatch = url.match(vimeoReg);
    if (vimeoMatch) {
      return "https://player.vimeo.com/video/" + vimeoMatch[1];
    }
    return url;
  }
  const FONT_MAP = {
    body:        "'Inter', sans-serif",
    display:     "'Plus Jakarta Sans', sans-serif",
    serif:       "'Lora', serif",
    merriweather:"'Merriweather', serif",
    playfair:    "'Playfair Display', serif",
    poppins:     "'Poppins', sans-serif",
    montserrat:  "'Montserrat', sans-serif",
    nunito:      "'Nunito', sans-serif"
  };
  const FONT_OPTIONS = [
    ["body", "Inter (Standart)"],
    ["display", "Plus Jakarta Sans (Başlık)"],
    ["serif", "Lora (Serif)"],
    ["merriweather", "Merriweather (Serif Klasik)"],
    ["playfair", "Playfair Display (Zarif Serif)"],
    ["poppins", "Poppins (Yuvarlak)"],
    ["montserrat", "Montserrat (Modern)"],
    ["nunito", "Nunito (Yumuşak)"]
  ];
  function fontStack(key) { return FONT_MAP[key] || FONT_MAP.body; }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function hexToRgba(hex, opacityPct) {
    if (!hex) return "transparent";
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
    return "rgba(" + r + "," + g + "," + b + "," + (opacityPct/100) + ")";
  }
  function wrapperStyle(b, forceTransparent) {
    const bg = forceTransparent ? "transparent" : (b.bgColor ? hexToRgba(b.bgColor, b.bgOpacity) : "transparent");
    return "padding:" + b.padY + "px " + b.padX + "px;margin:" + b.marginY + "px 0;background:" + bg + ";border-radius:12px;";
  }

