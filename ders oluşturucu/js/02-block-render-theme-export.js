"use strict";
/* ═══════════════════════════════════════════════════════════
   JS 2/4 — BLOK ÇİZİMİ: Editör Görünümü + Tema/Önizleme/Export UI
   + Export (Statik) Görünüm
   3 parça dosyadan birleştirilmiştir (sıra ve işlev korunmuştur):
   block-editor-render.js, theme-preview-export-ui.js, block-export-render.js
   ═══════════════════════════════════════════════════════════ */

/* ---------- block-editor-render.js ---------- */
/* ═══════════════════════════════════════════════════════════
   5) EDİTÖR İÇERİK RENDER (buildContentEl)
   Bu dosya, app.js'nin bölünmesiyle oluşturulmuştur.
   Diğer js/*.js dosyalarıyla aynı global scope'u paylaşır
   (module DEĞİLDİR) — bu yüzden index.html'deki script sırası önemlidir.
   ═══════════════════════════════════════════════════════════ */
  function buildContentEl(block, content) {
    if (block.type === "heading") {
      const div = document.createElement("div");
      div.className = "hp-editable"; div.contentEditable = "true"; div.dataset.placeholder = "Başlık metni...";
      div.textContent = block.text;
      div.style.cssText = "font-family:" + fontStack(block.font) + ";font-size:" + block.size + "px;color:" + block.color + ";font-weight:" + block.weight + ";line-height:" + (block.lineHeight/100) + ";letter-spacing:" + block.letterSpacing + "px;flex:1;min-width:0;";
      div.addEventListener("input", () => { block.text = div.textContent; });
      div.addEventListener("keydown", e => { if (e.key === "Enter") e.preventDefault(); });
      const hWrap = audioInlineWrap(block, "text");
      hWrap.wrap.appendChild(div); hWrap.wrap.appendChild(hWrap.badgeBtn);
      content.appendChild(hWrap.wrap);
      wireAudioSlotBadges(hWrap.wrap, block);

    } else if (block.type === "paragraph") {
      const div = document.createElement("div");
      div.className = "hp-editable"; div.contentEditable = "true"; div.dataset.placeholder = "Paragraf metni...";
      div.innerHTML = block.html;
      div.style.cssText = "font-family:" + fontStack(block.font) + ";font-size:" + block.size + "px;color:" + block.color + ";text-align:" + block.align + ";line-height:" + (block.lineHeight/100) + ";letter-spacing:" + block.letterSpacing + "px;flex:1;min-width:0;";
      div.addEventListener("input", () => { block.html = div.innerHTML; });
      const pWrap = audioInlineWrap(block, "html");
      pWrap.wrap.appendChild(div); pWrap.wrap.appendChild(pWrap.badgeBtn);
      content.appendChild(pWrap.wrap);
      wireAudioSlotBadges(pWrap.wrap, block);

    } else if (block.type === "image") {
      const srcTabs = document.createElement("div");
      srcTabs.className = "img-src-tabs";
      srcTabs.style.cssText = "display:flex; gap:6px; margin-bottom:8px;";
      srcTabs.innerHTML =
        '<button type="button" class="btn btn-sm img-src-tab" data-mode="url">URL</button>' +
        '<button type="button" class="btn btn-sm img-src-tab" data-mode="upload">Bilgisayardan Yükle</button>';
      content.appendChild(srcTabs);

      const urlRow = document.createElement("div");
      urlRow.className = "img-url-row";
      urlRow.innerHTML = '<input type="url" placeholder="https://gorsel-url.jpg" value="' + esc(block.url && !block.url.startsWith("data:") ? block.url : "") + '" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">';
      const urlInput = urlRow.querySelector("input");
      content.appendChild(urlRow);

      const uploadRow = document.createElement("div");
      uploadRow.className = "img-upload-row";
      uploadRow.style.display = "none";
      uploadRow.innerHTML = '<input type="file" accept="image/*" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">';
      const fileInput = uploadRow.querySelector("input");
      content.appendChild(uploadRow);

      function setSrcMode(mode) {
        urlRow.style.display = mode === "url" ? "" : "none";
        uploadRow.style.display = mode === "upload" ? "" : "none";
        $all(".img-src-tab", srcTabs).forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
      }
      setSrcMode(block.url && block.url.startsWith("data:") ? "upload" : "url");
      srcTabs.querySelectorAll(".img-src-tab").forEach(b => b.addEventListener("click", () => setSrcMode(b.dataset.mode)));

      const altRow = document.createElement("div");
      altRow.className = "img-alt-row";
      altRow.innerHTML = '<input type="text" placeholder="Alternatif metin (alt)" value="' + esc(block.alt) + '" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; margin-top:6px;">';
      const altInput = altRow.querySelector("input");

      const capRow = document.createElement("div");
      capRow.className = "img-caption-row";
      capRow.innerHTML = '<input type="text" placeholder="Alt yazı (caption, opsiyonel)" value="' + esc(block.caption || "") + '" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; margin-top:6px;">';
      const capInput = capRow.querySelector("input");

      const holder = document.createElement("div");
      holder.className = "img-align-holder";
      holder.style.textAlign = block.align; holder.style.marginTop = "12px";

      function renderImgPreview() {
        holder.innerHTML = "";
        if (block.url) {
          const img = document.createElement("img");
          img.className = "preview-img"; img.src = block.url; img.alt = block.alt;
          img.style.width = block.width + "%";
          img.style.height = block.height ? (block.height + "px") : "auto";
          img.style.borderRadius = block.radius + "px";
          img.style.objectFit = block.objectFit || "cover";
          img.style.boxShadow = (block.shadow === "1") ? "0 16px 40px rgba(0,0,0,.4)" : "none";
          holder.appendChild(img);
        } else {
          holder.innerHTML = '<div class="img-block-empty" style="border:1.5px dashed var(--border); padding:20px; text-align:center; color:var(--text-faint);"><span>Görsel URL girin veya bilgisayardan yükleyin</span></div>';
        }
      }
      urlInput.addEventListener("input", () => { block.url = urlInput.value.trim(); renderImgPreview(); });
      fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) { toast("Görsel 4MB üzerinde, lütfen daha küçük bir dosya seçin.", "err"); return; }
        const reader = new FileReader();
        reader.onload = function (evt) {
          block.url = evt.target.result;
          renderImgPreview();
          toast("Görsel yüklendi ve Base64'e dönüştürüldü ✓");
        };
        reader.readAsDataURL(file);
      });
      altInput.addEventListener("input", () => { block.alt = altInput.value; });
      capInput.addEventListener("input", () => { block.caption = capInput.value; });
      renderImgPreview();
      content.appendChild(altRow); content.appendChild(capRow); content.appendChild(holder);

    } else if (block.type === "vocab") {
      const card = document.createElement("div");
      card.className = "vocab-card-prev";
      card.innerHTML =
        '<div class="vocab-grid">' +
          '<div><label>Almanca</label>' +
            '<div class="audio-drop-target audio-drop-inline" data-block="' + block.id + '" data-slot="de">' +
              '<div class="vocab-editable de-input" contenteditable="true" data-f="de" data-placeholder="Almanca kelime" style="flex:1; min-width:0;">' + block.de + '</div>' +
              audioSlotBadgeHtml(block, "de") +
            '</div>' +
          '</div>' +
          '<div><label>Türkçe</label><div class="vocab-editable" contenteditable="true" data-f="tr" data-placeholder="Türkçe karşılığı" style="width:100%;">' + block.tr + '</div></div>' +
          '<div class="full" style="margin-top:6px;"><label>Okunuşu</label><div class="vocab-editable" contenteditable="true" data-f="phon" data-placeholder="Okunuşu" style="width:100%;">' + block.phon + '</div></div>' +
          '<div class="full" style="margin-top:6px;"><label>Örnek Cümle</label>' +
            '<div class="audio-drop-target audio-drop-inline" data-block="' + block.id + '" data-slot="example">' +
              '<div class="vocab-editable" contenteditable="true" data-f="example" data-placeholder="Örnek cümle" style="flex:1; min-width:0;">' + block.example + '</div>' +
              audioSlotBadgeHtml(block, "example") +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="vocab-tip-toggle" style="margin-top:10px; background:transparent; border:none; color:var(--blue-bright); cursor:pointer;">' + ICO.tip + '<span data-tiplabel>' + (block.tipEnabled ? " İpucunu kaldır" : " + İpucu / Gramer Notu ekle") + '</span></button>' +
        '<div class="vocab-tip-wrap" style="display:' + (block.tipEnabled ? "block" : "none") + '; margin-top:6px;"><textarea style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; min-height:60px;">' + esc(block.tip) + '</textarea></div>';

      $all(".vocab-editable[data-f]", card).forEach(el => {
        el.addEventListener("input", () => { block[el.dataset.f] = el.innerHTML; });
        el.addEventListener("keydown", e => { if (e.key === "Enter") e.preventDefault(); });
      });
      wireAudioSlotBadges(card, block);
      const tipToggle = card.querySelector(".vocab-tip-toggle");
      const tipWrap = card.querySelector(".vocab-tip-wrap");
      const tipLabel = card.querySelector("[data-tiplabel]");
      const tipArea = card.querySelector("textarea");
      tipToggle.addEventListener("click", () => {
        block.tipEnabled = !block.tipEnabled;
        tipWrap.style.display = block.tipEnabled ? "block" : "none";
        tipLabel.textContent = block.tipEnabled ? " İpucunu kaldır" : " + İpucu / Gramer Notu ekle";
      });
      tipArea.addEventListener("input", () => { block.tip = tipArea.value; });
      content.appendChild(card);

    } else if (block.type === "callout") {
      const box = document.createElement("div");
      box.className = "callout-prev"; box.dataset.theme = block.theme;
      box.innerHTML =
        '<div class="callout-prev-ico">' + CALLOUT_ICON[block.theme] + '</div>' +
        '<div class="callout-prev-body-wrap" style="width:100%;">' +
          '<div class="audio-drop-target audio-drop-inline" data-block="' + block.id + '" data-slot="title">' +
            '<div class="callout-prev-title" contenteditable="true" data-placeholder="Başlık" style="font-weight:700; color:white; margin-bottom:4px; flex:1; min-width:0;">' + esc(block.title) + '</div>' +
            audioSlotBadgeHtml(block, "title") +
          '</div>' +
          '<div class="audio-drop-target audio-drop-inline" data-block="' + block.id + '" data-slot="html">' +
            '<div class="callout-prev-body" contenteditable="true" data-placeholder="Metin..." style="color:var(--text-dim); flex:1; min-width:0;">' + block.html + '</div>' +
            audioSlotBadgeHtml(block, "html") +
          '</div>' +
        '</div>';
      box.querySelector(".callout-prev-title").addEventListener("input", function () { block.title = this.textContent; });
      box.querySelector(".callout-prev-body").addEventListener("input", function () { block.html = this.innerHTML; });
      wireAudioSlotBadges(box, block);
      content.appendChild(box);

    } else if (block.type === "table") {
      const wrap2 = document.createElement("div");
      const toolbarRow = document.createElement("div");
      toolbarRow.className = "table-toolbar";
      toolbarRow.innerHTML = '<button class="btn btn-sm" data-tact="addrow">' + ICO.plus + ' Satır</button><button class="btn btn-sm" data-tact="addcol">' + ICO.plus + ' Sütun</button>';
      wrap2.appendChild(toolbarRow);

      const tableEl = document.createElement("table");
      tableEl.className = "tbl-prev";

      function renderTable() {
        ensureTableAudioShape(block);
        let h = "<thead><tr>";
        block.headers.forEach((hd, ci) => {
          h += '<th><div class="tbl-cell-wrap audio-drop-target" data-block="' + block.id + '" data-slot="col:' + ci + '" title="Sesli okuma aracını buraya sürükleyip bırakırsanız bu sütundaki TÜM kutular sesli okunur olur"><span contenteditable="true" data-placeholder="Başlık" data-h="' + ci + '">' + esc(hd) + '</span>' +
            '<button type="button" class="tbl-audio-toggle' + (block.audioHeaders[ci] ? ' active' : '') + '" data-audioh="' + ci + '" title="Bu sütunun tamamını sesli okumaya aç">' + ICO.tts + '</button>' +
            (block.headers.length > 1 ? '<button class="tbl-del-col" data-delcol="' + ci + '" title="Sütunu sil">×</button>' : "") + '</div></th>';
        });
        h += "</tr></thead><tbody>";
        block.rows.forEach((row, ri) => {
          h += '<tr>';
          row.forEach((cell, ci) => {
            h += '<td><div class="tbl-cell-wrap"><span contenteditable="true" data-placeholder="Metin" data-r="' + ri + '" data-c="' + ci + '">' + esc(cell) + '</span>' +
              '<button type="button" class="tbl-audio-toggle' + (block.audioCells[ri][ci] ? ' active' : '') + '" data-audior="' + ri + '" data-audioc="' + ci + '" title="Bu hücreyi sesli okut">' + ICO.tts + '</button>' +
              (ci === row.length - 1 && block.rows.length > 1 ? '<button class="tbl-del-row" data-delrow="' + ri + '" title="Satırı sil">×</button>' : "") + '</div></td>';
          });
          h += '</tr>';
        });
        h += "</tbody>";
        tableEl.innerHTML = h;
        $all("[data-h]", tableEl).forEach(s => s.addEventListener("input", () => { block.headers[+s.dataset.h] = s.textContent; }));
        $all("[data-r]", tableEl).forEach(s => s.addEventListener("input", () => { block.rows[+s.dataset.r][+s.dataset.c] = s.textContent; }));
        $all("[data-h], [data-r]", tableEl).forEach(s => s.addEventListener("keydown", e => { if (e.key === "Enter") e.preventDefault(); }));
        $all("[data-audioh]", tableEl).forEach(b => b.addEventListener("click", () => {
          const ci = +b.dataset.audioh;
          const turningOn = !block.audioHeaders[ci];
          block.audioHeaders[ci] = turningOn;
          if (turningOn) {
            // Sütun başlığındaki ikona basmak, sürükle-bırakla aynı işi yapar:
            // o sütundaki TÜM hücreleri tek seferde sesli okumaya açar.
            block.audioCells.forEach(row => { if (ci < row.length) row[ci] = true; });
            renderTable();
          } else {
            b.classList.toggle("active", false);
          }
        }));
        $all("[data-audior]", tableEl).forEach(b => b.addEventListener("click", () => {
          const ri = +b.dataset.audior, ci = +b.dataset.audioc;
          block.audioCells[ri][ci] = !block.audioCells[ri][ci];
          b.classList.toggle("active", block.audioCells[ri][ci]);
        }));
        $all("th, td", tableEl).forEach(cellEl => {
          cellEl.addEventListener("mousedown", e => {
            if (e.target.closest("[contenteditable]") || e.target.closest("button")) return;
            const editable = cellEl.querySelector("[contenteditable]");
            if (editable) { e.preventDefault(); editable.focus(); }
          });
        });
        $all("[data-delcol]", tableEl).forEach(b => b.addEventListener("click", () => { const ci=+b.dataset.delcol; block.headers.splice(ci,1); block.audioHeaders.splice(ci,1); block.rows.forEach(r=>r.splice(ci,1)); block.audioCells.forEach(r=>r.splice(ci,1)); renderTable(); }));
        $all("[data-delrow]", tableEl).forEach(b => b.addEventListener("click", () => { block.rows.splice(+b.dataset.delrow,1); block.audioCells.splice(+b.dataset.delrow,1); renderTable(); }));
      }
      renderTable();
      wrap2.appendChild(tableEl);
      toolbarRow.querySelector('[data-tact="addrow"]').addEventListener("click", () => { block.rows.push(block.headers.map(()=>"")); block.audioCells.push(block.headers.map(()=>false)); renderTable(); });
      toolbarRow.querySelector('[data-tact="addcol"]').addEventListener("click", () => { block.headers.push("Sütun " + (block.headers.length+1)); block.audioHeaders.push(false); block.rows.forEach(r=>r.push("")); block.audioCells.forEach(r=>r.push(false)); renderTable(); });
      content.appendChild(wrap2);

    } else if (block.type === "quiz") {
      const card = document.createElement("div");
      card.style.cssText = "background:rgba(59,130,246,0.04); border:1px solid var(--border); padding:16px; border-radius:10px;";
      card.innerHTML = `
        <div class="audio-drop-target audio-drop-inline" data-block="${block.id}" data-slot="question">
          <input type="text" class="q-title" placeholder="Soru metni" value="${esc(block.question)}" style="flex:1; min-width:0; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-weight:700;">
          ${audioSlotBadgeHtml(block, "question")}
        </div>
        <div class="opts-list" style="margin-top:10px; display:flex; flex-direction:column; gap:6px;"></div>
        <button class="btn btn-sm add-opt" style="margin-top:8px;">+ Seçenek Ekle</button>
        <textarea class="q-explain" placeholder="Doğru cevap açıklaması" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; min-height:50px; margin-top:8px;">${esc(block.explanation)}</textarea>
      `;
      wireAudioSlotBadges(card, block);
      const optsList = card.querySelector(".opts-list");
      function renderQuizOpts() {
        optsList.innerHTML = "";
        block.options.forEach((opt, i) => {
          const row = document.createElement("div");
          row.className = "audio-drop-target audio-drop-inline";
          row.dataset.block = block.id; row.dataset.slot = "opt" + i;
          row.style.cssText = "display:flex; align-items:center; gap:8px;";
          row.innerHTML = `
            <input type="radio" name="correct_${block.id}" ${block.correctIndex === i ? "checked" : ""} style="accent-color:var(--green);">
            <input type="text" value="${esc(opt)}" style="flex:1; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
            ${audioSlotBadgeHtml(block, "opt" + i)}
            <button class="del-opt" style="background:transparent; border:none; color:var(--rose); cursor:pointer;">×</button>
          `;
          row.querySelector("input[type=radio]").addEventListener("change", () => { block.correctIndex = i; });
          row.querySelector("input[type=text]").addEventListener("input", function() { block.options[i] = this.value; });
          row.querySelector(".del-opt").addEventListener("click", () => { if(block.options.length > 2) { block.options.splice(i,1); if(block.correctIndex >= block.options.length) block.correctIndex=0; renderQuizOpts(); } });
          wireAudioSlotBadges(row, block);
          optsList.appendChild(row);
        });
      }
      card.querySelector(".add-opt").addEventListener("click", () => { block.options.push("Yeni Seçenek"); renderQuizOpts(); });
      card.querySelector(".q-title").addEventListener("input", function() { block.question = this.value; });
      card.querySelector(".q-explain").addEventListener("input", function() { block.explanation = this.value; });
      renderQuizOpts();
      content.appendChild(card);

    } else if (block.type === "fillblank") {
      const card = document.createElement("div");
      card.style.cssText = "background:rgba(59,130,246,0.04); border:1px solid var(--border); padding:16px; border-radius:10px;";
      card.innerHTML = `
        <input type="text" class="fib-instr" placeholder="Yönerge / talimat metni" value="${esc(block.instruction)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-weight:600;">
        <div class="audio-drop-target audio-drop-inline" data-block="${block.id}" data-slot="text" style="margin-top:8px; align-items:flex-start;">
          <textarea class="fib-text" placeholder="Metni yazın, boşluk yapılacak kelimeleri {{ }} içine alın. Örn: Ich {{gehe}} ins Kino." style="flex:1; min-width:0; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; min-height:80px; font-family:monospace; font-size:13px;">${esc(block.text)}</textarea>
          ${audioSlotBadgeHtml(block, "text")}
        </div>
        <div style="margin-top:8px; font-size:11.5px; color:var(--text-faint);">İpucu: boşluğa dönüşecek kelimeyi çift süslü parantez içine yazın — <code>{{cevap}}</code></div>
      `;
      wireAudioSlotBadges(card, block);
      card.querySelector(".fib-instr").addEventListener("input", function() { block.instruction = this.value; });
      card.querySelector(".fib-text").addEventListener("input", function() { block.text = this.value; });
      content.appendChild(card);

    } else if (block.type === "matching") {
      const card = document.createElement("div");
      card.innerHTML = `<input type="text" class="match-instr" placeholder="Yönerge / talimat metni" value="${esc(block.instruction)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-weight:600; margin-bottom:10px;">`;
      card.querySelector(".match-instr").addEventListener("input", function() { block.instruction = this.value; });

      const modeRow = document.createElement("div");
      modeRow.style.cssText = "display:flex; gap:6px; margin-bottom:12px;";
      modeRow.innerHTML =
        '<button type="button" class="btn btn-sm match-mode-btn" data-mode="text">Metin ↔ Metin</button>' +
        '<button type="button" class="btn btn-sm match-mode-btn" data-mode="image">Görsel ↔ Metin</button>' +
        '<button type="button" class="btn btn-sm match-mode-btn" data-mode="mixed">Metin ↔ Görsel</button>';
      card.appendChild(modeRow);

      const pairsWrap = document.createElement("div");
      let dragFromIdx = null;

      function pairImgUploadBtn(p, i, rerender) {
        const wrap2 = document.createElement("div");
        wrap2.style.cssText = "display:flex; align-items:center; gap:6px; flex:1;";
        const thumb = document.createElement("img");
        thumb.className = "match-img-thumb";
        thumb.style.display = p.image ? "" : "none";
        thumb.src = p.image || "";
        const fileBtn = document.createElement("input");
        fileBtn.type = "file"; fileBtn.accept = "image/*"; fileBtn.className = "match-img-upload-btn";
        fileBtn.style.cssText = "flex:1; padding:5px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-size:11px;";
        fileBtn.addEventListener("change", () => {
          const file = fileBtn.files[0];
          if (!file) return;
          if (file.size > 3 * 1024 * 1024) { toast("Görsel 3MB üzerinde.", "err"); return; }
          const reader = new FileReader();
          reader.onload = (evt) => { p.image = evt.target.result; rerender(); };
          reader.readAsDataURL(file);
        });
        wrap2.appendChild(thumb); wrap2.appendChild(fileBtn);
        return wrap2;
      }

      function renderPairs() {
        pairsWrap.innerHTML = "";
        $all(".match-mode-btn", modeRow).forEach(b => b.classList.toggle("active", b.dataset.mode === block.mode));

        block.pairs.forEach((p, i) => {
          const row = document.createElement("div");
          row.className = "match-drag-row";
          row.draggable = true;
          row.dataset.idx = i;

          const handle = document.createElement("span");
          handle.className = "match-drag-handle";
          handle.title = "Sürükleyerek sırala";
          handle.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="6" r="1.6"/><circle cx="8" cy="12" r="1.6"/><circle cx="8" cy="18" r="1.6"/><circle cx="16" cy="6" r="1.6"/><circle cx="16" cy="12" r="1.6"/><circle cx="16" cy="18" r="1.6"/></svg>';
          row.appendChild(handle);

          // Sol taraf
          if (block.mode === "image") {
            row.appendChild(pairImgUploadBtn(p, i, renderPairs));
          } else {
            const leftWrap = document.createElement("div");
            leftWrap.className = "audio-drop-target audio-drop-inline";
            leftWrap.dataset.block = block.id;
            leftWrap.dataset.slot = "left" + i;
            leftWrap.style.flex = "1";
            leftWrap.style.minWidth = "0";
            const leftInput = document.createElement("input");
            leftInput.type = "text"; leftInput.value = p.left; leftInput.placeholder = "Sol (örn: das Haus)";
            leftInput.style.cssText = "flex:1; min-width:0; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;";
            leftInput.addEventListener("input", function() { p.left = this.value; });
            leftWrap.appendChild(leftInput);
            const leftBadgeHolder = document.createElement("div");
            leftBadgeHolder.innerHTML = audioSlotBadgeHtml(block, "left" + i);
            leftWrap.appendChild(leftBadgeHolder.firstElementChild);
            wireAudioSlotBadges(leftWrap, block);
            row.appendChild(leftWrap);
          }

          const arrow = document.createElement("span");
          arrow.style.color = "var(--text-faint)"; arrow.textContent = "↔";
          row.appendChild(arrow);

          // Sağ taraf
          if (block.mode === "mixed") {
            row.appendChild(pairImgUploadBtn(p, i, renderPairs));
          } else {
            const rightInput = document.createElement("input");
            rightInput.type = "text"; rightInput.value = p.right; rightInput.placeholder = "Sağ (örn: ev)";
            rightInput.style.cssText = "flex:1; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;";
            rightInput.addEventListener("input", function() { p.right = this.value; });
            row.appendChild(rightInput);
          }

          const delBtn = document.createElement("button");
          delBtn.className = "del-pair"; delBtn.style.cssText = "background:transparent; border:none; color:var(--rose); cursor:pointer; flex-shrink:0;";
          delBtn.innerHTML = "×";
          delBtn.addEventListener("click", () => { if (block.pairs.length > 2) { block.pairs.splice(i, 1); renderPairs(); } else { toast("En az 2 eşleştirme çifti olmalı.", "err"); } });
          row.appendChild(delBtn);

          row.addEventListener("dragstart", () => { dragFromIdx = i; row.classList.add("dragging-row"); });
          row.addEventListener("dragend", () => { row.classList.remove("dragging-row"); });
          row.addEventListener("dragover", (e) => { e.preventDefault(); });
          row.addEventListener("drop", (e) => {
            e.preventDefault();
            if (dragFromIdx === null || dragFromIdx === i) return;
            const moved = block.pairs.splice(dragFromIdx, 1)[0];
            block.pairs.splice(i, 0, moved);
            dragFromIdx = null;
            renderPairs();
          });

          pairsWrap.appendChild(row);
        });
      }
      renderPairs();

      $all(".match-mode-btn", modeRow).forEach(b => b.addEventListener("click", () => { block.mode = b.dataset.mode; renderPairs(); }));

      const addBtn = document.createElement("button");
      addBtn.className = "btn btn-sm"; addBtn.innerText = "+ Eşleştirme Çifti Ekle";
      addBtn.addEventListener("click", () => { block.pairs.push({ left: "", right: "", image: "" }); renderPairs(); });
      card.appendChild(pairsWrap); card.appendChild(addBtn);
      content.appendChild(card);

    } else if (block.type === "sentorder") {
      const card = document.createElement("div");
      card.innerHTML = `<input type="text" class="sord-instr" placeholder="Yönerge / talimat metni" value="${esc(block.instruction)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-weight:600; margin-bottom:10px;">`;
      card.querySelector(".sord-instr").addEventListener("input", function() { block.instruction = this.value; });
      const listWrap = document.createElement("div");
      function renderSentences() {
        listWrap.innerHTML = "";
        block.sentences.forEach((s, i) => {
          const row = document.createElement("div");
          row.className = "audio-drop-target audio-drop-inline";
          row.dataset.block = block.id; row.dataset.slot = "sent" + i;
          row.style.cssText = "display:flex; align-items:center; gap:8px; margin-bottom:6px;";
          row.innerHTML = `
            <span style="color:var(--text-faint); font-size:12px; width:16px; flex-shrink:0;">${i+1}.</span>
            <input type="text" value="${esc(s)}" placeholder="Cümle" style="flex:1; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
            ${audioSlotBadgeHtml(block, "sent" + i)}
            <button class="sord-up" title="Yukarı" ${i===0?"disabled":""} style="background:transparent; border:none; color:var(--text-faint); cursor:pointer;">↑</button>
            <button class="sord-down" title="Aşağı" ${i===block.sentences.length-1?"disabled":""} style="background:transparent; border:none; color:var(--text-faint); cursor:pointer;">↓</button>
            <button class="sord-del" style="background:transparent; border:none; color:var(--rose); cursor:pointer;">×</button>
          `;
          row.querySelector("input").addEventListener("input", function() { block.sentences[i] = this.value; });
          row.querySelector(".sord-up").addEventListener("click", () => { if (i>0) { const t=block.sentences[i-1]; block.sentences[i-1]=block.sentences[i]; block.sentences[i]=t; renderSentences(); } });
          row.querySelector(".sord-down").addEventListener("click", () => { if (i<block.sentences.length-1) { const t=block.sentences[i+1]; block.sentences[i+1]=block.sentences[i]; block.sentences[i]=t; renderSentences(); } });
          row.querySelector(".sord-del").addEventListener("click", () => { if (block.sentences.length > 2) { block.sentences.splice(i,1); renderSentences(); } });
          wireAudioSlotBadges(row, block);
          listWrap.appendChild(row);
        });
      }
      renderSentences();
      const addBtn = document.createElement("button");
      addBtn.className = "btn btn-sm"; addBtn.innerText = "+ Cümle Ekle";
      addBtn.addEventListener("click", () => { block.sentences.push("Yeni cümle"); renderSentences(); });
      card.appendChild(listWrap); card.appendChild(addBtn);
      content.appendChild(card);

    } else if (block.type === "wordorder") {
      const card = document.createElement("div");
      card.innerHTML = `
        <input type="text" class="word-instr" placeholder="Yönerge / talimat metni" value="${esc(block.instruction)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-weight:600; margin-bottom:10px;">
        <div class="audio-drop-target audio-drop-inline" data-block="${block.id}" data-slot="sentence">
          <input type="text" class="word-sentence" placeholder="Cümle (örn: Ich gehe heute ins Kino.)" value="${esc(block.sentence)}" style="flex:1; min-width:0; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
          ${audioSlotBadgeHtml(block, "sentence")}
        </div>
        <div style="margin-top:8px; font-size:11.5px; color:var(--text-faint);">Öğrenciye bu cümlenin kelimeleri karışık sırada, tıklanabilir kutucuklar halinde gösterilir. Doğru sırayla tıklayınca onaylar.</div>
      `;
      wireAudioSlotBadges(card, block);
      card.querySelector(".word-instr").addEventListener("input", function() { block.instruction = this.value; });
      card.querySelector(".word-sentence").addEventListener("input", function() { block.sentence = this.value; });
      content.appendChild(card);

    } else if (block.type === "dialogue") {
      const card = document.createElement("div");
      card.innerHTML = `
        <input type="text" class="dlg-instr" placeholder="Yönerge / talimat metni" value="${esc(block.instruction)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-weight:600; margin-bottom:10px;">
        <div style="display:flex; gap:8px; margin-bottom:12px;">
          <input type="text" class="dlg-speakerA" placeholder="A Konuşmacı adı" value="${esc(block.speakerA)}" style="flex:1; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-weight:600;">
          <input type="text" class="dlg-speakerB" placeholder="B Konuşmacı adı" value="${esc(block.speakerB)}" style="flex:1; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-weight:600;">
        </div>
      `;
      card.querySelector(".dlg-instr").addEventListener("input", function() { block.instruction = this.value; });
      card.querySelector(".dlg-speakerA").addEventListener("input", function() { block.speakerA = this.value; renderLines(); });
      card.querySelector(".dlg-speakerB").addEventListener("input", function() { block.speakerB = this.value; renderLines(); });

      const linesWrap = document.createElement("div");
      function renderLines() {
        linesWrap.innerHTML = "";
        block.lines.forEach((ln, i) => {
          const row = document.createElement("div");
          row.style.cssText = "border:1px solid var(--border); border-radius:8px; padding:10px; margin-bottom:8px; background:rgba(255,255,255,0.02);";
          row.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <select class="dlg-speaker-sel" style="padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
                <option value="A" ${ln.speaker === "A" ? "selected" : ""}>A — ${esc(block.speakerA || "A")}</option>
                <option value="B" ${ln.speaker === "B" ? "selected" : ""}>B — ${esc(block.speakerB || "B")}</option>
              </select>
              <div class="audio-drop-target audio-drop-inline" data-block="${block.id}" data-slot="line${i}" style="flex:1; min-width:0;">
                <input type="text" class="dlg-text" value="${esc(ln.text)}" placeholder="Konuşma metni" style="flex:1; min-width:0; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
                ${audioSlotBadgeHtml(block, "line" + i)}
              </div>
              <button class="dlg-up" title="Yukarı" ${i === 0 ? "disabled" : ""} style="background:transparent; border:none; color:var(--text-faint); cursor:pointer;">↑</button>
              <button class="dlg-down" title="Aşağı" ${i === block.lines.length - 1 ? "disabled" : ""} style="background:transparent; border:none; color:var(--text-faint); cursor:pointer;">↓</button>
              <button class="dlg-del" style="background:transparent; border:none; color:var(--rose); cursor:pointer;">×</button>
            </div>
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-dim); cursor:pointer;">
              <input type="checkbox" class="dlg-choice-toggle" ${ln.choice ? "checked" : ""}> Öğrenci bu repliği seçsin (çoktan seçmeli hale getir)
            </label>
            <div class="dlg-distractors-wrap" style="margin-top:8px; ${ln.choice ? "" : "display:none;"}"></div>
          `;
          wireAudioSlotBadges(row, block);
          row.querySelector(".dlg-speaker-sel").addEventListener("change", function() { ln.speaker = this.value; });
          row.querySelector(".dlg-text").addEventListener("input", function() { ln.text = this.value; });
          row.querySelector(".dlg-up").addEventListener("click", () => { if (i > 0) { const t = block.lines[i-1]; block.lines[i-1] = block.lines[i]; block.lines[i] = t; renderLines(); } });
          row.querySelector(".dlg-down").addEventListener("click", () => { if (i < block.lines.length - 1) { const t = block.lines[i+1]; block.lines[i+1] = block.lines[i]; block.lines[i] = t; renderLines(); } });
          row.querySelector(".dlg-del").addEventListener("click", () => { if (block.lines.length > 1) { block.lines.splice(i, 1); renderLines(); } });
          row.querySelector(".dlg-choice-toggle").addEventListener("change", function() { ln.choice = this.checked; if (ln.choice && !ln.distractors) ln.distractors = []; renderLines(); });

          const distWrap = row.querySelector(".dlg-distractors-wrap");
          function renderDistractors() {
            distWrap.innerHTML = "";
            (ln.distractors || []).forEach((d, di) => {
              const dRow = document.createElement("div");
              dRow.style.cssText = "display:flex; align-items:center; gap:6px; margin-bottom:4px;";
              dRow.innerHTML = `<input type="text" value="${esc(d)}" placeholder="Yanlış seçenek" style="flex:1; padding:5px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-size:12.5px;"><button style="background:transparent; border:none; color:var(--rose); cursor:pointer;">×</button>`;
              dRow.querySelector("input").addEventListener("input", function() { ln.distractors[di] = this.value; });
              dRow.querySelector("button").addEventListener("click", () => { ln.distractors.splice(di, 1); renderDistractors(); });
              distWrap.appendChild(dRow);
            });
            const addDistBtn = document.createElement("button");
            addDistBtn.className = "btn btn-sm"; addDistBtn.innerText = "+ Yanlış Seçenek Ekle"; addDistBtn.style.fontSize = "11.5px";
            addDistBtn.addEventListener("click", () => { ln.distractors.push("Yanlış seçenek"); renderDistractors(); });
            distWrap.appendChild(addDistBtn);
          }
          if (ln.choice) renderDistractors();

          linesWrap.appendChild(row);
        });
      }
      renderLines();
      const addLineBtn = document.createElement("button");
      addLineBtn.className = "btn btn-sm"; addLineBtn.innerText = "+ Repl Ekle";
      addLineBtn.addEventListener("click", () => {
        const last = block.lines[block.lines.length - 1];
        block.lines.push({ speaker: last && last.speaker === "A" ? "B" : "A", text: "Yeni cümle", choice: false, distractors: [] });
        renderLines();
      });
      card.appendChild(linesWrap); card.appendChild(addLineBtn);
      content.appendChild(card);

    } else if (block.type === "audio") {
      const card = document.createElement("div");
      card.innerHTML = `
        <input type="text" class="aud-text" placeholder="Okunacak Almanca metin" value="${esc(block.text)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
        <input type="text" class="aud-cap" placeholder="Açıklama etiketi" value="${esc(block.caption)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; margin-top:6px;">
      `;
      card.querySelector(".aud-text").addEventListener("input", function() { block.text = this.value; });
      card.querySelector(".aud-cap").addEventListener("input", function() { block.caption = this.value; });
      content.appendChild(card);

    } else if (block.type === "listen") {
      const card = document.createElement("div");
      card.style.cssText = "background:rgba(59,130,246,0.04); border:1px solid var(--border); padding:16px; border-radius:10px;";
      card.innerHTML = `
        <label style="font-size:12px; color:var(--text-faint); display:block; margin-bottom:4px;">Ses Kaynağı (URL)</label>
        <input type="url" class="ls-url" placeholder="https://.../ses.mp3" value="${esc(block.audioUrl && !block.audioUrl.startsWith("data:") ? block.audioUrl : "")}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
        <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
          <input type="file" accept="audio/*" class="ls-file" style="flex:1; font-size:12px; color:var(--text-dim);">
          <span style="font-size:11px; color:var(--text-faint); white-space:nowrap;">veya yükle (maks. 8MB)</span>
        </div>
        <div class="ls-audio-preview" style="margin-top:10px;"></div>
        <input type="text" class="ls-caption" placeholder="Açıklama etiketi (örn: Dinleme metni)" value="${esc(block.audioCaption)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; margin-top:10px;">
        <div class="ls-questions-wrap" style="margin-top:14px;"></div>
        <button type="button" class="btn btn-sm ls-add-q" style="margin-top:4px;">+ Soru Ekle</button>
      `;
      const urlInput = card.querySelector(".ls-url");
      const fileInput = card.querySelector(".ls-file");
      const audioPreview = card.querySelector(".ls-audio-preview");
      const capInput = card.querySelector(".ls-caption");
      const qWrap = card.querySelector(".ls-questions-wrap");

      function renderAudioPreview() {
        audioPreview.innerHTML = block.audioUrl
          ? '<audio controls src="' + esc(block.audioUrl) + '" style="width:100%; height:36px;"></audio>'
          : '<div style="font-size:11.5px; color:var(--text-faint);">Henüz ses eklenmedi.</div>';
      }
      urlInput.addEventListener("input", () => { block.audioUrl = urlInput.value.trim(); renderAudioPreview(); });
      fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) { toast("Ses dosyası 8MB üzerinde, lütfen daha küçük bir dosya seçin.", "err"); return; }
        const reader = new FileReader();
        reader.onload = function (evt) {
          block.audioUrl = evt.target.result;
          urlInput.value = "";
          renderAudioPreview();
          toast("Ses dosyası yüklendi ve Base64'e dönüştürüldü ✓");
        };
        reader.readAsDataURL(file);
      });
      capInput.addEventListener("input", () => { block.audioCaption = capInput.value; });
      renderAudioPreview();

      function renderListenQuestions() {
        qWrap.innerHTML = "";
        block.questions.forEach((q, qi) => {
          const qBox = document.createElement("div");
          qBox.style.cssText = "border:1px solid var(--border); padding:12px; border-radius:8px; margin-bottom:10px; background:rgba(255,255,255,0.01);";
          qBox.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <input type="text" class="lq-question" placeholder="Soru metni" value="${esc(q.question)}" style="flex:1; padding:7px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-weight:600;">
              <button type="button" class="lq-del-q" title="Soruyu sil" style="background:transparent; border:none; color:var(--rose); cursor:pointer; font-size:16px; line-height:1;">×</button>
            </div>
            <div class="lq-opts-list" style="display:flex; flex-direction:column; gap:6px;"></div>
            <button type="button" class="btn btn-sm lq-add-opt" style="margin-top:6px;">+ Seçenek Ekle</button>
          `;
          qBox.querySelector(".lq-question").addEventListener("input", function() { q.question = this.value; });
          qBox.querySelector(".lq-del-q").addEventListener("click", () => {
            if (block.questions.length > 1) { block.questions.splice(qi, 1); renderListenQuestions(); }
            else toast("En az bir soru kalmalı.", "err");
          });
          const optsList = qBox.querySelector(".lq-opts-list");
          function renderOpts() {
            optsList.innerHTML = "";
            q.options.forEach((opt, oi) => {
              const row = document.createElement("div");
              row.style.cssText = "display:flex; align-items:center; gap:8px;";
              row.innerHTML = `
                <input type="radio" name="lq_correct_${block.id}_${qi}" ${q.correctIndex === oi ? "checked" : ""} style="accent-color:var(--green);">
                <input type="text" value="${esc(opt)}" style="flex:1; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
                <button type="button" class="lq-del-opt" style="background:transparent; border:none; color:var(--rose); cursor:pointer;">×</button>
              `;
              row.querySelector("input[type=radio]").addEventListener("change", () => { q.correctIndex = oi; });
              row.querySelector("input[type=text]").addEventListener("input", function() { q.options[oi] = this.value; });
              row.querySelector(".lq-del-opt").addEventListener("click", () => {
                if (q.options.length > 2) { q.options.splice(oi, 1); if (q.correctIndex >= q.options.length) q.correctIndex = 0; renderOpts(); }
                else toast("En az iki seçenek kalmalı.", "err");
              });
              optsList.appendChild(row);
            });
          }
          qBox.querySelector(".lq-add-opt").addEventListener("click", () => { q.options.push("Yeni Seçenek"); renderOpts(); });
          renderOpts();
          qWrap.appendChild(qBox);
        });
      }
      renderListenQuestions();
      card.querySelector(".ls-add-q").addEventListener("click", () => {
        block.questions.push({ question: "Yeni soru?", options: ["Seçenek A", "Seçenek B", "Seçenek C", "Seçenek D"], correctIndex: 0 });
        renderListenQuestions();
      });
      content.appendChild(card);

    } else if (block.type === "konjugation") {
      const card = document.createElement("div");
      card.style.cssText = "background:rgba(59,130,246,0.04); border:1px solid var(--border); padding:16px; border-radius:10px;";
      card.innerHTML = `
        <div style="display:flex; gap:10px; margin-bottom:12px;">
          <div style="flex:1;">
            <label style="font-size:12px; color:var(--text-faint); display:block; margin-bottom:4px;">Fiil</label>
            <div class="audio-drop-target audio-drop-inline" data-block="${block.id}" data-slot="verb">
              <input type="text" class="kj-verb" placeholder="gehen" value="${esc(block.verb)}" style="flex:1; min-width:0; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-weight:700;">
              ${audioSlotBadgeHtml(block, "verb")}
            </div>
          </div>
          <div style="flex:1;">
            <label style="font-size:12px; color:var(--text-faint); display:block; margin-bottom:4px;">Zaman</label>
            <select class="kj-tense" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
              <option value="praesens">Präsens</option>
              <option value="perfekt">Perfekt</option>
              <option value="praeteritum">Präteritum</option>
            </select>
          </div>
        </div>
        <div style="font-size:11.5px; color:var(--text-faint); margin-bottom:10px;">Her kişi için <b>doğru</b> çekimi yazın. Öğrenci önizlemede/export sayfasında bu değeri boş bir kutucuğa yazarak deneyecek.</div>
        <div class="kj-rows" style="display:flex; flex-direction:column; gap:6px;"></div>
      `;
      wireAudioSlotBadges(card, block);
      card.querySelector(".kj-tense").value = block.tense;
      card.querySelector(".kj-verb").addEventListener("input", function() { block.verb = this.value; });
      card.querySelector(".kj-tense").addEventListener("change", function() { block.tense = this.value; });

      const rowsWrap = card.querySelector(".kj-rows");
      const KONJ_PERSONS = [["ich","ich"],["du","du"],["er","er/sie/es"],["wir","wir"],["ihr","ihr"],["sie","sie/Sie"]];
      KONJ_PERSONS.forEach(([key, label]) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex; align-items:center; gap:8px;";
        row.innerHTML = `
          <span style="flex:0 0 80px; font-size:12.5px; color:var(--text-dim);">${esc(label)}</span>
          <input type="text" value="${esc((block.answers && block.answers[key]) || "")}" placeholder="doğru cevap" style="flex:1; padding:7px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
        `;
        row.querySelector("input").addEventListener("input", function() { block.answers[key] = this.value; });
        rowsWrap.appendChild(row);
      });
      content.appendChild(card);

    } else if (block.type === "accordion") {
      const card = document.createElement("div");
      function renderAccItems() {
        card.innerHTML = "";
        block.items.forEach((item, i) => {
          const itemDiv = document.createElement("div");
          itemDiv.style.cssText = "border:1px solid var(--border); padding:8px; border-radius:6px; margin-bottom:6px; background:rgba(255,255,255,0.01);";
          itemDiv.innerHTML = `
            <div class="audio-drop-target audio-drop-inline" data-block="${block.id}" data-slot="item${i}q">
              <div class="acc-editable acc-editable-q" contenteditable="true" data-placeholder="Başlık / Soru" style="flex:1; min-width:0; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:4px;">${item.q}</div>
              ${audioSlotBadgeHtml(block, "item" + i + "q")}
            </div>
            <div class="audio-drop-target audio-drop-inline" data-block="${block.id}" data-slot="item${i}a" style="margin-top:4px; align-items:flex-start;">
              <div class="acc-editable acc-editable-a" contenteditable="true" data-placeholder="Açıklama / İçerik" style="flex:1; min-width:0; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:4px; min-height:45px;">${item.a}</div>
              ${audioSlotBadgeHtml(block, "item" + i + "a")}
            </div>
          `;
          const qEl = itemDiv.querySelector(".acc-editable-q");
          const aEl = itemDiv.querySelector(".acc-editable-a");
          qEl.addEventListener("input", function() { item.q = this.innerHTML; });
          qEl.addEventListener("keydown", e => { if (e.key === "Enter") e.preventDefault(); });
          aEl.addEventListener("input", function() { item.a = this.innerHTML; });
          wireAudioSlotBadges(itemDiv, block);
          card.appendChild(itemDiv);
        });
        const addBtn = document.createElement("button");
        addBtn.className = "btn btn-sm"; addBtn.innerText = "+ Panel Ekle";
        addBtn.addEventListener("click", () => { block.items.push({ q: "Yeni Panel", a: "" }); renderAccItems(); });
        card.appendChild(addBtn);
      }
      renderAccItems();
      content.appendChild(card);

    } else if (block.type === "video") {
      const card = document.createElement("div");
      card.innerHTML = `
        <input type="url" placeholder="YouTube veya Vimeo Linki" value="${esc(block.url)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
        <input type="text" placeholder="Video Altı Açıklaması" value="${esc(block.caption)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; margin-top:6px;">
      `;
      card.querySelector("input[type=url]").addEventListener("input", function() { block.url = this.value.trim(); });
      card.querySelector("input[type=text]").addEventListener("input", function() { block.caption = this.value; });
      content.appendChild(card);

    } else if (block.type === "code") {
      const card = document.createElement("div");
      card.innerHTML = `
        <input type="text" placeholder="Dil (Örn: javascript, python)" value="${esc(block.lang)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
        <textarea placeholder="Kod parçacığı" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-family:monospace; min-height:80px; margin-top:6px;">${esc(block.code)}</textarea>
      `;
      card.querySelector("input").addEventListener("input", function() { block.lang = this.value.trim(); });
      card.querySelector("textarea").addEventListener("input", function() { block.code = this.value; });
      content.appendChild(card);

    } else if (block.type === "toc") {
      const card = document.createElement("div");
      card.style.cssText = "border:1px dashed var(--border); padding:12px; color:var(--text-faint); font-size:12.5px; border-radius:6px;";
      card.innerHTML = `<span><strong>İçindekiler Tablosu (TOC):</strong> Bu alan yayınlanan sayfada otomatik oluşacaktır.</span>`;
      content.appendChild(card);
    }
  }
  $all(".add-block-btn[data-type]").forEach(btn => btn.addEventListener("click", () => addBlock(btn.dataset.type)));
  setupAudioDragTool();
  setupBlockDragReorder();
  $("#btnClearAll").addEventListener("click", clearAll);


