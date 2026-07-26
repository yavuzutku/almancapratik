"use strict";
/* ═══════════════════════════════════════════════════════════
   JS 1/4 — TEMEL: Sözlük (constants) + Metin/Ses Yardımcıları
   + Canvas Çekirdeği + Blok Ayar Paneli
   4 parça dosyadan birleştirilmiştir (sıra ve işlev korunmuştur):
   constants.js, audio-text-utils.js, canvas-core.js, settings-panel.js
   ═══════════════════════════════════════════════════════════ */

/* ---------- constants.js ---------- */
/* ═══════════════════════════════════════════════════════════
   1) SABİTLER & BLOK VARSAYILANLARI
   Bu dosya, app.js'nin bölünmesiyle oluşturulmuştur.
   Diğer js/*.js dosyalarıyla aynı global scope'u paylaşır
   (module DEĞİLDİR) — bu yüzden index.html'deki script sırası önemlidir.
   ═══════════════════════════════════════════════════════════ */

  let blocks = [];
  let seq = 0;
  const nextId = () => "b" + (++seq);
  let draggingBlockId = null;
  let activeBlockId = null;
  /* Bir bloğa tıklanınca üstündeki araç çubuğu (BAŞLIK/PARAGRAF etiketi + ikonlar)
     görünür; odak başka bir bloğa ya da boş alana gidince tekrar gizlenir.
     Böylece düzenleme yapılırken önizlemedeki gerçek görünüm bozulmadan kalır. */
  let focusedBlockId = null;
  function setBlockFocus(id) {
    if (focusedBlockId === id) return;
    const canvas = $("#canvas");
    if (focusedBlockId && canvas) {
      const prev = canvas.querySelector('.block[data-id="' + focusedBlockId + '"]');
      if (prev) prev.classList.remove("block-focused");
    }
    focusedBlockId = id;
    if (id && canvas) {
      const cur = canvas.querySelector('.block[data-id="' + id + '"]');
      if (cur) cur.classList.add("block-focused");
    }
  }

  const THEME_META = {
    amber: { label: "Sarı",    css: "#ffd250" },
    green: { label: "Yeşil",   css: "#4fd69c" },
    blue:  { label: "Mavi",    css: "#60a5fa" },
    rose:  { label: "Kırmızı", css: "#f07068" }
  };
  const CALLOUT_ICON = {
    amber: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    green: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>',
    blue:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    rose:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
  };

  function commonDefaults() { return { padY: 0, padX: 0, marginY: 0, bgColor: "", bgOpacity: 30, audioSlots: {} }; }
  function defaultsFor(type) {
    const base = commonDefaults();
    switch (type) {
      case "heading":
        return Object.assign(base, { level: "h2", text: "Başlık metni", size: 28, color: "#ffffff", weight: "700", font: "display", lineHeight: 150, letterSpacing: -1 });
      case "paragraph":
        return Object.assign(base, { html: "Paragraf metnini buraya yazın. Doğrudan tıklayıp düzenleyebilirsiniz.", size: 17, align: "left", color: "#cbd5e1", font: "body", lineHeight: 178, letterSpacing: -1, variant: "normal", dropCap: false });
      case "image":
        return Object.assign(base, { url: "", alt: "", caption: "", width: 100, height: "", radius: 16, align: "center", objectFit: "cover", shadow: "0", lazy: "1" });
      case "vocab":
        return Object.assign(base, { de: "das Beispiel", tr: "örnek", phon: "das bai-şpiil", example: "Das ist nur ein Beispiel.", tip: "", tipEnabled: false, cardSize: "medium" });
      case "callout":
        return Object.assign(base, { theme: "amber", title: "Bilgi", html: "Öğrenciler için önemli bir not buraya yazılabilir." });
      case "table":
        return Object.assign(base, { headers: ["Sütun 1", "Sütun 2"], rows: [["", ""], ["", ""]], audioHeaders: [false, false], audioCells: [[false, false], [false, false]] });
      case "quiz":
        return Object.assign(base, { question: "Soru metni buraya gelecek?", options: ["Seçenek A", "Seçenek B", "Seçenek C"], correctIndex: 0, explanation: "" });
      case "fillblank":
        return Object.assign(base, { instruction: "Boşlukları uygun kelimelerle doldurun.", text: "Ich {{gehe}} heute ins {{Kino}}." });
      case "matching":
        return Object.assign(base, { instruction: "Sol taraftaki kelimeleri doğru anlamlarıyla eşleştirin.", mode: "text", pairs: [{ left: "das Haus", right: "ev", image: "" }, { left: "der Baum", right: "ağaç", image: "" }, { left: "die Katze", right: "kedi", image: "" }] });
      case "sentorder":
        return Object.assign(base, { instruction: "Cümleleri doğru sıraya dizin.", sentences: ["Ich stehe auf.", "Ich dusche mich.", "Ich frühstücke.", "Ich gehe zur Arbeit."] });
      case "wordorder":
        return Object.assign(base, { instruction: "Kelimelere doğru sırada tıklayın.", sentence: "Ich gehe heute ins Kino." });
      case "dialogue":
        return Object.assign(base, {
          instruction: "Diyaloğu takip edin ve doğru cevabı seçin.",
          speakerA: "Anna", speakerB: "Max",
          lines: [
            { speaker: "A", text: "Hallo! Wie geht's dir?", choice: false, distractors: [] },
            { speaker: "B", text: "Mir geht es gut, danke! Und dir?", choice: true, distractors: ["Ich bin Lehrer von Beruf.", "Das Wetter ist heute schön."] },
            { speaker: "A", text: "Auch gut, danke! Was machst du heute?", choice: false, distractors: [] },
            { speaker: "B", text: "Ich gehe einkaufen.", choice: true, distractors: ["Ich schlafe den ganzen Tag.", "Ich weiß es noch nicht."] }
          ]
        });
      case "audio":
        return Object.assign(base, { text: "Guten Tag", caption: "Dinlemek için oynat tuşuna basın", lang: "de-DE" });
      case "listen":
        return Object.assign(base, {
          audioUrl: "", audioCaption: "Ses kaydını dinleyin ve aşağıdaki soruları cevaplayın.",
          questions: [
            { question: "Anna'nın adı nedir?", options: ["Maria", "Anna", "Julia", "Sophie"], correctIndex: 1 }
          ]
        });
      case "konjugation":
        return Object.assign(base, {
          verb: "gehen", tense: "praesens",
          answers: { ich: "gehe", du: "gehst", er: "geht", wir: "gehen", ihr: "geht", sie: "gehen" }
        });
      case "accordion":
        return Object.assign(base, { items: [{ q: "Soru veya başlık 1", a: "Buraya cevabı veya çözümü yazın." }] });
      case "video":
        return Object.assign(base, { url: "", caption: "" });
      case "code":
        return Object.assign(base, { lang: "javascript", code: "// Kod örneğiniz buraya" });
      case "toc":
        return Object.assign(base, { title: "İçindekiler" });
      default:
        return base;
    }
  }

  const TYPE_LABEL = { heading: "Başlık", paragraph: "Paragraf", image: "Görsel", vocab: "Kelime Kartı", callout: "Bilgi Kutusu", table: "Tablo", quiz: "Quiz / Sınav", fillblank: "Boşluk Doldurma", matching: "Eşleştirme", sentorder: "Cümle Sıralama", wordorder: "Kelime Sıralama", dialogue: "Diyalog / Sohbet", audio: "Sesli Okuma", listen: "Dinleme Anlama", konjugation: "Fiil Çekim Alıştırması", accordion: "Akordeon / SSS", video: "Video", code: "Kod Bloğu", toc: "İçindekiler" };
  const ICO = {
    up:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
    down:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
    gear:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    alignL:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>',
    alignC:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>',
    alignR:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>',
    alignJ:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>',
    plus:  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    warn:  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    tip:   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>',
    bold:      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>',
    italic:    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>',
    underline: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>',
    link:      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    highlight: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    play:      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    tts:       '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
    grip:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
    close:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    clear:     '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3 21 7 10 18H4v-6L17 3z"/><line x1="4" y1="21" x2="20" y2="21"/></svg>',
    strike:    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><path d="M16 6.5c-.7-1.2-2.1-2-4-2-2.5 0-4.5 1.2-4.5 3.2 0 1.6 1.2 2.4 2.8 2.8"/><path d="M8 17.2c.7 1.3 2.2 2.1 4.2 2.1 2.5 0 4.6-1.1 4.6-3.2 0-1.1-.5-1.9-1.5-2.5"/></svg>',
    listUl:    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><circle cx="4.5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>',
    listOl:    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="1.5" y="8.5" font-size="7" fill="currentColor" stroke="none" font-family="sans-serif">1</text><text x="1.5" y="14.5" font-size="7" fill="currentColor" stroke="none" font-family="sans-serif">2</text><text x="1.5" y="20.5" font-size="7" fill="currentColor" stroke="none" font-family="sans-serif">3</text></svg>',
    chevronDown: '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    textA: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19 11 5h2l6 14"/><path d="M7.2 14h9.6"/></svg>'
  };

  function iconFor(type) {
    switch (type) {
      case "heading":  return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></svg>';
      case "paragraph":return ICO.alignL;
      case "image":    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
      case "vocab":    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
      case "callout":  return ICO.warn;
      case "table":    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>';
      case "quiz":     return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      case "fillblank":return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>';
      case "matching": return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="12" r="2"/><path d="M8 6.6 16 11"/><path d="M8 17.4 16 13"/></svg>';
      case "sentorder":return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>';
      case "wordorder":return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="8.5" y="14" width="7" height="7" rx="1.5"/></svg>';
      case "dialogue":return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
      case "audio":    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
      case "listen":   return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-3a9 9 0 0 1 18 0v3"/><path d="M21 15.5a2.5 2.5 0 0 1-2.5 2.5H17v-6h1.5a2.5 2.5 0 0 1 2.5 2.5v1z"/><path d="M3 15.5A2.5 2.5 0 0 0 5.5 18H7v-6H5.5A2.5 2.5 0 0 0 3 14.5v1z"/></svg>';
      case "konjugation":return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
      case "accordion":return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
      case "video":    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>';
      case "code":     return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';
      case "toc":      return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>';
      default: return "";
    }
  }

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

/* ---------- audio-text-utils.js ---------- */
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


/* ---------- canvas-core.js ---------- */
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


/* ---------- settings-panel.js ---------- */
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

