"use strict";
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