/* ---------- theme-preview-export-ui.js ---------- */
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
    autofillExportMeta();
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

  /* ══════════════════════════════════════
     "HTML Sayfası Oluştur" modalı açıldığında, ders içeriğinden
     çıkarılabilecek her alanı otomatik doldurur — SADECE "Yazar Adı"
     ve "URL Slug (klasör adı)" hariç, çünkü bunlar kullanıcıya özel
     bilgilerdir ve içerikten tahmin edilemez. Kullanıcının zaten
     kendi girdiği (boş olmayan) alanlara dokunmaz.
     ══════════════════════════════════════ */
  function stripHtmlToText(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = String(html || "");
    return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
  }
  function guessLessonType(sampleText) {
    const t = sampleText.toLowerCase();
    if (/kültür|kultur|gelenek|bayram|yemek kültürü|görgü kural/.test(t)) return "kultur";
    if (/artikel|akkusativ|dativ|nominativ|genitiv|çekim|zamir|edat|cümle yapısı|gramer|fiil çekimi|hal ek/.test(t)) return "gramer";
    return "iletisim";
  }
  function estimateReadTimeMinutes(totalChars) {
    // Türkçe ortalama sessiz okuma hızına göre kabaca dakikada ~900 karakter
    return String(Math.min(60, Math.max(1, Math.round(totalChars / 900))));
  }
  function autofillExportMeta() {
    const firstHeading = blocks.find(b => b.type === "heading" && (b.text || "").trim());
    const firstParaBlock = blocks.find(b => b.type === "paragraph" && (b.html || "").trim());
    const firstImageBlock = blocks.find(b => b.type === "image" && (b.url || "").trim());
    const plainPara = firstParaBlock ? stripHtmlToText(firstParaBlock.html) : "";

    if (!metaTitleInput.value.trim() && firstHeading) {
      metaTitleInput.value = firstHeading.text.trim();
      if (!slugManuallyEdited) metaSlugInput.value = slugify(metaTitleInput.value);
    }

    const descInput = $("#metaDesc");
    if (!descInput.value.trim() && plainPara) {
      descInput.value = plainPara.length > 155 ? (plainPara.slice(0, 155).trim() + "…") : plainPara;
    }

    const typeSelect = $("#metaType");
    if (!typeSelect.value) {
      typeSelect.value = guessLessonType([firstHeading ? firstHeading.text : "", plainPara].join(" "));
    }

    const readTimeInput = $("#metaReadTime");
    if (!readTimeInput.value.trim() || readTimeInput.value.trim() === "5") {
      const totalChars = blocks.reduce((sum, b) => {
        const raw = b.html || b.text || b.tr || b.de || b.example || "";
        return sum + stripHtmlToText(String(raw)).length;
      }, 0);
      if (totalChars > 0) readTimeInput.value = estimateReadTimeMinutes(totalChars);
    }

    const coverInput = $("#metaCover");
    if (!coverInput.value.trim() && firstImageBlock) coverInput.value = firstImageBlock.url.trim();
    // Not: Seviye ve Zorluk Derecesi alanları zaten makul varsayılanlarla
    // (B1 / Orta) önceden seçili gelir; Yazar Adı ve URL Slug ise bilinçli
    // olarak dokunulmadan bırakılır.
  }

  function buildHtmlFromForm() {
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
    if (!title) { toast("Sayfa başlığı boş olamaz.", "err"); return null; }
    if (!slug) { toast("URL slug boş olamaz.", "err"); return null; }
    return buildExportHtml({ title, slug, description, level, type, difficulty, readTime, author, cover, theme, themeColor });
  }

  function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error("execCommand başarısız oldu"));
      } catch (e) { reject(e); }
    });
  }

  $("#confirmExport").addEventListener("click", () => {
    const html = buildHtmlFromForm();
    if (!html) return;
    downloadHtml(html);
    overlay.classList.remove("open");
    toast("index.html indirildi ✓", "ok");
  });

  $("#copyExportCode").addEventListener("click", () => {
    const html = buildHtmlFromForm();
    if (!html) return;
    copyTextToClipboard(html)
      .then(() => toast("Kod panoya kopyalandı ✓", "ok"))
      .catch(() => toast("Kopyalama başarısız oldu. Tarayıcı izin vermemiş olabilir.", "err"));
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


/* ---------- block-export-render.js ---------- */
/* ═══════════════════════════════════════════════════════════
   7) STATİK EXPORT RENDER (renderBlockExport)
   Bu dosya, app.js'nin bölünmesiyle oluşturulmuştur.
   Diğer js/*.js dosyalarıyla aynı global scope'u paylaşır
   (module DEĞİLDİR) — bu yüzden index.html'deki script sırası önemlidir.
   ═══════════════════════════════════════════════════════════ */
function renderBlockExport(b) {
    const forceTransparent = b.type === "paragraph";
    const wrapOpen = '<div style="' + wrapperStyle(b, forceTransparent) + '">';
    const wrapClose = "</div>";
    switch (b.type) {
      case "heading": {
        // H2 veya H3 başlıklarına TOC'un yakalayabilmesi için slug ID atıyoruz
        const idAttr = b.level !== "h1" ? ' id="' + slugify(b.text) + '"' : '';
        const headingTts = (b.audioSlots && b.audioSlots.text) ? ttsCluster(b.text, "de-DE", "tts-cluster-sm") : "";
        return wrapOpen + "<" + b.level + idAttr + ' style="font-family:' + fontStack(b.font) + ";font-size:" + b.size + "px;color:" + b.color + ";font-weight:" + b.weight + ";line-height:" + (b.lineHeight/100) + ";letter-spacing:" + b.letterSpacing + 'px;">' + esc(b.text) + headingTts + "</" + b.level + ">" + wrapClose;
      }

      case "paragraph": {
        // convertTooltips fonksiyonu ile satır içi ipuçlarını HTML elementine çeviriyoruz
        const variant = b.variant || "normal";
        const dropCapCls = (b.dropCap === true || b.dropCap === "1") ? " lb-dropcap" : "";
        const pStyle = 'font-family:' + fontStack(b.font) + ";font-size:" + b.size + "px;color:" + b.color + ";text-align:" + b.align + ";line-height:" + (b.lineHeight/100) + ";letter-spacing:" + b.letterSpacing + "px;background:transparent;";
        const paraTts = (b.audioSlots && b.audioSlots.html) ? ttsCluster(stripHtmlForTts(b.html), "de-DE", "tts-cluster-sm") : "";
        const pHtml = '<p class="lb-paragraph-text' + dropCapCls + '" style="' + pStyle + '">' + convertTooltips(b.html) + paraTts + "</p>";
        if (variant === "quote") return wrapOpen + '<blockquote class="lb-paragraph-quote">' + pHtml + "</blockquote>" + wrapClose;
        if (variant === "highlight") return wrapOpen + '<div class="lb-paragraph-highlight">' + pHtml + "</div>" + wrapClose;
        return wrapOpen + pHtml + wrapClose;
      }

      case "image": {
        if (!b.url) return "";
        const w = Number(b.width) || 100;
        const heightStyle = b.height ? ("height:" + Number(b.height) + "px;") : "height:auto;";
        const shadowStyle = (b.shadow === "1" || b.shadow === true) ? "box-shadow:0 16px 40px rgba(0,0,0,.4);" : "";
        const fit = b.objectFit || "cover";
        const lazyAttr = (b.lazy === "0" || b.lazy === false) ? "" : ' loading="lazy"';
        const imgId = "img_" + b.id;
        return wrapOpen + '<figure class="premium-image-figure" style="text-align:' + b.align + ';">' +
          '<button type="button" class="lb-image-trigger" onclick="openLightbox(\'' + imgId + '\')" aria-label="Görseli büyüt: ' + esc(b.alt || "görsel") + '">' +
          '<img id="' + imgId + '" class="premium-image-el" src="' + esc(b.url) + '" alt="' + esc(b.alt) + '"' + lazyAttr + ' decoding="async" ' +
          'sizes="(max-width: 640px) 100vw, ' + w + 'vw" srcset="' + esc(b.url) + ' 1x" ' +
          'style="width:' + w + '%;max-width:100%;' + heightStyle + 'object-fit:' + fit + ';border-radius:' + b.radius + 'px;' + shadowStyle + 'cursor:zoom-in;">' +
          '</button>' +
          (b.caption ? '<figcaption class="premium-image-caption">' + esc(b.caption) + '</figcaption>' : '') +
          '</figure>' + wrapClose;
      }

      case "vocab": {
        const vocabDeTts = (b.audioSlots && b.audioSlots.de) ? ttsCluster(stripHtmlForTts(b.de), "de-DE") : "";
        const vocabExTts = (b.audioSlots && b.audioSlots.example) ? ttsCluster(stripHtmlForTts(b.example), "de-DE", "tts-cluster-sm") : "";
        const vocabSize = b.cardSize || "medium";
        return wrapOpen + '<div class="vocab-card vocab-size-' + vocabSize + '">' +
          '<div class="vocab-de">' + b.de + vocabDeTts + "</div>" +
          (b.phon ? '<div class="vocab-phon">[' + b.phon + "]</div>" : "") +
          '<div class="vocab-tr">' + b.tr + "</div>" +
          (b.example ? '<div class="vocab-example">' + b.example + vocabExTts + "</div>" : "") +
          (b.tipEnabled && b.tip ? '<div class="vocab-tip"><strong>İpucu:</strong> ' + esc(b.tip) + "</div>" : "") +
          "</div>" + wrapClose;
      }

      case "callout": {
        const calloutTitleTts = (b.audioSlots && b.audioSlots.title) ? ttsCluster(b.title, "de-DE", "tts-cluster-sm") : "";
        const calloutBodyTts = (b.audioSlots && b.audioSlots.html) ? ttsCluster(stripHtmlForTts(b.html), "de-DE", "tts-cluster-sm") : "";
        return wrapOpen + '<div class="callout-box" data-theme="' + b.theme + '">' +
          '<div class="callout-ico">' + CALLOUT_ICON[b.theme] + '</div>' +
          '<div class="callout-body-wrap"><div class="callout-title">' + esc(b.title) + calloutTitleTts + '</div><div class="callout-text">' + b.html + calloutBodyTts + "</div></div>" +
          "</div>" + wrapClose;
      }

      case "table": {
        ensureTableAudioShape(b);
        let t = wrapOpen + '<div style="overflow-x:auto;"><table class="lb-table"><thead><tr>';
        b.headers.forEach((h, ci) => { t += "<th>" + esc(h) + (b.audioHeaders[ci] ? ttsCluster(h, "de-DE", "tts-cluster-sm") : "") + "</th>"; });
        t += "</tr></thead><tbody>";
        b.rows.forEach((row, ri) => {
          t += "<tr>";
          row.forEach((c, ci) => { t += "<td>" + esc(c) + (b.audioCells[ri][ci] ? ttsCluster(c, "de-DE", "tts-cluster-sm") : "") + "</td>"; });
          t += "</tr>";
        });
        t += "</tbody></table></div>" + wrapClose;
        return t;
      }

      case "quiz": {
        const qId = "q_" + b.id;
        const quizQTts = (b.audioSlots && b.audioSlots.question) ? ttsCluster(b.question, "de-DE", "tts-cluster-sm") : "";
        let qHtml = wrapOpen + '<div class="premium-quiz-card" id="' + qId + '" data-correct="' + b.correctIndex + '">' +
          '<div class="quiz-question-title">' + esc(b.question) + quizQTts + '</div>' +
          '<div class="quiz-options-list">';
        b.options.forEach((opt, idx) => {
          const quizOptTts = (b.audioSlots && b.audioSlots["opt" + idx]) ? ttsCluster(opt, "de-DE", "tts-cluster-sm", "event.stopPropagation();") : "";
          qHtml += '<div class="quiz-option-item" data-index="' + idx + '">' +
            '<span class="quiz-indicator"></span>' +
            '<span class="quiz-opt-text">' + esc(opt) + '</span>' + quizOptTts +
            '</div>';
        });
        qHtml += '</div>' +
          '<button class="quiz-action-btn" onclick="checkQuizAnswer(\'' + qId + '\')">Cevabı Kontrol Et</button>' +
          '<div class="quiz-explain-panel">' +
            '<strong>' + (b.explanation ? 'Açıklama:' : '') + '</strong> ' + esc(b.explanation) +
          '</div>' +
          '</div>' + wrapClose;
        return qHtml;
      }

      case "fillblank": {
        const fbId = "fib_" + b.id;
        const parts = parseFillBlank(b.text);
        let inner = "";
        parts.forEach(p => {
          if (p.type === "text") {
            inner += esc(p.value).replace(/\n/g, "<br>");
          } else {
            const w = Math.max(3, p.value.length + 2);
            inner += '<input type="text" class="fib-input" data-answer="' + esc(p.value) + '" style="width:' + w + 'ch;" autocomplete="off" spellcheck="false">';
          }
        });
        const fibTts = (b.audioSlots && b.audioSlots.text) ? ttsCluster(stripHtmlForTts(b.text), "de-DE", "tts-cluster-sm") : "";
        return wrapOpen + '<div class="premium-fillblank-card" id="' + fbId + '">' +
          (b.instruction ? '<div class="fib-instruction">' + esc(b.instruction) + '</div>' : '') +
          '<div class="fib-text-body">' + inner + fibTts + '</div>' +
          '<button class="fib-action-btn" onclick="checkFillBlank(\'' + fbId + '\')">Cevapları Kontrol Et</button>' +
          '<div class="fib-result-msg"></div>' +
          '</div>' + wrapClose;
      }

      case "matching": {
        const mId = "match_" + b.id;
        const mode = b.mode || "text";
        const leftIsImage = mode === "image";
        const rightIsImage = mode === "mixed";
        function sideContent(p, isImage, fallbackLabel) {
          if (isImage) {
            return p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy" decoding="async" class="matching-card-img">' : '<span class="matching-card-text">' + esc(fallbackLabel) + '</span>';
          }
          return '<span class="matching-card-text">' + esc(fallbackLabel) + '</span>';
        }
        const order = b.pairs.map((p, i) => i);
        const shuffledOrder = shuffleArr(order.slice());

        let leftHtml = '<div class="matching-col-left" role="list" aria-label="Sabit liste">';
        b.pairs.forEach((p, i) => {
          const leftTts = (leftIsImage || !(b.audioSlots && b.audioSlots["left" + i])) ? "" : ttsCluster(p.left, "de-DE", "tts-cluster-sm", "event.stopPropagation();");
          leftHtml += '<div class="matching-drop-zone" role="listitem" data-target-idx="' + i + '" tabindex="0" ' +
            'aria-label="Hedef ' + (i + 1) + ': ' + esc(leftIsImage ? "görsel" : p.left) + '">' +
            '<span class="matching-num">' + (i + 1) + '</span>' +
            '<span class="matching-drop-fixed">' + sideContent(p, leftIsImage, p.left) + leftTts + '</span>' +
            '<span class="matching-drop-slot" data-slot></span>' +
            '</div>';
        });
        leftHtml += '</div>';

        let rightHtml = '<div class="matching-col-right" role="list" aria-label="Sürüklenebilir kartlar">';
        shuffledOrder.forEach(idx => {
          const p = b.pairs[idx];
          rightHtml += '<div class="matching-card" role="button" draggable="true" tabindex="0" ' +
            'data-pair-idx="' + idx + '" aria-label="Kart: ' + esc(rightIsImage ? "görsel" : p.right) + ', taşımak için Enter\'a basın">' +
            sideContent(p, rightIsImage, p.right) +
            '</div>';
        });
        rightHtml += '</div>';

        return wrapOpen + '<div class="premium-matching-card" id="' + mId + '" data-total="' + b.pairs.length + '" role="application" aria-label="Eşleştirme alıştırması">' +
          (b.instruction ? '<div class="matching-instruction">' + esc(b.instruction) + '</div>' : '') +
          '<div class="matching-columns">' + leftHtml + rightHtml + '</div>' +
          '<div class="matching-btn-row">' +
          '<button type="button" class="matching-action-btn" onclick="checkMatching(\'' + mId + '\')">Kontrol Et</button>' +
          '<button type="button" class="matching-retry-btn" style="display:none;" onclick="retryMatching(\'' + mId + '\')">Tekrar Dene</button>' +
          '</div>' +
          '<div class="matching-result-msg" aria-live="polite"></div>' +
          '</div>' + wrapClose;
      }

      case "sentorder": {
        const soId = "sord_" + b.id;
        const shuffled = shuffleArr(b.sentences.map((s, i) => ({ text: s, idx: i })));
        let itemsHtml = "";
        shuffled.forEach((it, i) => {
          const sentTts = (b.audioSlots && b.audioSlots["sent" + it.idx]) ? ttsCluster(it.text, "de-DE", "tts-cluster-sm") : "";
          itemsHtml += '<div class="sentorder-item" data-orig="' + it.idx + '">' +
            '<span class="sentorder-text">' + esc(it.text) + '</span>' +
            sentTts +
            '<span class="sentorder-btns">' +
              '<button type="button" onclick="moveSentOrderItem(this,-1)">' + ICO.up + '</button>' +
              '<button type="button" onclick="moveSentOrderItem(this,1)">' + ICO.down + '</button>' +
            '</span>' +
            '</div>';
        });
        return wrapOpen + '<div class="premium-sentorder-card" id="' + soId + '">' +
          (b.instruction ? '<div class="sentorder-instruction">' + esc(b.instruction) + '</div>' : '') +
          '<div class="sentorder-list">' + itemsHtml + '</div>' +
          '<button class="sentorder-action-btn" onclick="checkSentOrder(\'' + soId + '\')">Sırayı Kontrol Et</button>' +
          '<div class="sentorder-result-msg"></div>' +
          '</div>' + wrapClose;
      }

      case "wordorder": {
        const woId = "word_" + b.id;
        const words = (b.sentence || "").trim().split(/\s+/).filter(Boolean);
        const shuffledW = shuffleArr(words.map((w, i) => ({ text: w, idx: i })));
        let bankHtml = "";
        shuffledW.forEach((w, i) => {
          const chipId = woId + "_c" + i;
          bankHtml += '<button type="button" class="wordorder-chip" id="' + chipId + '" data-word="' + esc(w.text) + '" data-orig="' + w.idx + '" onclick="selectWordOrderChip(this)">' + esc(w.text) + '</button>';
        });
        const wordTts = (b.audioSlots && b.audioSlots.sentence) ? ttsCluster(b.sentence, "de-DE", "tts-cluster-sm") : "";
        return wrapOpen + '<div class="premium-wordorder-card" id="' + woId + '" data-total="' + words.length + '">' +
          (b.instruction ? '<div class="wordorder-instruction">' + esc(b.instruction) + wordTts + '</div>' : wordTts) +
          '<div class="wordorder-answer-line"></div>' +
          '<div class="wordorder-bank">' + bankHtml + '</div>' +
          '<div class="wordorder-actions">' +
            '<button type="button" class="wordorder-reset-btn" onclick="resetWordOrder(\'' + woId + '\')">Temizle</button>' +
            '<button type="button" class="wordorder-action-btn" onclick="checkWordOrder(\'' + woId + '\')">Kontrol Et</button>' +
          '</div>' +
          '<div class="wordorder-result-msg"></div>' +
          '</div>' + wrapClose;
      }

      case "dialogue": {
        const dlgId = "dlg_" + b.id;
        const firstChoiceIdx = b.lines.findIndex(ln => ln.choice);
        let stepsHtml = "";
        b.lines.forEach((ln, i) => {
          const side = ln.speaker === "A" ? "left" : "right";
          const name = ln.speaker === "A" ? (b.speakerA || "A") : (b.speakerB || "B");
          const lineTts = (b.audioSlots && b.audioSlots["line" + i]) ? ttsCluster(ln.text, "de-DE", "tts-cluster-sm") : "";
          const bubbleHtml = '<div class="dialogue-bubble dialogue-' + side + '">' +
            '<div class="dialogue-avatar">' + esc((name || "?").charAt(0).toUpperCase()) + '</div>' +
            '<div class="dialogue-bubble-body">' +
              '<div class="dialogue-bubble-name">' + esc(name) + '</div>' +
              '<div class="dialogue-bubble-text">' + esc(ln.text) + lineTts + '</div>' +
            '</div>' +
          '</div>';
          const lockedCls = (firstChoiceIdx !== -1 && i > firstChoiceIdx) ? " dialogue-locked" : "";
          if (ln.choice) {
            const opts = shuffleArr([ln.text].concat(ln.distractors || []).map(t => ({ text: t })));
            let optsHtml = "";
            opts.forEach(o => {
              optsHtml += '<button type="button" class="dialogue-opt-btn" data-correct="' + (o.text === ln.text ? "true" : "false") + '" onclick="checkDialogueChoice(this)">' + esc(o.text) + '</button>';
            });
            stepsHtml += '<div class="dialogue-step dialogue-choice-step' + lockedCls + '" data-step="' + i + '" data-bubble-html="' + esc(bubbleHtml) + '">' +
              '<div class="dialogue-options-wrap">' +
                '<div class="dialogue-choice-label">' + esc(name) + ' ne diyor?</div>' +
                optsHtml +
              '</div>' +
            '</div>';
          } else {
            stepsHtml += '<div class="dialogue-step dialogue-bubble-step' + lockedCls + '" data-step="' + i + '">' + bubbleHtml + '</div>';
          }
        });
        return wrapOpen + '<div class="premium-dialogue-card" id="' + dlgId + '">' +
          (b.instruction ? '<div class="dialogue-instruction">' + esc(b.instruction) + '</div>' : '') +
          stepsHtml +
          '</div>' + wrapClose;
      }

      case "audio": {
        const audT = escJsAttr(b.text);
        const audL = b.lang || "de-DE";
        return wrapOpen + '<div class="premium-audio-card">' +
          '<button class="premium-audio-btn premium-audio-btn-slow" title="Yavaş oku" aria-label="Yavaş oku" onclick="playSpeechText(this,\'' + audT + '\',\'' + audL + '\',0.55)">' +
            TTS_ICO_SLOW +
          '</button>' +
          '<button class="premium-audio-btn" title="Normal hızda oku" aria-label="Normal hızda oku" onclick="playSpeechText(this,\'' + audT + '\',\'' + audL + '\',1)">' +
            ICO.play +
          '</button>' +
          '<div class="premium-audio-details">' +
            '<span class="premium-audio-text">' + esc(b.text || "") + '</span>' +
            '<span class="premium-audio-caption">' + esc(b.caption || "Almanca Telaffuz") + '</span>' +
            '<span class="premium-audio-meta">Sistem Sesi (Web Speech API)</span>' +
          '</div>' +
          '</div>' + wrapClose;
      }

      case "listen": {
        const lsId = "listen_" + b.id;
        let questionsHtml = "";
        (b.questions || []).forEach((q, qi) => {
          const qName = lsId + "_q" + qi;
          let optsHtml = "";
          (q.options || []).forEach((opt, oi) => {
            optsHtml += '<label class="listen-option" data-oidx="' + oi + '">' +
              '<input type="radio" name="' + qName + '" value="' + oi + '" onchange="checkListenAnswer(this,' + Number(q.correctIndex || 0) + ')">' +
              '<span>' + esc(opt) + '</span>' +
              '</label>';
          });
          questionsHtml += '<div class="listen-question">' +
            '<h4>' + esc(q.question) + '</h4>' +
            '<div class="listen-options">' + optsHtml + '</div>' +
            '<div class="listen-feedback"></div>' +
            '</div>';
        });
        const audioHtml = b.audioUrl
          ? '<audio controls preload="metadata" class="listen-audio-player" src="' + esc(b.audioUrl) + '"></audio>'
          : '<div class="listen-audio-empty">Bu bloğa henüz bir ses dosyası eklenmedi.</div>';
        return wrapOpen + '<div class="listen-prev" id="' + lsId + '">' +
          audioHtml +
          (b.audioCaption ? '<div class="listen-caption">' + esc(b.audioCaption) + '</div>' : '') +
          questionsHtml +
          '</div>' + wrapClose;
      }

      case "konjugation": {
        const kjId = "konj_" + b.id;
        const TENSE_LABEL = { praesens: "Präsens", perfekt: "Perfekt", praeteritum: "Präteritum" };
        const KONJ_PERSONS = [["ich", "ich"], ["du", "du"], ["er", "er/sie/es"], ["wir", "wir"], ["ihr", "ihr"], ["sie", "sie/Sie"]];
        let rowsHtml = "";
        KONJ_PERSONS.forEach(([key, label]) => {
          const answer = (b.answers && b.answers[key]) || "";
          rowsHtml += '<div class="konj-row">' +
            '<span class="konj-person">' + esc(label) + '</span>' +
            '<input type="text" class="konj-input" data-answer="' + esc(answer) + '" autocomplete="off" spellcheck="false" autocapitalize="off">' +
            '<span class="konj-correct-answer"></span>' +
            '</div>';
        });
        return wrapOpen + '<div class="konj-prev" id="' + kjId + '">' +
          '<div class="konj-header"><strong>Fiil:</strong>&nbsp;' + esc(b.verb) + ((b.audioSlots && b.audioSlots.verb) ? ttsCluster(b.verb, "de-DE", "tts-cluster-sm") : "") + '&nbsp;<span>' + esc(TENSE_LABEL[b.tense] || b.tense) + '</span></div>' +
          '<div class="konj-rows">' + rowsHtml + '</div>' +
          '<button type="button" class="konj-action-btn" onclick="checkKonjugation(\'' + kjId + '\')">Cevapları Kontrol Et</button>' +
          '<div class="konj-result"></div>' +
          '</div>' + wrapClose;
      }

      case "accordion": {
        let accHtml = wrapOpen + '<div class="premium-accordion-wrap">';
        b.items.forEach((item, i) => {
          const accQTts = (b.audioSlots && b.audioSlots["item" + i + "q"]) ? ttsCluster(stripHtmlForTts(item.q), "de-DE", "tts-cluster-sm", "event.stopPropagation();") : "";
          const accATts = (b.audioSlots && b.audioSlots["item" + i + "a"]) ? ttsCluster(stripHtmlForTts(item.a), "de-DE", "tts-cluster-sm") : "";
          accHtml += '<div class="accordion-item-box">' +
            '<button class="accordion-trigger" onclick="toggleAccordion(this)">' +
              '<span>' + item.q + '</span>' + accQTts +
              '<span class="acc-chevron">▼</span>' +
            '</button>' +
            '<div class="accordion-panel-content"><p>' + item.a + accATts + '</p></div>' +
            '</div>';
        });
        accHtml += '</div>' + wrapClose;
        return accHtml;
      }

      case "video": {
        const embed = parseVideoEmbed(b.url);
        if (!embed) return "";
        return wrapOpen + '<div class="premium-video-card">' +
          '<div class="video-ratio-box">' +
            '<iframe src="' + esc(embed) + '" allowfullscreen loading="lazy"></iframe>' +
          '</div>' +
          (b.caption ? '<div class="premium-video-caption">' + esc(b.caption) + '</div>' : '') +
          '</div>' + wrapClose;
      }

      case "code": {
        return wrapOpen + '<div class="premium-code-box">' +
          '<div class="code-header-bar">' +
            '<span class="code-lang-tag">' + esc(b.lang).toUpperCase() + '</span>' +
            '<button class="code-copy-btn" onclick="copyCodePayload(this)">Kopyala</button>' +
          '</div>' +
          '<pre><code>' + esc(b.code) + '</code></pre>' +
          '</div>' + wrapClose;
      }

      case "toc": {
        return wrapOpen + '<div class="premium-toc-card" id="auto-toc-container">' +
          '<div class="toc-header-title">' + esc(b.title || "İçindekiler") + '</div>' +
          '<ul class="toc-links-list" id="auto-toc-list">' +
            '<li style="color:rgba(255,255,255,0.3); font-size:12.5px; list-style:none;">Yükleniyor...</li>' +
          '</ul>' +
          '</div>' + wrapClose;
      }

      default: return "";
    }
  }