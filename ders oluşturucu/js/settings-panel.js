"use strict";
/* ═══════════════════════════════════════════════════════════
   4) BLOK AYAR PANELİ (sağdaki ⚙ paneli)
   Bu dosya, app.js'nin bölünmesiyle oluşturulmuştur.
   Diğer js/*.js dosyalarıyla aynı global scope'u paylaşır
   (module DEĞİLDİR) — bu yüzden index.html'deki script sırası önemlidir.
   ═══════════════════════════════════════════════════════════ */
  function fg(label, inner) { return '<div class="field-group"><label>' + label + '</label>' + inner + '</div>'; }
  function selectHtml(field, opts, current) {
    let h = '<select data-f="' + field + '">';
    opts.forEach(o => { h += '<option value="' + o[0] + '"' + (o[0] === current ? " selected" : "") + '>' + o[1] + '</option>'; });
    return h + "</select>";
  }
  function rangeHtml(field, min, max, val, suffix) {
    return '<div style="display:flex;align-items:center;gap:8px;"><input type="range" data-f="' + field + '" min="' + min + '" max="' + max + '" value="' + val + '"><span class="range-val" data-rangeval>' + val + (suffix||"") + '</span></div>';
  }
  function alignBtnsHtml(field, current, noJustify) {
    const opts = [["left", ICO.alignL], ["center", ICO.alignC], ["right", ICO.alignR]];
    if (!noJustify) opts.push(["justify", ICO.alignJ]);
    let h = '<div class="align-btns" data-f="' + field + '">';
    opts.forEach(o => { h += '<button type="button" data-val="' + o[0] + '" class="' + (o[0] === current ? "active" : "") + '">' + o[1] + '</button>'; });
    return h + "</div>";
  }
  function themeBtnsHtml(current) {
    let h = '<div class="align-btns" data-f="theme">';
    Object.keys(THEME_META).forEach(k => { h += '<button type="button" data-val="' + k + '" class="' + (k === current ? "active" : "") + '" style="color:' + THEME_META[k].css + ';" title="' + THEME_META[k].label + '">●</button>'; });
    return h + "</div>";
  }
  function rgbaToHex(rgba) {
    if (!rgba) return "#ffffff";
    if (rgba[0] === "#") return rgba;
    const m = rgba.match(/[\d.]+/g);
    if (!m) return "#ffffff";
    const [r,g,b] = m;
    return "#" + [r,g,b].map(n => parseInt(n).toString(16).padStart(2,"0")).join("");
  }
  /* Bir arka plan rengine göre okunaklı (yeterli kontrastlı) bir metin rengi
     önerir: WCAG göreli parlaklık hesaplanır, açık arka planlara koyu (#0f172a),
     koyu arka planlara beyaz (#ffffff) metin rengi döner. */
  function idealTextColor(hex) {
    if (!hex) return null;
    let h = String(hex).replace("#", "").trim();
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
    const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
    const toLin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const L = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
    return L > 0.45 ? "#0f172a" : "#ffffff";
  }
  const PALETTE = ["#ffffff","#0f172a","#3b82f6","#60a5fa","#4fd69c","#ffd250","#f07068","#a78bfa","#f472b6","#94a3b8","#000000"];
  function colorFieldHtml(field, value) {
    let sw = '<div class="color-swatches" data-f-swatch="' + field + '">';
    PALETTE.forEach(c => { sw += '<button type="button" data-c="' + c + '" style="background:' + c + '" title="' + c + '"></button>'; });
    sw += "</div>";
    return '<div class="color-field"><input type="color" data-f="' + field + '" value="' + value + '">' + sw + '</div>';
  }

  function buildSettingsEl(block) {
    const el = document.createElement("div");
    el.className = "block-settings";
    let h = "";

    if (block.type === "heading") {
      h += fg("Seviye", selectHtml("level", [["h1","H1"],["h2","H2"],["h3","H3"]], block.level));
      h += fg("Boyut (px)", rangeHtml("size", 16, 52, block.size));
      h += fg("Renk", colorFieldHtml("color", block.color));
      h += fg("Kalınlık", selectHtml("weight", [["500","Orta"],["600","Yarı Kalın"],["700","Kalın"],["800","Ekstra Kalın"]], block.weight));
      h += fg("Font", selectHtml("font", FONT_OPTIONS, block.font));
      h += fg("Satır Yüksekliği", rangeHtml("lineHeight", 110, 180, block.lineHeight, "%"));
      h += fg("Harf Aralığı (px)", rangeHtml("letterSpacing", -3, 4, block.letterSpacing));
    } else if (block.type === "paragraph") {
      h += fg("Stil", selectHtml("variant", [["normal","Normal"],["quote","Alıntı"],["highlight","Vurgu Kutusu"]], block.variant || "normal"));
      h += fg("Büyük Baş Harf (Drop Cap)", selectHtml("dropCap", [["0","Kapalı"],["1","Açık"]], block.dropCap ? "1" : "0"));
      h += fg("Boyut (px)", rangeHtml("size", 13, 26, block.size));
      h += fg("Hizalama", alignBtnsHtml("align", block.align));
      h += fg("Renk", colorFieldHtml("color", rgbaToHex(block.color)));
      h += fg("Font", selectHtml("font", FONT_OPTIONS, block.font));
      h += fg("Satır Yüksekliği", rangeHtml("lineHeight", 140, 220, block.lineHeight, "%"));
      h += fg("Harf Aralığı (px)", rangeHtml("letterSpacing", -2, 4, block.letterSpacing));
    } else if (block.type === "image") {
      h += fg("Genişlik (%)", rangeHtml("width", 20, 100, block.width));
      h += fg("Yükseklik (px, boş = otomatik)", '<input type="number" data-f="height" min="0" placeholder="auto" value="' + (block.height || "") + '" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">');
      h += fg("Köşe Yuvarlama (px)", rangeHtml("radius", 0, 40, block.radius));
      h += fg("Nesne Sığdırma (Object Fit)", selectHtml("objectFit", [["cover","Kırp (Cover)"],["contain","Sığdır (Contain)"],["fill","Doldur (Fill)"],["none","Orijinal (None)"]], block.objectFit));
      h += fg("Gölge", selectHtml("shadow", [["0","Kapalı"],["1","Açık"]], block.shadow));
      h += fg("Lazy Loading", selectHtml("lazy", [["1","Açık (önerilen)"],["0","Kapalı"]], block.lazy));
      h += fg("Hizalama", alignBtnsHtml("align", block.align, true));
    } else if (block.type === "callout") {
      h += fg("Tema", themeBtnsHtml(block.theme));
    } else if (block.type === "vocab") {
      h += fg("Kart Boyutu", selectHtml("cardSize", [["large","Büyük"],["medium","Orta"],["small","Küçük"]], block.cardSize || "medium"));
    }

    const hasBg = block.type !== "paragraph";
    h += '<div class="settings-divider"></div><div class="settings-group-label">Boşluk' + (hasBg ? " &amp; Arka Plan" : " (Arka plan her zaman şeffaftır)") + '</div>';
    h += fg("İç Boşluk Y (px)", rangeHtml("padY", 0, 60, block.padY));
    h += fg("İç Boşluk X (px)", rangeHtml("padX", 0, 60, block.padX));
    h += fg("Dış Boşluk (px)", rangeHtml("marginY", 0, 60, block.marginY));
    if (hasBg) {
      h += fg("Arka Plan Rengi", colorFieldHtml("bgColor", block.bgColor || "#3b82f6"));
      h += fg("Şeffaflık (%)", rangeHtml("bgOpacity", 0, 100, block.bgOpacity));
    }

    el.innerHTML = h;
    wireSettings(el, block);
    return el;
  }

  function wireSettings(el, block) {
    $all("select, input[type=color], input[type=range], input[type=number]", el).forEach(inp => {
      const field = inp.dataset.f;
      inp.addEventListener("input", () => {
        let val = inp.value;
        if (inp.type === "range") {
          val = Number(val);
          const span = inp.parentElement.querySelector("[data-rangeval]");
          if (span) span.textContent = val + (field === "lineHeight" ? "%" : "");
        }
        if (inp.type === "color" && field === "bgColor" && !block.bgColor) {
          if (!block.bgOpacity) block.bgOpacity = 30;
        }
        if (inp.type === "color" && field === "color") {
          // Kullanıcı metin rengini elle seçti — bundan sonra arka plan değişse bile
          // otomatik kontrast bu rengin üzerine yazmasın.
          block.colorManual = true;
        }
        block[field] = val;
        // Arka plan rengi değişince (kullanıcı elle bir metin rengi seçmediyse) hiçbir
        // yazı silik kalmasın diye otomatik olarak okunaklı, zıt bir metin rengi seç.
        if (field === "bgColor" && !block.colorManual && (block.type === "heading" || block.type === "paragraph")) {
          const auto = idealTextColor(val);
          if (auto) {
            block.color = auto;
            const colorInput = el.querySelector('input[type="color"][data-f="color"]');
            if (colorInput) colorInput.value = auto;
          }
        }
        // Başlık seviyesi (H1/H2/H3) değişince boyutu da o seviyeye uygun
        // hale getir — "boyut çalışmıyor" hissinin asıl nedeni buydu.
        if (block.type === "heading" && field === "level") {
          const preset = { h1: 36, h2: 28, h3: 22 }[val];
          if (preset) {
            block.size = preset;
            const sizeInput = el.querySelector('input[type="range"][data-f="size"]');
            if (sizeInput) {
              sizeInput.value = preset;
              const sizeSpan = sizeInput.parentElement.querySelector("[data-rangeval]");
              if (sizeSpan) sizeSpan.textContent = preset;
            }
          }
        }
        applyBlockStyle(block);
      });
    });
    $all('[data-f="align"] button, [data-f="theme"] button', el).forEach(btn => {
      btn.addEventListener("click", () => {
        const group = btn.parentElement;
        const field = group.dataset.f;
        $all("button", group).forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        block[field] = btn.dataset.val;
        applyBlockStyle(block);
      });
    });
    $all(".color-swatches button", el).forEach(btn => {
      btn.addEventListener("click", () => {
        const field = btn.parentElement.dataset.fSwatch;
        const input = el.querySelector('input[type="color"][data-f="' + field + '"]');
        if (input) { input.value = btn.dataset.c; input.dispatchEvent(new Event("input", { bubbles: true })); }
      });
    });
  }

  function applyBlockStyle(block) {
    const wrap = $('.block[data-id="' + block.id + '"]');
    if (!wrap) return;
    const contentEl = wrap.querySelector(".block-content");
    if (contentEl) contentEl.style.cssText = wrapperStyle(block, block.type === "paragraph");

    if (block.type === "heading") {
      const el2 = wrap.querySelector(".hp-editable");
      if (el2) el2.style.cssText = "font-family:" + fontStack(block.font) + ";font-size:" + block.size + "px;color:" + block.color + ";font-weight:" + block.weight + ";line-height:" + (block.lineHeight/100) + ";letter-spacing:" + block.letterSpacing + "px;flex:1;min-width:0;";
    } else if (block.type === "paragraph") {
      const el2 = wrap.querySelector(".hp-editable");
      if (el2) el2.style.cssText = "font-family:" + fontStack(block.font) + ";font-size:" + block.size + "px;color:" + block.color + ";text-align:" + block.align + ";line-height:" + (block.lineHeight/100) + ";letter-spacing:" + block.letterSpacing + "px;flex:1;min-width:0;";
    } else if (block.type === "image") {
      const img = wrap.querySelector("img.preview-img");
      const holder = wrap.querySelector(".img-align-holder");
      if (img) {
        img.style.width = block.width + "%";
        img.style.height = block.height ? (block.height + "px") : "auto";
        img.style.borderRadius = block.radius + "px";
        img.style.objectFit = block.objectFit || "cover";
        img.style.boxShadow = (block.shadow === "1") ? "0 16px 40px rgba(0,0,0,.4)" : "none";
      }
      if (holder) holder.style.textAlign = block.align;
    } else if (block.type === "callout") {
      const cbox = wrap.querySelector(".callout-prev");
      if (cbox) {
        cbox.dataset.theme = block.theme;
        const icoEl = cbox.querySelector(".callout-prev-ico");
        if (icoEl) icoEl.innerHTML = CALLOUT_ICON[block.theme];
      }
    }
  }

