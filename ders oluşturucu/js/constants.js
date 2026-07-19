"use strict";
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
