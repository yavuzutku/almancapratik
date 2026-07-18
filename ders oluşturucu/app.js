(function () {
  "use strict";

  let blocks = [];
  let seq = 0;
  const nextId = () => "b" + (++seq);

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

  function commonDefaults() { return { padY: 0, padX: 0, marginY: 0, bgColor: "", bgOpacity: 30 }; }
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
        return Object.assign(base, { de: "das Beispiel", tr: "örnek", phon: "das bai-şpiil", example: "Das ist nur ein Beispiel.", tip: "", tipEnabled: false });
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
    tts:       '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>'
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
  function fontStack(key) { return key === "display" ? "'Plus Jakarta Sans', sans-serif" : "'Inter', sans-serif"; }
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
    blocks.push(block);
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
    renderAll();
  }
  function clearAll() {
    if (!blocks.length) return;
    if (!confirm("Tüm bloklar silinecek. Emin misiniz?")) return;
    blocks = []; renderAll();
  }

  function renderAll() {
    const canvas = $("#canvas");
    canvas.innerHTML = "";
    $("#blockCount").textContent = blocks.length + " blok";
    if (!blocks.length) {
      canvas.innerHTML =
        '<div class="empty-state"><div class="es-ico"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>' +
        '<h3>Henüz blok yok</h3><p>Soldaki panelden bir blok türü seçerek dersinizi oluşturmaya başlayın.</p></div>';
      return;
    }
    blocks.forEach((block, idx) => canvas.appendChild(buildBlockEl(block, idx)));
  }

  function buildBlockEl(block, idx) {
    const wrap = document.createElement("div");
    wrap.className = "block"; wrap.dataset.id = block.id; wrap.dataset.type = block.type;

    const toolbar = document.createElement("div");
    toolbar.className = "block-toolbar";
    toolbar.innerHTML =
      '<div class="block-type-label">' + iconFor(block.type) + '<span>' + TYPE_LABEL[block.type] + '</span></div>' +
      '<div class="block-actions">' +
        '<button data-act="up" title="Yukarı taşı"' + (idx === 0 ? " disabled" : "") + '>' + ICO.up + '</button>' +
        '<button data-act="down" title="Aşağı taşı"' + (idx === blocks.length - 1 ? " disabled" : "") + '>' + ICO.down + '</button>' +
        '<button data-act="settings" title="Ayarlar">' + ICO.gear + '</button>' +
        '<button data-act="delete" class="danger" title="Bloğu sil">' + ICO.trash + '</button>' +
      '</div>';
    wrap.appendChild(toolbar);
    toolbar.querySelector('[data-act="up"]').addEventListener("click", () => moveBlock(block.id, "up"));
    toolbar.querySelector('[data-act="down"]').addEventListener("click", () => moveBlock(block.id, "down"));
    toolbar.querySelector('[data-act="delete"]').addEventListener("click", () => deleteBlock(block.id));
    const gearBtn = toolbar.querySelector('[data-act="settings"]');
    gearBtn.addEventListener("click", () => {
      const drawer = wrap.querySelector(".block-settings");
      const open = drawer.classList.toggle("open");
      gearBtn.classList.toggle("active", open);
    });

    wrap.appendChild(buildSettingsEl(block));

    const content = document.createElement("div");
    content.className = "block-content";
    content.style.cssText = wrapperStyle(block, block.type === "paragraph");
    buildContentEl(block, content);
    wrap.appendChild(content);
    return wrap;
  }

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

  function buildSettingsEl(block) {
    const el = document.createElement("div");
    el.className = "block-settings";
    let h = "";

    if (block.type === "heading") {
      h += fg("Seviye", selectHtml("level", [["h1","H1"],["h2","H2"],["h3","H3"]], block.level));
      h += fg("Boyut (px)", rangeHtml("size", 16, 52, block.size));
      h += fg("Renk", '<input type="color" data-f="color" value="' + block.color + '">');
      h += fg("Kalınlık", selectHtml("weight", [["500","Orta"],["600","Yarı Kalın"],["700","Kalın"],["800","Ekstra Kalın"]], block.weight));
      h += fg("Font", selectHtml("font", [["display","Plus Jakarta Sans"],["body","Inter"]], block.font));
      h += fg("Satır Yüksekliği", rangeHtml("lineHeight", 110, 180, block.lineHeight, "%"));
      h += fg("Harf Aralığı (px)", rangeHtml("letterSpacing", -3, 4, block.letterSpacing));
    } else if (block.type === "paragraph") {
      h += fg("Stil", selectHtml("variant", [["normal","Normal"],["quote","Alıntı"],["highlight","Vurgu Kutusu"]], block.variant || "normal"));
      h += fg("Büyük Baş Harf (Drop Cap)", selectHtml("dropCap", [["0","Kapalı"],["1","Açık"]], block.dropCap ? "1" : "0"));
      h += fg("Boyut (px)", rangeHtml("size", 13, 26, block.size));
      h += fg("Hizalama", alignBtnsHtml("align", block.align));
      h += fg("Renk", '<input type="color" data-f="color" value="' + rgbaToHex(block.color) + '">');
      h += fg("Font", selectHtml("font", [["body","Inter"],["display","Plus Jakarta Sans"]], block.font));
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
    }

    if (block.type !== "paragraph") {
      h += '<div class="settings-divider"></div><div class="settings-group-label">Boşluk &amp; Arka Plan</div>';
      h += fg("İç Boşluk Y (px)", rangeHtml("padY", 0, 60, block.padY));
      h += fg("İç Boşluk X (px)", rangeHtml("padX", 0, 60, block.padX));
      h += fg("Dış Boşluk (px)", rangeHtml("marginY", 0, 60, block.marginY));
      h += fg("Arka Plan Rengi", '<input type="color" data-f="bgColor" value="' + (block.bgColor || "#3b82f6") + '">');
      h += fg("Şeffaflık (%)", rangeHtml("bgOpacity", 0, 100, block.bgOpacity));
    } else {
      h += '<div class="settings-divider"></div><div class="settings-group-label">Boşluk (Arka plan her zaman şeffaftır)</div>';
      h += fg("İç Boşluk Y (px)", rangeHtml("padY", 0, 60, block.padY));
      h += fg("İç Boşluk X (px)", rangeHtml("padX", 0, 60, block.padX));
      h += fg("Dış Boşluk (px)", rangeHtml("marginY", 0, 60, block.marginY));
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
        block[field] = val;
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
  }

  function applyBlockStyle(block) {
    const wrap = $('.block[data-id="' + block.id + '"]');
    if (!wrap) return;
    const contentEl = wrap.querySelector(".block-content");
    if (contentEl) contentEl.style.cssText = wrapperStyle(block, block.type === "paragraph");

    if (block.type === "heading") {
      const el2 = wrap.querySelector(".hp-editable");
      if (el2) el2.style.cssText = "font-family:" + fontStack(block.font) + ";font-size:" + block.size + "px;color:" + block.color + ";font-weight:" + block.weight + ";line-height:" + (block.lineHeight/100) + ";letter-spacing:" + block.letterSpacing + "px;";
    } else if (block.type === "paragraph") {
      const el2 = wrap.querySelector(".hp-editable");
      if (el2) el2.style.cssText = "font-family:" + fontStack(block.font) + ";font-size:" + block.size + "px;color:" + block.color + ";text-align:" + block.align + ";line-height:" + (block.lineHeight/100) + ";letter-spacing:" + block.letterSpacing + "px;";
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

  function buildContentEl(block, content) {
    if (block.type === "heading") {
      const div = document.createElement("div");
      div.className = "hp-editable"; div.contentEditable = "true"; div.dataset.placeholder = "Başlık metni...";
      div.textContent = block.text;
      div.style.cssText = "font-family:" + fontStack(block.font) + ";font-size:" + block.size + "px;color:" + block.color + ";font-weight:" + block.weight + ";line-height:" + (block.lineHeight/100) + ";letter-spacing:" + block.letterSpacing + "px;";
      div.addEventListener("input", () => { block.text = div.textContent; });
      div.addEventListener("keydown", e => { if (e.key === "Enter") e.preventDefault(); });
      content.appendChild(div);

    } else if (block.type === "paragraph") {
      const div = document.createElement("div");
      div.className = "hp-editable"; div.contentEditable = "true"; div.dataset.placeholder = "Paragraf metni...";
      div.innerHTML = block.html;
      div.style.cssText = "font-family:" + fontStack(block.font) + ";font-size:" + block.size + "px;color:" + block.color + ";text-align:" + block.align + ";line-height:" + (block.lineHeight/100) + ";letter-spacing:" + block.letterSpacing + "px;";
      div.addEventListener("input", () => { block.html = div.innerHTML; });
      content.appendChild(div);

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
          '<div><label>Almanca</label><input type="text" data-f="de" value="' + esc(block.de) + '" class="de-input" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;"></div>' +
          '<div><label>Türkçe</label><input type="text" data-f="tr" value="' + esc(block.tr) + '" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;"></div>' +
          '<div class="full" style="margin-top:6px;"><label>Okunuşu</label><input type="text" data-f="phon" value="' + esc(block.phon) + '" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;"></div>' +
          '<div class="full" style="margin-top:6px;"><label>Örnek Cümle</label><input type="text" data-f="example" value="' + esc(block.example) + '" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;"></div>' +
        '</div>' +
        '<button type="button" class="vocab-tip-toggle" style="margin-top:10px; background:transparent; border:none; color:var(--blue-bright); cursor:pointer;">' + ICO.tip + '<span data-tiplabel>' + (block.tipEnabled ? " İpucunu kaldır" : " + İpucu / Gramer Notu ekle") + '</span></button>' +
        '<div class="vocab-tip-wrap" style="display:' + (block.tipEnabled ? "block" : "none") + '; margin-top:6px;"><textarea style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; min-height:60px;">' + esc(block.tip) + '</textarea></div>';

      $all("input", card).forEach(inp => inp.addEventListener("input", () => { block[inp.dataset.f] = inp.value; }));
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
          '<div class="callout-prev-title" contenteditable="true" data-placeholder="Başlık" style="font-weight:700; color:white; margin-bottom:4px;">' + esc(block.title) + '</div>' +
          '<div class="callout-prev-body" contenteditable="true" data-placeholder="Metin..." style="color:var(--text-dim);">' + block.html + '</div>' +
        '</div>';
      box.querySelector(".callout-prev-title").addEventListener("input", function () { block.title = this.textContent; });
      box.querySelector(".callout-prev-body").addEventListener("input", function () { block.html = this.innerHTML; });
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
          h += '<th><div class="tbl-cell-wrap"><span contenteditable="true" data-placeholder="Başlık" data-h="' + ci + '">' + esc(hd) + '</span>' +
            '<button type="button" class="tbl-audio-toggle' + (block.audioHeaders[ci] ? ' active' : '') + '" data-audioh="' + ci + '" title="Bu başlığı sesli okut">' + ICO.tts + '</button>' +
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
          block.audioHeaders[ci] = !block.audioHeaders[ci];
          b.classList.toggle("active", block.audioHeaders[ci]);
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
        <input type="text" class="q-title" placeholder="Soru metni" value="${esc(block.question)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-weight:700;">
        <div class="opts-list" style="margin-top:10px; display:flex; flex-direction:column; gap:6px;"></div>
        <button class="btn btn-sm add-opt" style="margin-top:8px;">+ Seçenek Ekle</button>
        <textarea class="q-explain" placeholder="Doğru cevap açıklaması" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; min-height:50px; margin-top:8px;">${esc(block.explanation)}</textarea>
      `;
      const optsList = card.querySelector(".opts-list");
      function renderQuizOpts() {
        optsList.innerHTML = "";
        block.options.forEach((opt, i) => {
          const row = document.createElement("div");
          row.style.cssText = "display:flex; align-items:center; gap:8px;";
          row.innerHTML = `
            <input type="radio" name="correct_${block.id}" ${block.correctIndex === i ? "checked" : ""} style="accent-color:var(--green);">
            <input type="text" value="${esc(opt)}" style="flex:1; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
            <button class="del-opt" style="background:transparent; border:none; color:var(--rose); cursor:pointer;">×</button>
          `;
          row.querySelector("input[type=radio]").addEventListener("change", () => { block.correctIndex = i; });
          row.querySelector("input[type=text]").addEventListener("input", function() { block.options[i] = this.value; });
          row.querySelector(".del-opt").addEventListener("click", () => { if(block.options.length > 2) { block.options.splice(i,1); if(block.correctIndex >= block.options.length) block.correctIndex=0; renderQuizOpts(); } });
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
        <textarea class="fib-text" placeholder="Metni yazın, boşluk yapılacak kelimeleri {{ }} içine alın. Örn: Ich {{gehe}} ins Kino." style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; min-height:80px; margin-top:8px; font-family:monospace; font-size:13px;">${esc(block.text)}</textarea>
        <div style="margin-top:8px; font-size:11.5px; color:var(--text-faint);">İpucu: boşluğa dönüşecek kelimeyi çift süslü parantez içine yazın — <code>{{cevap}}</code></div>
      `;
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
            const leftInput = document.createElement("input");
            leftInput.type = "text"; leftInput.value = p.left; leftInput.placeholder = "Sol (örn: das Haus)";
            leftInput.style.cssText = "flex:1; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;";
            leftInput.addEventListener("input", function() { p.left = this.value; });
            row.appendChild(leftInput);
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
          row.style.cssText = "display:flex; align-items:center; gap:8px; margin-bottom:6px;";
          row.innerHTML = `
            <span style="color:var(--text-faint); font-size:12px; width:16px; flex-shrink:0;">${i+1}.</span>
            <input type="text" value="${esc(s)}" placeholder="Cümle" style="flex:1; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
            <button class="sord-up" title="Yukarı" ${i===0?"disabled":""} style="background:transparent; border:none; color:var(--text-faint); cursor:pointer;">↑</button>
            <button class="sord-down" title="Aşağı" ${i===block.sentences.length-1?"disabled":""} style="background:transparent; border:none; color:var(--text-faint); cursor:pointer;">↓</button>
            <button class="sord-del" style="background:transparent; border:none; color:var(--rose); cursor:pointer;">×</button>
          `;
          row.querySelector("input").addEventListener("input", function() { block.sentences[i] = this.value; });
          row.querySelector(".sord-up").addEventListener("click", () => { if (i>0) { const t=block.sentences[i-1]; block.sentences[i-1]=block.sentences[i]; block.sentences[i]=t; renderSentences(); } });
          row.querySelector(".sord-down").addEventListener("click", () => { if (i<block.sentences.length-1) { const t=block.sentences[i+1]; block.sentences[i+1]=block.sentences[i]; block.sentences[i]=t; renderSentences(); } });
          row.querySelector(".sord-del").addEventListener("click", () => { if (block.sentences.length > 2) { block.sentences.splice(i,1); renderSentences(); } });
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
        <input type="text" class="word-sentence" placeholder="Cümle (örn: Ich gehe heute ins Kino.)" value="${esc(block.sentence)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
        <div style="margin-top:8px; font-size:11.5px; color:var(--text-faint);">Öğrenciye bu cümlenin kelimeleri karışık sırada, tıklanabilir kutucuklar halinde gösterilir. Doğru sırayla tıklayınca onaylar.</div>
      `;
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
              <input type="text" class="dlg-text" value="${esc(ln.text)}" placeholder="Konuşma metni" style="flex:1; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px;">
              <button class="dlg-up" title="Yukarı" ${i === 0 ? "disabled" : ""} style="background:transparent; border:none; color:var(--text-faint); cursor:pointer;">↑</button>
              <button class="dlg-down" title="Aşağı" ${i === block.lines.length - 1 ? "disabled" : ""} style="background:transparent; border:none; color:var(--text-faint); cursor:pointer;">↓</button>
              <button class="dlg-del" style="background:transparent; border:none; color:var(--rose); cursor:pointer;">×</button>
            </div>
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-dim); cursor:pointer;">
              <input type="checkbox" class="dlg-choice-toggle" ${ln.choice ? "checked" : ""}> Öğrenci bu repliği seçsin (çoktan seçmeli hale getir)
            </label>
            <div class="dlg-distractors-wrap" style="margin-top:8px; ${ln.choice ? "" : "display:none;"}"></div>
          `;
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
            <input type="text" class="kj-verb" placeholder="gehen" value="${esc(block.verb)}" style="width:100%; padding:8px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:6px; font-weight:700;">
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
            <input type="text" placeholder="Başlık / Soru" value="${esc(item.q)}" style="width:100%; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:4px;">
            <textarea placeholder="Açıklama / İçerik" style="width:100%; padding:6px; background:var(--bg-elevated); border:1px solid var(--border); color:white; border-radius:4px; margin-top:4px; min-height:45px;">${esc(item.a)}</textarea>
          `;
          itemDiv.querySelector("input").addEventListener("input", function() { item.q = this.value; });
          itemDiv.querySelector("textarea").addEventListener("input", function() { item.a = this.value; });
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
  $("#btnClearAll").addEventListener("click", clearAll);

  /* ══════════════════════════════════════
     Dinamik Gradient Tema Sistemi
     ══════════════════════════════════════ */
  const themeSelect = $("#metaTheme");
  const DEFAULT_THEME = "ocean";
  function applyTheme(value) {
    document.body.className = (value && value !== "none") ? "theme-" + value : "";
  }
  applyTheme(themeSelect.value || DEFAULT_THEME);
  themeSelect.addEventListener("change", () => applyTheme(themeSelect.value));

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
    if (!title) { toast("Sayfa başlığı boş olamaz.", "err"); return; }
    if (!slug) { toast("URL slug boş olamaz.", "err"); return; }
    const html = buildExportHtml({ title, slug, description, level, type, difficulty, readTime, author, cover, theme });
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
      theme: $("#metaTheme").value || "none"
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

function renderBlockExport(b) {
    const forceTransparent = b.type === "paragraph";
    const wrapOpen = '<div style="' + wrapperStyle(b, forceTransparent) + '">';
    const wrapClose = "</div>";
    switch (b.type) {
      case "heading": {
        // H2 veya H3 başlıklarına TOC'un yakalayabilmesi için slug ID atıyoruz
        const idAttr = b.level !== "h1" ? ' id="' + slugify(b.text) + '"' : '';
        return wrapOpen + "<" + b.level + idAttr + ' style="font-family:' + fontStack(b.font) + ";font-size:" + b.size + "px;color:" + b.color + ";font-weight:" + b.weight + ";line-height:" + (b.lineHeight/100) + ";letter-spacing:" + b.letterSpacing + 'px;">' + esc(b.text) + "</" + b.level + ">" + wrapClose;
      }

      case "paragraph": {
        // convertTooltips fonksiyonu ile satır içi ipuçlarını HTML elementine çeviriyoruz
        const variant = b.variant || "normal";
        const dropCapCls = (b.dropCap === true || b.dropCap === "1") ? " lb-dropcap" : "";
        const pStyle = 'font-family:' + fontStack(b.font) + ";font-size:" + b.size + "px;color:" + b.color + ";text-align:" + b.align + ";line-height:" + (b.lineHeight/100) + ";letter-spacing:" + b.letterSpacing + "px;background:transparent;";
        const pHtml = '<p class="lb-paragraph-text' + dropCapCls + '" style="' + pStyle + '">' + convertTooltips(b.html) + "</p>";
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

      case "vocab":
        return wrapOpen + '<div class="vocab-card">' +
          '<div class="vocab-de">' + esc(b.de) + ttsCluster(b.de, "de-DE") + "</div>" +
          (b.phon ? '<div class="vocab-phon">[' + esc(b.phon) + "]</div>" : "") +
          '<div class="vocab-tr">' + esc(b.tr) + "</div>" +
          (b.example ? '<div class="vocab-example">' + esc(b.example) + ttsCluster(b.example, "de-DE", "tts-cluster-sm") + "</div>" : "") +
          (b.tipEnabled && b.tip ? '<div class="vocab-tip"><strong>İpucu:</strong> ' + esc(b.tip) + "</div>" : "") +
          "</div>" + wrapClose;

      case "callout":
        return wrapOpen + '<div class="callout-box" data-theme="' + b.theme + '">' +
          '<div class="callout-ico">' + CALLOUT_ICON[b.theme] + '</div>' +
          '<div class="callout-body-wrap"><div class="callout-title">' + esc(b.title) + '</div><div class="callout-text">' + b.html + "</div></div>" +
          "</div>" + wrapClose;

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
        let qHtml = wrapOpen + '<div class="premium-quiz-card" id="' + qId + '" data-correct="' + b.correctIndex + '">' +
          '<div class="quiz-question-title">' + esc(b.question) + '</div>' +
          '<div class="quiz-options-list">';
        b.options.forEach((opt, idx) => {
          qHtml += '<div class="quiz-option-item" data-index="' + idx + '">' +
            '<span class="quiz-indicator"></span>' +
            '<span class="quiz-opt-text">' + esc(opt) + '</span>' +
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
        return wrapOpen + '<div class="premium-fillblank-card" id="' + fbId + '">' +
          (b.instruction ? '<div class="fib-instruction">' + esc(b.instruction) + '</div>' : '') +
          '<div class="fib-text-body">' + inner + '</div>' +
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
          leftHtml += '<div class="matching-drop-zone" role="listitem" data-target-idx="' + i + '" tabindex="0" ' +
            'aria-label="Hedef ' + (i + 1) + ': ' + esc(leftIsImage ? "görsel" : p.left) + '">' +
            '<span class="matching-num">' + (i + 1) + '</span>' +
            '<span class="matching-drop-fixed">' + sideContent(p, leftIsImage, p.left) + (leftIsImage ? "" : ttsCluster(p.left, "de-DE", "tts-cluster-sm", "event.stopPropagation();")) + '</span>' +
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
          itemsHtml += '<div class="sentorder-item" data-orig="' + it.idx + '">' +
            '<span class="sentorder-text">' + esc(it.text) + '</span>' +
            ttsCluster(it.text, "de-DE", "tts-cluster-sm") +
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
        return wrapOpen + '<div class="premium-wordorder-card" id="' + woId + '" data-total="' + words.length + '">' +
          (b.instruction ? '<div class="wordorder-instruction">' + esc(b.instruction) + '</div>' : '') +
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
          const bubbleHtml = '<div class="dialogue-bubble dialogue-' + side + '">' +
            '<div class="dialogue-avatar">' + esc((name || "?").charAt(0).toUpperCase()) + '</div>' +
            '<div class="dialogue-bubble-body">' +
              '<div class="dialogue-bubble-name">' + esc(name) + '</div>' +
              '<div class="dialogue-bubble-text">' + esc(ln.text) + ttsCluster(ln.text, "de-DE", "tts-cluster-sm") + '</div>' +
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
          '<div class="konj-header"><strong>Fiil:</strong>&nbsp;' + esc(b.verb) + ttsCluster(b.verb, "de-DE", "tts-cluster-sm") + '&nbsp;<span>' + esc(TENSE_LABEL[b.tense] || b.tense) + '</span></div>' +
          '<div class="konj-rows">' + rowsHtml + '</div>' +
          '<button type="button" class="konj-action-btn" onclick="checkKonjugation(\'' + kjId + '\')">Cevapları Kontrol Et</button>' +
          '<div class="konj-result"></div>' +
          '</div>' + wrapClose;
      }

      case "accordion": {
        let accHtml = wrapOpen + '<div class="premium-accordion-wrap">';
        b.items.forEach(item => {
          accHtml += '<div class="accordion-item-box">' +
            '<button class="accordion-trigger" onclick="toggleAccordion(this)">' +
              '<span>' + esc(item.q) + '</span>' +
              '<span class="acc-chevron">▼</span>' +
            '</button>' +
            '<div class="accordion-panel-content"><p>' + esc(item.a) + '</p></div>' +
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

function buildExportHtml(meta) {
    const blocksHtml = blocks.map(renderBlockExport).join("\n");
    const canonicalTitle = esc(meta.title);
    const SITE_URL = "https://almancapratik.com";
    const slugPart = encodeURIComponent(meta.slug || slugify(meta.title));
    const canonicalUrl = SITE_URL + "/dersler/" + slugPart + "/";
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      "name": meta.title || "Ders",
      "description": meta.description || "",
      "url": canonicalUrl,
      "inLanguage": "de",
      "educationalLevel": meta.level || undefined,
      "author": meta.author ? { "@type": "Person", "name": meta.author } : undefined,
      "publisher": { "@type": "Organization", "name": "AlmancaPratik", "url": SITE_URL }
    };
    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Anasayfa", "item": SITE_URL + "/" },
        { "@type": "ListItem", "position": 2, "name": "Dersler", "item": SITE_URL + "/dersler/" },
        { "@type": "ListItem", "position": 3, "name": meta.title || "Ders", "item": canonicalUrl }
      ]
    };

    return [
"<!DOCTYPE html>",
'<html lang="tr">',
"<head>",
'<!-- Bu dosya "Ders Builder" ile üretilmiştir. -->',
'<meta charset="UTF-8">',
'<meta name="viewport" content="width=device-width, initial-scale=1.0">',
"<title>" + canonicalTitle + " — AlmancaPratik</title>",
'<meta name="description" content="' + esc(meta.description) + '">',
'<meta name="robots" content="index, follow">',
'<link rel="canonical" href="' + canonicalUrl + '">',
'<meta property="og:type" content="article">',
'<meta property="og:site_name" content="AlmancaPratik">',
'<meta property="og:title" content="' + canonicalTitle + '">',
'<meta property="og:description" content="' + esc(meta.description) + '">',
'<meta property="og:url" content="' + canonicalUrl + '">',
(meta.cover ? '<meta property="og:image" content="' + esc(meta.cover) + '">' : ""),
'<meta name="twitter:card" content="summary_large_image">',
'<meta name="twitter:title" content="' + canonicalTitle + '">',
'<meta name="twitter:description" content="' + esc(meta.description) + '">',
(meta.type ? '<meta name="lesson-type" content="' + esc(meta.type) + '">' : ""),
(meta.author ? '<meta name="author" content="' + esc(meta.author) + '">' : ""),
'<script type="application/ld+json">' + JSON.stringify(jsonLd) + '</' + 'script>',
'<script type="application/ld+json">' + JSON.stringify(breadcrumbLd) + '</' + 'script>',
'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap">',
'<link rel="stylesheet" href="../../css/global.css">',
'<link rel="stylesheet" href="../../src/styles/tokens.css">',
'<link rel="stylesheet" href="../lesson-static.css">',
"<style>",
":root { --xblue: #3b82f6; --xblueb: #60a5fa; --xgreen: #4fd69c; --xrose: #f07068; }",

"/* ── Ders arka plan tema sistemi (25 tema) ── */",
`
/* lesson-themes.css
 * Ders sayfaları için opsiyonel arka plan tema sistemi.
 * Konum: /dersler/lesson-themes.css (lesson-static.css ile aynı klasör)
 * Her /dersler/{slug}/index.html, global.css + tokens.css + lesson-static.css'ten
 * SONRA bu dosyaya referans verir. "Tema Yok" seçilirse <body> üzerinde
 * theme-* class'ı olmaz ve sayfa mevcut varsayılan (gold/mavi) görünümünde kalır.
 *
 * Her tema, gövde arka planını 3 katmanlı bir gradient ile (2x radial + 1x linear)
 * değiştirir ve lesson-static.css'teki .bg-glow--1 / .bg-glow--2 parlama
 * renklerini temayla uyumlu hale getirir.
 */

body.theme-ocean {
  background:
    radial-gradient(ellipse 900px 600px at 12% 15%, rgba(37,99,235,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 88% 85%, rgba(14,165,233,0.22), transparent 60%),
    linear-gradient(160deg, #050b16 0%, #0b1c33 100%);
  background-attachment: fixed;
}
body.theme-ocean .bg-glow--1 { background: radial-gradient(circle, #2563eb, transparent 70%); }
body.theme-ocean .bg-glow--2 { background: radial-gradient(circle, #0ea5e9, transparent 70%); }

body.theme-sunset {
  background:
    radial-gradient(ellipse 900px 600px at 10% 10%, rgba(244,63,94,0.35), transparent 60%),
    radial-gradient(ellipse 800px 550px at 90% 90%, rgba(249,115,22,0.28), transparent 60%),
    linear-gradient(160deg, #1a0f1f 0%, #3b1225 100%);
  background-attachment: fixed;
}
body.theme-sunset .bg-glow--1 { background: radial-gradient(circle, #f43f5e, transparent 70%); }
body.theme-sunset .bg-glow--2 { background: radial-gradient(circle, #f97316, transparent 70%); }

body.theme-aurora {
  background:
    radial-gradient(ellipse 900px 600px at 15% 10%, rgba(16,185,129,0.30), transparent 60%),
    radial-gradient(ellipse 850px 550px at 85% 90%, rgba(147,51,234,0.28), transparent 60%),
    linear-gradient(160deg, #071016 0%, #0d1f24 100%);
  background-attachment: fixed;
}
body.theme-aurora .bg-glow--1 { background: radial-gradient(circle, #10b981, transparent 70%); }
body.theme-aurora .bg-glow--2 { background: radial-gradient(circle, #9333ea, transparent 70%); }

body.theme-forest {
  background:
    radial-gradient(ellipse 900px 600px at 10% 15%, rgba(34,197,94,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 90% 85%, rgba(101,163,13,0.20), transparent 60%),
    linear-gradient(160deg, #081511 0%, #0f2a1d 100%);
  background-attachment: fixed;
}
body.theme-forest .bg-glow--1 { background: radial-gradient(circle, #22c55e, transparent 70%); }
body.theme-forest .bg-glow--2 { background: radial-gradient(circle, #65a30d, transparent 70%); }

body.theme-midnight {
  background:
    radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.5), transparent),
    radial-gradient(2px 2px at 70% 65%, rgba(255,255,255,0.35), transparent),
    radial-gradient(1.5px 1.5px at 45% 80%, rgba(255,255,255,0.3), transparent),
    radial-gradient(ellipse 900px 600px at 20% 20%, rgba(79,70,229,0.25), transparent 60%),
    linear-gradient(160deg, #05060d 0%, #0a0e1f 100%);
  background-attachment: fixed;
}
body.theme-midnight .bg-glow--1 { background: radial-gradient(circle, #4f46e5, transparent 70%); }
body.theme-midnight .bg-glow--2 { background: radial-gradient(circle, #818cf8, transparent 70%); }

body.theme-cyberpunk {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(168,85,247,0.35), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 30%, rgba(236,72,153,0.30), transparent 60%),
    radial-gradient(ellipse 700px 500px at 50% 90%, rgba(59,130,246,0.25), transparent 60%),
    linear-gradient(160deg, #0a0014 0%, #1a0a2e 100%);
  background-attachment: fixed;
}
body.theme-cyberpunk .bg-glow--1 { background: radial-gradient(circle, #a855f7, transparent 70%); }
body.theme-cyberpunk .bg-glow--2 { background: radial-gradient(circle, #ec4899, transparent 70%); }

body.theme-lavender {
  background:
    radial-gradient(ellipse 900px 600px at 15% 15%, rgba(167,139,250,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 85%, rgba(216,180,254,0.20), transparent 60%),
    linear-gradient(160deg, #12101d 0%, #221c38 100%);
  background-attachment: fixed;
}
body.theme-lavender .bg-glow--1 { background: radial-gradient(circle, #a78bfa, transparent 70%); }
body.theme-lavender .bg-glow--2 { background: radial-gradient(circle, #d8b4fe, transparent 70%); }

body.theme-desert {
  background:
    radial-gradient(ellipse 900px 600px at 10% 20%, rgba(217,119,6,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 90% 80%, rgba(180,83,9,0.22), transparent 60%),
    linear-gradient(160deg, #1a1208 0%, #2e1f0d 100%);
  background-attachment: fixed;
}
body.theme-desert .bg-glow--1 { background: radial-gradient(circle, #d97706, transparent 70%); }
body.theme-desert .bg-glow--2 { background: radial-gradient(circle, #b45309, transparent 70%); }

body.theme-volcano {
  background:
    radial-gradient(ellipse 900px 600px at 20% 80%, rgba(220,38,38,0.35), transparent 60%),
    radial-gradient(ellipse 800px 550px at 80% 20%, rgba(249,115,22,0.28), transparent 60%),
    linear-gradient(160deg, #0d0403 0%, #1f0a05 100%);
  background-attachment: fixed;
}
body.theme-volcano .bg-glow--1 { background: radial-gradient(circle, #dc2626, transparent 70%); }
body.theme-volcano .bg-glow--2 { background: radial-gradient(circle, #f97316, transparent 70%); }

body.theme-emerald {
  background:
    radial-gradient(ellipse 900px 600px at 15% 15%, rgba(16,185,129,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 85%, rgba(5,150,105,0.22), transparent 60%),
    linear-gradient(160deg, #04140f 0%, #082820 100%);
  background-attachment: fixed;
}
body.theme-emerald .bg-glow--1 { background: radial-gradient(circle, #10b981, transparent 70%); }
body.theme-emerald .bg-glow--2 { background: radial-gradient(circle, #059669, transparent 70%); }

body.theme-sapphire {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(29,78,216,0.32), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(79,70,229,0.22), transparent 60%),
    linear-gradient(160deg, #050b1a 0%, #0b1533 100%);
  background-attachment: fixed;
}
body.theme-sapphire .bg-glow--1 { background: radial-gradient(circle, #1d4ed8, transparent 70%); }
body.theme-sapphire .bg-glow--2 { background: radial-gradient(circle, #4f46e5, transparent 70%); }

body.theme-rose {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(244,63,94,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(236,72,153,0.20), transparent 60%),
    linear-gradient(160deg, #170a10 0%, #2c111c 100%);
  background-attachment: fixed;
}
body.theme-rose .bg-glow--1 { background: radial-gradient(circle, #f43f5e, transparent 70%); }
body.theme-rose .bg-glow--2 { background: radial-gradient(circle, #ec4899, transparent 70%); }

body.theme-coffee {
  background:
    radial-gradient(ellipse 900px 600px at 10% 15%, rgba(146,64,14,0.25), transparent 60%),
    radial-gradient(ellipse 800px 550px at 90% 85%, rgba(120,53,15,0.20), transparent 60%),
    linear-gradient(160deg, #140f0b 0%, #241a12 100%);
  background-attachment: fixed;
}
body.theme-coffee .bg-glow--1 { background: radial-gradient(circle, #92400e, transparent 70%); }
body.theme-coffee .bg-glow--2 { background: radial-gradient(circle, #78350f, transparent 70%); }

body.theme-neon {
  background:
    radial-gradient(ellipse 900px 600px at 10% 20%, rgba(34,211,238,0.32), transparent 60%),
    radial-gradient(ellipse 800px 550px at 90% 80%, rgba(217,70,239,0.28), transparent 60%),
    radial-gradient(ellipse 700px 500px at 50% 50%, rgba(74,222,128,0.15), transparent 60%),
    linear-gradient(160deg, #06060a 0%, #0c0c18 100%);
  background-attachment: fixed;
}
body.theme-neon .bg-glow--1 { background: radial-gradient(circle, #22d3ee, transparent 70%); }
body.theme-neon .bg-glow--2 { background: radial-gradient(circle, #d946ef, transparent 70%); }

body.theme-galaxy {
  background:
    radial-gradient(1.5px 1.5px at 25% 20%, rgba(255,255,255,0.4), transparent),
    radial-gradient(1.5px 1.5px at 75% 60%, rgba(255,255,255,0.3), transparent),
    radial-gradient(ellipse 900px 600px at 20% 30%, rgba(124,58,237,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 80% 80%, rgba(59,130,246,0.20), transparent 60%),
    linear-gradient(160deg, #050414 0%, #0d0a24 100%);
  background-attachment: fixed;
}
body.theme-galaxy .bg-glow--1 { background: radial-gradient(circle, #7c3aed, transparent 70%); }
body.theme-galaxy .bg-glow--2 { background: radial-gradient(circle, #3b82f6, transparent 70%); }

body.theme-arctic {
  background:
    radial-gradient(ellipse 900px 600px at 15% 15%, rgba(56,189,248,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 85%, rgba(224,242,254,0.12), transparent 60%),
    linear-gradient(160deg, #0a1218 0%, #101f2b 100%);
  background-attachment: fixed;
}
body.theme-arctic .bg-glow--1 { background: radial-gradient(circle, #38bdf8, transparent 70%); }
body.theme-arctic .bg-glow--2 { background: radial-gradient(circle, #e0f2fe, transparent 70%); }

body.theme-tropical {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(20,184,166,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(250,204,21,0.18), transparent 60%),
    linear-gradient(160deg, #031815 0%, #06302a 100%);
  background-attachment: fixed;
}
body.theme-tropical .bg-glow--1 { background: radial-gradient(circle, #14b8a6, transparent 70%); }
body.theme-tropical .bg-glow--2 { background: radial-gradient(circle, #facc15, transparent 70%); }

body.theme-royal {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(126,34,206,0.32), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(212,175,55,0.20), transparent 60%),
    linear-gradient(160deg, #0f0a1a 0%, #1e1330 100%);
  background-attachment: fixed;
}
body.theme-royal .bg-glow--1 { background: radial-gradient(circle, #7e22ce, transparent 70%); }
body.theme-royal .bg-glow--2 { background: radial-gradient(circle, #d4af37, transparent 70%); }

body.theme-obsidian {
  background:
    radial-gradient(ellipse 900px 600px at 20% 20%, rgba(30,41,59,0.50), transparent 60%),
    radial-gradient(ellipse 800px 550px at 80% 80%, rgba(51,65,85,0.35), transparent 60%),
    linear-gradient(160deg, #000000 0%, #0a0a0c 100%);
  background-attachment: fixed;
}
body.theme-obsidian .bg-glow--1 { background: radial-gradient(circle, #1e293b, transparent 70%); }
body.theme-obsidian .bg-glow--2 { background: radial-gradient(circle, #334155, transparent 70%); }

body.theme-peach {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(251,146,60,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(244,114,182,0.18), transparent 60%),
    linear-gradient(160deg, #1a1109 0%, #2e1c10 100%);
  background-attachment: fixed;
}
body.theme-peach .bg-glow--1 { background: radial-gradient(circle, #fb923c, transparent 70%); }
body.theme-peach .bg-glow--2 { background: radial-gradient(circle, #f472b6, transparent 70%); }

body.theme-mint {
  background:
    radial-gradient(ellipse 900px 600px at 15% 15%, rgba(52,211,153,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 85%, rgba(45,212,191,0.18), transparent 60%),
    linear-gradient(160deg, #041512 0%, #082a23 100%);
  background-attachment: fixed;
}
body.theme-mint .bg-glow--1 { background: radial-gradient(circle, #34d399, transparent 70%); }
body.theme-mint .bg-glow--2 { background: radial-gradient(circle, #2dd4bf, transparent 70%); }

body.theme-titanium {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(148,163,184,0.22), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(100,116,139,0.18), transparent 60%),
    linear-gradient(160deg, #0e1013 0%, #181c21 100%);
  background-attachment: fixed;
}
body.theme-titanium .bg-glow--1 { background: radial-gradient(circle, #94a3b8, transparent 70%); }
body.theme-titanium .bg-glow--2 { background: radial-gradient(circle, #64748b, transparent 70%); }

body.theme-ruby {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(190,18,60,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(225,29,72,0.20), transparent 60%),
    linear-gradient(160deg, #12040a 0%, #260814 100%);
  background-attachment: fixed;
}
body.theme-ruby .bg-glow--1 { background: radial-gradient(circle, #be123c, transparent 70%); }
body.theme-ruby .bg-glow--2 { background: radial-gradient(circle, #e11d48, transparent 70%); }

body.theme-amethyst {
  background:
    radial-gradient(ellipse 900px 600px at 15% 15%, rgba(147,51,234,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 85%, rgba(192,132,252,0.18), transparent 60%),
    linear-gradient(160deg, #0f0716 0%, #1e0e2e 100%);
  background-attachment: fixed;
}
body.theme-amethyst .bg-glow--1 { background: radial-gradient(circle, #9333ea, transparent 70%); }
body.theme-amethyst .bg-glow--2 { background: radial-gradient(circle, #c084fc, transparent 70%); }

body.theme-coral {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(251,113,133,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(249,115,22,0.18), transparent 60%),
    linear-gradient(160deg, #190b0b 0%, #2c1414 100%);
  background-attachment: fixed;
}
body.theme-coral .bg-glow--1 { background: radial-gradient(circle, #fb7185, transparent 70%); }
body.theme-coral .bg-glow--2 { background: radial-gradient(circle, #f97316, transparent 70%); }

`,

"/* ── premium scroll progress bar ── */",
".premium-progress-bar { position: fixed; top: 0; left: 0; width: 0%; height: 4px; background: linear-gradient(90deg, var(--xblue), var(--xblueb)); z-index: 9999; transition: width 0.1s ease; }",

"/* ── byline / difficulty badge ── */",
".lb-byline { font-size: 12.5px; color: rgba(226,232,240,0.55); margin: -18px 0 24px; }",
".lb-byline b { color: var(--xblueb); font-weight: 600; }",
'.lesson-diff-badge { padding: 2px 9px; border-radius: 5px; font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25); color: #93c5fd; }',
'.lesson-type-tag { padding: 2px 9px; border-radius: 5px; font-size: 10px; font-weight: 700; letter-spacing: .06em; }',
'.lesson-type-tag[data-type="iletisim"] { background: rgba(96,200,240,0.1); border: 1px solid rgba(96,200,240,0.25); color: #60c8f0; }',
'.lesson-type-tag[data-type="kultur"] { background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.25); color: #a78bfa; }',
'.lesson-type-tag[data-type="gramer"] { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); color: #22c55e; }',

"/* ── vocab card premium ── */",
".vocab-card { background: linear-gradient(160deg, rgba(59,130,246,0.1), rgba(15,23,42,0.55)); border: 1px solid rgba(59,130,246,0.18); border-left: 4px solid var(--xblue); border-radius: 14px; padding: 26px 30px 24px; margin: 30px 0; position: relative; box-shadow: 0 18px 40px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.03); }",
".vocab-card::before { content: 'DE'; position: absolute; top: 18px; right: 22px; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: .12em; color: var(--xblueb); opacity: .6; }",
".vocab-de { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 25px; font-weight: 700; color: var(--xblueb); margin-bottom: 4px; text-shadow: 0 2px 14px rgba(59,130,246,.3); }",
".vocab-phon { font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(226,232,240,.48); margin-bottom: 12px; font-style: italic; }",
".vocab-tr { font-family: 'Inter', sans-serif; font-size: 16.5px; color: #ffffff; font-weight: 600; margin-bottom: 15px; }",
".vocab-example { font-family: 'Inter', sans-serif; font-size: 14.5px; font-style: italic; color: rgba(226,232,240,.68); border-left: 2px solid rgba(148,163,184,.2); padding-left: 14px; }",
".vocab-tip { margin-top: 14px; padding: 11px 15px; background: rgba(96,165,250,.1); border: 1px solid rgba(96,165,250,.28); border-radius: 9px; font-size: 13.5px; color: rgba(226,232,240,.78); }",
".vocab-tip strong { color: #60a5fa; }",

"/* ── callout premium ── */",
".callout-box { border-radius: 12px; padding: 18px 22px 18px 20px; margin: 26px 0; display: flex; gap: 14px; border: 1px solid; }",
'.callout-box[data-theme="amber"] { background: rgba(255,210,80,.08); border-color: rgba(255,210,80,.28); box-shadow: 0 10px 28px rgba(255,210,80,.06); }',
'.callout-box[data-theme="green"] { background: rgba(79,214,156,.08); border-color: rgba(79,214,156,.3); box-shadow: 0 10px 28px rgba(79,214,156,.06); }',
'.callout-box[data-theme="blue"]  { background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.32); box-shadow: 0 10px 28px rgba(59,130,246,.08); }',
'.callout-box[data-theme="rose"]  { background: rgba(240,112,104,.08); border-color: rgba(240,112,104,.3); box-shadow: 0 10px 28px rgba(240,112,104,.06); }',
".callout-ico { flex-shrink: 0; width: 24px; height: 24px; margin-top: 2px; color: #ffd250; }",
'.callout-box[data-theme="green"] .callout-ico { color: #4fd69c; }',
'.callout-box[data-theme="blue"]  .callout-ico { color: #60a5fa; }',
'.callout-box[data-theme="rose"]  .callout-ico { color: #f07068; }',
".callout-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 15.5px; margin-bottom: 6px; color: #ffffff; }",
".callout-text { font-family: 'Inter', sans-serif; font-size: 15px; line-height: 1.7; color: rgba(226,232,240,.78); }",

"/* ── ultra modern responsive table ── */",
".lb-table { width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; margin: 24px 0; }",
".lb-table th, .lb-table td { border: 1px solid rgba(148,163,184,0.18); padding: 11px 15px; font-size: 14.5px; text-align: left; }",
".lb-table th { background: rgba(59,130,246,0.14); color: #ffffff; font-weight: 600; }",
".lb-table td { color: #cbd5e1; background: rgba(255,255,255,0.012); }",
".lb-table tr:nth-child(even) td { background: rgba(255,255,255,0.025); }",

"/* ── premium tooltip engine ── */",
".lb-tooltip { position: relative; border-bottom: 1.5px dashed var(--xblueb); color: var(--xblueb); font-weight: 600; cursor: help; display: inline-block; }",
".lb-tooltip-bubble { position: absolute; bottom: 130%; left: 50%; transform: translateX(-50%) scale(0.9); background: rgba(11,19,36,0.96); border: 1px solid rgba(96,165,250,0.3); color: #ffffff; padding: 7px 11px; border-radius: 8px; font-size: 12.5px; line-height: 1.4; white-space: nowrap; visibility: hidden; opacity: 0; z-index: 1000; box-shadow: 0 10px 25px rgba(0,0,0,0.5); transition: all 0.15s cubic-bezier(.4,0,.2,1); pointer-events: none; }",
".lb-tooltip-bubble::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: rgba(11,19,36,0.96); }",
".lb-tooltip:hover .lb-tooltip-bubble, .lb-tooltip:focus .lb-tooltip-bubble { visibility: visible; opacity: 1; transform: translateX(-50%) scale(1); }",

"/* ── premium quiz elements ── */",
".premium-quiz-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".quiz-question-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 700; color: #ffffff; margin-bottom: 20px; line-height: 1.5; }",
".quiz-options-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; }",
".quiz-option-item { display: flex; align-items: center; gap: 12px; padding: 13px 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; cursor: pointer; transition: all 0.2s ease; }",
".quiz-option-item:hover { background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.25); }",
".quiz-option-item.selected { background: rgba(59,130,246,0.14); border-color: var(--xblue); }",
".quiz-indicator { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }",
".quiz-option-item.selected .quiz-indicator { border-color: var(--xblueb); background: var(--xblue); }",
".quiz-opt-text { font-family: 'Inter', sans-serif; font-size: 14.5px; color: #e2e8f0; }",
".quiz-action-btn { display: block; width: 100%; padding: 12px; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); border: none; border-radius: 9px; color: #071022; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".quiz-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }",
".quiz-option-item.correct-reveal { border-color: var(--xgreen) !important; background: rgba(79,214,156,0.12) !important; }",
".quiz-option-item.correct-reveal .quiz-indicator { border-color: var(--xgreen) !important; background: var(--xgreen) !important; }",
".quiz-option-item.wrong-reveal { border-color: var(--xrose) !important; background: rgba(240,112,104,0.12) !important; }",
".quiz-option-item.wrong-reveal .quiz-indicator { border-color: var(--xrose) !important; background: var(--xrose) !important; }",
".quiz-explain-panel { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; margin-top: 16px; padding: 0 16px; background: rgba(255,255,255,0.02); border-left: 3px solid var(--xgreen); font-size: 13.5px; color: #cbd5e1; line-height: 1.6; }",

"/* ── premium fill-in-the-blank elements ── */",
".premium-fillblank-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".fib-instruction { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--xblueb); margin-bottom: 16px; }",
".fib-text-body { font-family: 'Inter', sans-serif; font-size: 16px; line-height: 2.2; color: #e2e8f0; }",
".fib-input { display: inline-block; margin: 0 3px; padding: 4px 8px; background: rgba(255,255,255,0.04); border: none; border-bottom: 2px solid var(--xblue); border-radius: 4px 4px 0 0; color: #ffffff; font-family: 'Inter', sans-serif; font-size: 15px; text-align: center; }",
".fib-input:focus { outline: none; background: rgba(59,130,246,0.1); }",
".fib-input.fib-correct { border-bottom-color: var(--xgreen); background: rgba(79,214,156,0.14); color: var(--xgreen); }",
".fib-input.fib-wrong { border-bottom-color: var(--xrose); background: rgba(240,112,104,0.14); color: var(--xrose); }",
".fib-action-btn { display: block; width: 100%; margin-top: 20px; padding: 12px; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); border: none; border-radius: 9px; color: #071022; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".fib-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }",
".fib-result-msg { margin-top: 14px; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600; text-align: center; }",

"/* ── premium matching (eşleştirme) elements — real drag & drop ── */",
".premium-matching-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".matching-instruction { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--xblueb); margin-bottom: 18px; }",
".matching-columns { display: flex; gap: 24px; }",
".matching-col-left, .matching-col-right { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }",
".matching-drop-zone { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 2px dashed rgba(255,255,255,0.14); border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 14px; color: #e2e8f0; min-height: 52px; transition: all 0.18s ease; }",
".matching-drop-zone:focus { outline: 2px solid var(--xblueb); outline-offset: 2px; }",
".matching-drop-zone.drop-hover { border-color: var(--xblueb); background: rgba(59,130,246,0.1); }",
".matching-num { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: var(--xblue); color: #071022; font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; }",
".matching-drop-fixed { flex-shrink: 0; display: flex; align-items: center; }",
".matching-drop-slot { flex: 1; min-height: 34px; display: flex; align-items: center; }",
".matching-drop-slot:empty::before { content: 'Buraya bırakın'; color: rgba(226,232,240,0.32); font-size: 12.5px; font-style: italic; }",
".matching-card { display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; cursor: grab; font-family: 'Inter', sans-serif; font-size: 14px; color: #e2e8f0; transition: all 0.18s ease; user-select: none; }",
".matching-card:hover { border-color: rgba(59,130,246,0.4); background: rgba(59,130,246,0.08); }",
".matching-card:focus { outline: 2px solid var(--xblueb); outline-offset: 2px; }",
".matching-card.kbd-selected { border-color: var(--xblueb); box-shadow: 0 0 0 2px rgba(96,165,250,0.35); }",
".matching-card.dragging-card { opacity: 0.35; }",
".matching-card.placed-card { cursor: default; width: 100%; }",
".matching-card-img { max-width: 64px; max-height: 64px; border-radius: 6px; object-fit: cover; }",
".matching-drop-zone.matching-correct { border-style: solid; border-color: var(--xgreen); background: rgba(79,214,156,0.12); }",
".matching-drop-zone.matching-wrong { border-style: solid; border-color: var(--xrose); background: rgba(240,112,104,0.12); }",
".matching-btn-row { display: flex; gap: 10px; margin-top: 22px; }",
".matching-action-btn, .matching-retry-btn { display: block; flex: 1; padding: 12px; border: none; border-radius: 9px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".matching-action-btn { background: linear-gradient(135deg, var(--xblue), var(--xblueb)); color: #071022; }",
".matching-retry-btn { background: rgba(255,255,255,0.05); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.16); }",
".matching-action-btn:hover, .matching-retry-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }",
".matching-result-msg { margin-top: 14px; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600; text-align: center; }",
"@media (max-width: 640px) { .matching-columns { flex-direction: column; } }",

"/* ── premium image block: figure, caption, lightbox ── */",
".premium-image-figure { margin: 0; }",
".lb-image-trigger { display: inline-block; padding: 0; border: none; background: transparent; }",
".premium-image-el { display: block; }",
".premium-image-caption { margin-top: 10px; font-family: 'Inter', sans-serif; font-size: 12.5px; color: rgba(226,232,240,0.5); text-align: center; }",
".lb-lightbox-overlay { position: fixed; inset: 0; background: rgba(4,8,16,0.92); z-index: 10000; display: none; align-items: center; justify-content: center; overflow: hidden; touch-action: none; }",
".lb-lightbox-overlay.open { display: flex; }",
".lb-lightbox-img { max-width: 92vw; max-height: 88vh; border-radius: 10px; box-shadow: 0 30px 80px rgba(0,0,0,0.6); cursor: zoom-in; transition: transform 0.12s ease-out; touch-action: none; }",
".lb-lightbox-close { position: absolute; top: 18px; right: 22px; width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); color: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }",
".lb-lightbox-close:hover { background: rgba(255,255,255,0.16); }",
".lb-lightbox-hint { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); font-family: 'Inter', sans-serif; font-size: 12px; color: rgba(255,255,255,0.45); }",
"@media (max-width: 640px) { .premium-image-el { width: 100% !important; height: auto !important; } }",

"/* ── premium sentence ordering (cümle sıralama) elements ── */",
".premium-sentorder-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".sentorder-instruction { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--xblueb); margin-bottom: 16px; }",
".sentorder-list { display: flex; flex-direction: column; gap: 8px; }",
".sentorder-item { display: flex; align-items: center; gap: 12px; padding: 13px 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; transition: all 0.2s ease; }",
".sentorder-text { flex: 1; font-family: 'Inter', sans-serif; font-size: 14.5px; color: #e2e8f0; }",
".sentorder-btns { display: flex; gap: 4px; flex-shrink: 0; }",
".sentorder-btns button { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #cbd5e1; cursor: pointer; transition: all 0.15s ease; }",
".sentorder-btns button:hover { background: rgba(59,130,246,0.15); color: #fff; }",
".sentorder-item.sentorder-correct { border-color: var(--xgreen); background: rgba(79,214,156,0.1); }",
".sentorder-item.sentorder-wrong { border-color: var(--xrose); background: rgba(240,112,104,0.1); }",
".sentorder-action-btn { display: block; width: 100%; margin-top: 20px; padding: 12px; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); border: none; border-radius: 9px; color: #071022; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".sentorder-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }",
".sentorder-result-msg { margin-top: 14px; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600; text-align: center; }",

"/* ── premium word-order (duolingo style) elements ── */",
".premium-wordorder-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".wordorder-instruction { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--xblueb); margin-bottom: 16px; }",
".wordorder-answer-line { display: flex; flex-wrap: wrap; gap: 8px; min-height: 46px; padding: 10px; margin-bottom: 18px; background: rgba(255,255,255,0.02); border: 2px dashed rgba(255,255,255,0.12); border-radius: 10px; }",
".wordorder-bank { display: flex; flex-wrap: wrap; gap: 8px; }",
".wordorder-chip, .wordorder-placed-chip { font-family: 'Inter', sans-serif; font-size: 14.5px; font-weight: 600; color: #e2e8f0; padding: 9px 15px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; cursor: pointer; transition: all 0.15s ease; }",
".wordorder-chip:hover:not(:disabled) { background: rgba(59,130,246,0.14); border-color: rgba(59,130,246,0.4); transform: translateY(-1px); }",
".wordorder-chip:disabled { opacity: 0.25; cursor: default; }",
".wordorder-placed-chip { background: rgba(59,130,246,0.14); border-color: var(--xblueb); }",
".wordorder-placed-chip:hover { background: rgba(240,112,104,0.14); border-color: var(--xrose); }",
".wordorder-placed-chip.wordorder-correct { border-color: var(--xgreen) !important; background: rgba(79,214,156,0.16) !important; cursor: default; }",
".wordorder-placed-chip.wordorder-wrong { border-color: var(--xrose) !important; background: rgba(240,112,104,0.16) !important; }",
".wordorder-actions { display: flex; gap: 10px; margin-top: 20px; }",
".wordorder-reset-btn { padding: 12px 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); border-radius: 9px; color: #cbd5e1; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".wordorder-reset-btn:hover { border-color: rgba(240,112,104,0.4); color: var(--xrose); }",
".wordorder-action-btn { flex: 1; padding: 12px; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); border: none; border-radius: 9px; color: #071022; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".wordorder-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }",
".wordorder-result-msg { margin-top: 14px; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600; text-align: center; }",

"/* ── premium dialogue / chat-bubble elements ── */",
".premium-dialogue-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".dialogue-instruction { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--xblueb); margin-bottom: 18px; }",
".dialogue-step { margin-bottom: 14px; }",
".dialogue-step.dialogue-locked { display: none; }",
".dialogue-bubble { display: flex; align-items: flex-end; gap: 10px; max-width: 78%; }",
".dialogue-bubble.dialogue-right { margin-left: auto; flex-direction: row-reverse; }",
".dialogue-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13px; color: #071022; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); }",
".dialogue-right .dialogue-avatar { background: linear-gradient(135deg, var(--xgreen), #38b98a); }",
".dialogue-bubble-body { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 10px 14px; }",
".dialogue-left .dialogue-bubble-body { border-bottom-left-radius: 3px; }",
".dialogue-right .dialogue-bubble-body { border-bottom-right-radius: 3px; background: rgba(79,214,156,0.08); border-color: rgba(79,214,156,0.25); }",
".dialogue-bubble-name { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 700; color: var(--xblueb); margin-bottom: 2px; }",
".dialogue-right .dialogue-bubble-name { color: var(--xgreen); text-align: right; }",
".dialogue-bubble-text { font-family: 'Inter', sans-serif; font-size: 14.5px; color: #e2e8f0; line-height: 1.5; }",
".dialogue-options-wrap { max-width: 90%; }",
".dialogue-choice-label { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.5px; font-weight: 700; color: rgba(226,232,240,0.55); margin-bottom: 8px; }",
".dialogue-opt-btn { display: block; width: 100%; text-align: left; margin-bottom: 8px; padding: 10px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; color: #e2e8f0; font-family: 'Inter', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.15s ease; }",
".dialogue-opt-btn:hover { background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.35); }",
".dialogue-opt-btn.dialogue-opt-wrong { border-color: var(--xrose) !important; background: rgba(240,112,104,0.16) !important; animation: dlgShake 0.4s ease; }",
"@keyframes dlgShake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-4px);} 75%{transform:translateX(4px);} }",

"/* ── premium audio elements ── */",
".premium-audio-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.15); border-radius: 12px; margin: 24px 0; }",
".premium-audio-btn { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--xblue); border: none; color: #071022; cursor: pointer; transition: all 0.2s ease; }",
".premium-audio-btn:hover { background: var(--xblueb); transform: scale(1.05); }",
".premium-audio-btn svg { width: 18px; height: 18px; }",
".premium-audio-details { display: flex; flex-direction: column; gap: 4px; }",
".premium-audio-caption { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; }",
".premium-audio-meta { font-size: 11.5px; color: rgba(255,255,255,0.3); }",
".premium-audio-btn-slow { width: 36px; height: 36px; background: rgba(59,130,246,0.14); color: var(--xblueb); }",
".premium-audio-btn-slow:hover { background: rgba(59,130,246,0.26); }",
".premium-audio-btn-slow svg { width: 15px; height: 15px; }",

"/* ── Sesli Okuma (TTS) mini kontrolleri: kelime kartı, diyalog, cümle sıralama vb. ── */",
".tts-cluster { display: inline-flex; align-items: center; gap: 4px; margin-left: 9px; vertical-align: middle; }",
".tts-btn { display: inline-flex; align-items: center; justify-content: center; width: 23px; height: 23px; flex-shrink: 0; padding: 0; border-radius: 50%; border: 1px solid rgba(59,130,246,0.32); background: rgba(59,130,246,0.09); color: var(--xblueb); cursor: pointer; transition: all 0.15s ease; }",
".tts-btn:hover { background: rgba(59,130,246,0.2); border-color: rgba(59,130,246,0.55); transform: scale(1.08); }",
".tts-btn svg { width: 12px; height: 12px; pointer-events: none; display: block; }",
".tts-cluster.tts-cluster-sm .tts-btn { width: 19px; height: 19px; }",
".tts-cluster.tts-cluster-sm .tts-btn svg { width: 10px; height: 10px; }",
".tts-playing { animation: ttsPulse 0.9s ease-in-out infinite; }",
"@keyframes ttsPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); } 50% { box-shadow: 0 0 0 5px rgba(59,130,246,0); } }",

"/* ── premium paragraf varyantları (alıntı / vurgu kutusu / drop cap) ── */",
".lb-dropcap::first-letter { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 3.3em; font-weight: 800; float: left; line-height: 0.82; padding: 4px 8px 0 0; color: var(--xblueb); }",
".lb-paragraph-quote { margin: 26px 0; padding: 6px 0 6px 22px; border-left: 4px solid var(--xblue); }",
".lb-paragraph-quote p { font-style: italic; color: #e2e8f0 !important; }",
".lb-paragraph-highlight { margin: 26px 0; padding: 18px 22px; background: rgba(59,130,246,0.07); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; }",

"/* ── Dinleme Anlama (Hörverstehen) elements ── */",
".listen-prev { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".listen-audio-player { width: 100%; height: 42px; margin-bottom: 14px; border-radius: 10px; }",
".listen-audio-empty { padding: 16px; text-align: center; border: 1.5px dashed rgba(255,255,255,0.16); border-radius: 10px; color: rgba(226,232,240,0.4); font-family: 'Inter', sans-serif; font-size: 13px; margin-bottom: 16px; }",
".listen-caption { font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(226,232,240,0.55); font-style: italic; margin-bottom: 20px; }",
".listen-question { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); }",
".listen-question:first-of-type { margin-top: 0; padding-top: 0; border-top: none; }",
".listen-question h4 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15.5px; font-weight: 700; color: #ffffff; margin: 0 0 12px; line-height: 1.5; }",
".listen-options { display: flex; flex-direction: column; gap: 8px; }",
".listen-option { display: flex; align-items: center; gap: 10px; padding: 11px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 14px; color: #e2e8f0; transition: all 0.18s ease; }",
".listen-option:hover { border-color: rgba(59,130,246,0.32); background: rgba(59,130,246,0.06); }",
".listen-option input[type=radio] { accent-color: var(--xblue); flex-shrink: 0; }",
".listen-option.listen-correct { border-color: var(--xgreen) !important; background: rgba(79,214,156,0.13) !important; color: var(--xgreen); }",
".listen-option.listen-wrong { border-color: var(--xrose) !important; background: rgba(240,112,104,0.13) !important; color: var(--xrose); }",
".listen-feedback { margin-top: 9px; font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 700; min-height: 16px; }",
".listen-feedback.is-correct { color: var(--xgreen); }",
".listen-feedback.is-wrong { color: var(--xrose); }",

"/* ── Fiil Çekim Alıştırması (Konjugation) elements ── */",
".konj-prev { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".konj-header { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; color: #ffffff; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }",
".konj-header strong { color: var(--xblueb); }",
".konj-header span { font-family: 'Inter', sans-serif; font-size: 12px; padding: 3px 10px; background: rgba(59,130,246,0.14); border-radius: 20px; color: var(--xblueb); font-weight: 600; }",
".konj-rows { display: flex; flex-direction: column; gap: 10px; }",
".konj-row { display: flex; align-items: center; gap: 12px; }",
".konj-person { flex: 0 0 92px; font-family: 'Inter', sans-serif; font-size: 13.5px; color: rgba(226,232,240,0.68); font-weight: 600; }",
".konj-input { flex: 1; min-width: 0; padding: 9px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; color: #ffffff; font-family: 'Inter', sans-serif; font-size: 14px; }",
".konj-input:focus { outline: none; border-color: var(--xblue); background: rgba(59,130,246,0.08); }",
".konj-input.konj-correct { border-color: var(--xgreen); background: rgba(79,214,156,0.13); color: var(--xgreen); }",
".konj-input.konj-wrong { border-color: var(--xrose); background: rgba(240,112,104,0.13); color: var(--xrose); }",
".konj-correct-answer { flex: 0 0 auto; max-width: 40%; font-family: 'Inter', sans-serif; font-size: 12px; color: var(--xgreen); font-style: italic; text-align: right; }",
".konj-action-btn { display: block; width: 100%; margin-top: 22px; padding: 12px; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); border: none; border-radius: 9px; color: #071022; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".konj-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }",
".konj-result { margin-top: 14px; text-align: center; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 700; }",
"@media (max-width: 480px) { .konj-row { flex-wrap: wrap; } .konj-person { flex: 0 0 100%; } .konj-correct-answer { flex: 0 0 100%; text-align: left; max-width: 100%; } }",

"/* ── premium accordion elements ── */",
".premium-accordion-wrap { display: flex; flex-direction: column; gap: 8px; margin: 24px 0; }",
".accordion-item-box { border: 1px solid rgba(255,255,255,0.06); background: rgba(15,23,42,0.4); border-radius: 10px; overflow: hidden; transition: all 0.2s ease; }",
".accordion-trigger { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; background: transparent; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: #ffffff; text-align: left; cursor: pointer; }",
".accordion-trigger:hover { background: rgba(255,255,255,0.02); }",
".acc-chevron { font-size: 10px; transition: transform 0.2s ease; color: rgba(255,255,255,0.4); }",
".accordion-item-box.active { border-color: rgba(59,130,246,0.3); }",
".accordion-item-box.active .acc-chevron { transform: rotate(180deg); color: var(--xblueb); }",
".accordion-panel-content { max-height: 0; overflow: hidden; transition: max-height 0.2s ease-out; background: rgba(255,255,255,0.01); }",
".accordion-panel-content p { padding: 15px 20px; margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #cbd5e1; line-height: 1.6; }",

"/* ── premium responsive video ── */",
".premium-video-card { border-radius: 14px; overflow: hidden; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); margin: 30px 0; }",
".video-ratio-box { position: relative; width: 100%; padding-top: 56.25%; }",
".video-ratio-box iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }",
".premium-video-caption { padding: 12px; text-align: center; font-size: 12.5px; color: rgba(226,232,240,0.5); background: rgba(255,255,255,0.01); border-top: 1px solid rgba(255,255,255,0.04); }",

"/* ── premium code formatting ── */",
".premium-code-box { background: #080c14; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; margin: 24px 0; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); }",
".code-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.06); }",
".code-lang-tag { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.4); letter-spacing: 0.05em; }",
".code-copy-btn { background: transparent; border: 1px solid rgba(255,255,255,0.15); border-radius: 5px; color: rgba(255,255,255,0.6); font-size: 11.5px; padding: 4px 8px; cursor: pointer; transition: all 0.2s ease; }",
".code-copy-btn:hover { background: rgba(255,255,255,0.05); color: #ffffff; }",
".premium-code-box pre { margin: 0; padding: 16px; overflow-x: auto; }",
".premium-code-box code { font-family: 'Consolas', 'Courier New', monospace; font-size: 13.5px; color: #e2e8f0; line-height: 1.5; }",

"/* ── premium auto-TOC widget ── */",
".premium-toc-card { background: rgba(59,130,246,0.03); border: 1px solid rgba(59,130,246,0.15); border-radius: 12px; padding: 20px 24px; margin: 28px 0; }",
".toc-header-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 15px; color: #ffffff; margin-bottom: 14px; letter-spacing: -0.01em; }",
".toc-links-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }",
".toc-links-list li { margin: 0; padding: 0; }",
".toc-link-a { display: block; font-family: 'Inter', sans-serif; font-size: 13.5px; color: rgba(255,255,255,0.6); text-decoration: none; transition: color 0.15s ease; }",
".toc-link-a:hover { color: var(--xblueb); }",
".toc-link-h3 { padding-left: 18px; position: relative; }",
".toc-link-h3::before { content: '↳'; position: absolute; left: 4px; color: rgba(255,255,255,0.2); }",

"@media (max-width: 480px) { .callout-box { flex-direction: column; } .lb-table th, .lb-table td { padding: 8px 10px; font-size: 13px; } }",

"/* ── PDF indirme butonu (yazdır tabanlı) ── */",
".pdf-download-btn { position: fixed; right: 22px; bottom: 22px; z-index: 9998; display: flex; align-items: center; gap: 9px; padding: 13px 20px; border: none; border-radius: 50px; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); color: #071022; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; box-shadow: 0 10px 30px rgba(59,130,246,0.4), 0 0 0 1px rgba(255,255,255,0.08) inset; transition: all 0.2s ease; }",
".pdf-download-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 38px rgba(59,130,246,0.5), 0 0 0 1px rgba(255,255,255,0.12) inset; }",
".pdf-download-btn svg { flex-shrink: 0; }",
"@media (max-width: 640px) { .pdf-download-btn { right: 14px; bottom: 14px; padding: 12px 16px; font-size: 0; } .pdf-download-btn svg { width: 20px; height: 20px; } }",

"/* ── PDF / Yazdırma çıktısı (window.print tabanlı, harici kütüphane yok) ── */",
"@media print {",
"  .pdf-download-btn, .premium-progress-bar, .lesson-nav-row, .bg-canvas, .lb-lightbox-overlay,",
"  .quiz-action-btn, .fib-action-btn, .matching-action-btn, .matching-retry-btn,",
"  .sentorder-action-btn, .wordorder-actions, .code-copy-btn, .rt-toolbar,",
"  .konj-action-btn, .listen-audio-player,",
"  .premium-audio-btn, .tts-cluster, nav, [data-navbar], .lb-image-trigger { display: none !important; }",
"  html, body { background: #ffffff !important; color: #111827 !important; }",
"  .lesson-wrap { max-width: 100% !important; }",
"  * { box-shadow: none !important; text-shadow: none !important; backdrop-filter: none !important; }",
"  .lesson-heading, .lb-byline, .lesson-meta-row { color: #111827 !important; }",
"  .premium-quiz-card, .premium-fillblank-card, .premium-matching-card, .premium-sentorder-card,",
"  .premium-wordorder-card, .premium-dialogue-card, .premium-audio-card, .premium-accordion-wrap,",
"  .accordion-item-box, .premium-video-card, .premium-code-box, .vocab-card, .callout-box,",
"  .listen-prev, .konj-prev, .lb-paragraph-quote, .lb-paragraph-highlight,",
"  .premium-toc-card, .lb-table { background: #f8fafc !important; border: 1px solid #cbd5e1 !important; page-break-inside: avoid; }",
"  .quiz-question-title, .fib-instruction, .matching-instruction, .sentorder-instruction, .wordorder-instruction,",
"  .dialogue-instruction, .quiz-opt-text, .matching-card-text, .fib-input, .sentorder-text, .wordorder-chip,",
"  .wordorder-placed-chip, .dialogue-bubble-text, .vocab-de, .vocab-tr, .vocab-example, .callout-title,",
"  .listen-question h4, .listen-option span, .listen-caption, .konj-header, .konj-person, .konj-input, .konj-result,",
"  .callout-text, .lb-table th, .lb-table td, .toc-link-a, .accordion-trigger, .code-lang-tag { color: #111827 !important; }",
"  .accordion-panel-content { max-height: none !important; }",
"  .accordion-panel-content p { color: #1f2937 !important; }",
"  .dialogue-step.dialogue-locked { display: block !important; }",
"  .matching-drop-zone, .matching-card { border-color: #94a3b8 !important; }",
"  .premium-code-box code { color: #1f2937 !important; }",
"  img, .premium-image-el { max-width: 100% !important; box-shadow: none !important; }",
"  .premium-video-card { display: none !important; }",
"  a[href]::after { content: '' !important; }",
"  @page { margin: 16mm 14mm; }",
"}",
"</style>",
"</head>",
((meta.theme && meta.theme !== "none") ? '<body class="theme-' + esc(meta.theme) + '">' : "<body>"),
'<div class="premium-progress-bar" id="readingProgressBar"></div>',
'<button type="button" class="pdf-download-btn" onclick="downloadAsPDF()" title="Bu dersi PDF olarak indir">' +
'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
'<span>PDF Olarak İndir</span></button>',
'<div class="bg-canvas"><div class="bg-grid"></div><div class="bg-glow bg-glow--1"></div><div class="bg-glow bg-glow--2"></div></div>',

'<div class="lesson-nav-row">',
'<a href="/dersler/" class="lesson-back"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg> Tüm dersler</a>',
"</div>",

'<main class="lesson-wrap">',
(meta.cover ? '<img src="' + esc(meta.cover) + '" alt="' + canonicalTitle + '" class="lesson-hero-img">' : ""),
'<div class="lesson-meta-row">',
'<span class="lesson-cat-badge" data-cat="' + meta.level + '">' + meta.level + "</span>",
'<span class="lesson-card-dot"></span>',
'<span class="lesson-diff-badge">' + esc(meta.difficulty) + "</span>",
'<span class="lesson-card-dot"></span>',
"<span>" + esc(meta.readTime) + " dk okuma</span>",
"</div>",
'<h1 class="lesson-heading">' + canonicalTitle + "</h1>",
(meta.author ? '<div class="lb-byline">Yazar: <b>' + esc(meta.author) + "</b></div>" : ""),
'<article class="lesson-body">',
blocksHtml,
"</article>",
"</main>",

'<div class="lb-lightbox-overlay" id="lbLightboxOverlay" role="dialog" aria-modal="true" aria-label="Görsel büyütme">',
'<button type="button" class="lb-lightbox-close" onclick="closeLightbox()" aria-label="Kapat (ESC)">×</button>',
'<img class="lb-lightbox-img" id="lbLightboxImg" src="" alt="" draggable="false">',
'<div class="lb-lightbox-hint">Yakınlaştırmak için fare tekerleği veya iki parmakla sıkıştırın · Kapatmak için ESC</div>',
"</div>",

"<!-- Navbar + Radyal FAB (gerçek site altyapısı) -->",
'<scr' + 'ipt type="module">',
'  import "../../js/core.js";',
'  if(window.loadNavbar) window.loadNavbar();',
"</scr" + "ipt>",

"<!-- PREMIUM INTERACTION ENGINE -->",
"<scr" + "ipt>", // <-- Güvenli Script Açılışı
"/* 0. PDF İndirme (window.print tabanlı, kütüphanesiz) */",
"function downloadAsPDF() {",
"  document.title = document.title; // dosya adı için mevcut başlığı korur",
"  window.print();",
"}",
"window.addEventListener('beforeprint', () => {",
"  closeLightbox();",
"  document.querySelectorAll('.accordion-item-box').forEach(box => {",
"    box.classList.add('active');",
"    const panel = box.querySelector('.accordion-panel-content');",
"    if (panel) panel.style.maxHeight = 'none';",
"  });",
"  document.querySelectorAll('.dialogue-step').forEach(step => step.classList.remove('dialogue-locked'));",
"});",

"/* 1. Progress Bar Logic */",
"window.addEventListener('scroll', () => {",
"  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;",
"  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;",
"  const scrolled = (winScroll / height) * 100;",
"  document.getElementById('readingProgressBar').style.width = scrolled + '%';",
"});",

"/* 2. Audio Playback (Speech Synthesis) Engine — hızlı/yavaş sesli okuma */",
"var __ttsActiveBtn = null;",
"function playSpeechText(btn, text, lang, rate) {",
"  if (!('speechSynthesis' in window)) { alert('Tarayıcınız sesli okumayı desteklemiyor.'); return; }",
"  window.speechSynthesis.cancel();",
"  if (__ttsActiveBtn) __ttsActiveBtn.classList.remove('tts-playing');",
"  const utterance = new SpeechSynthesisUtterance(text);",
"  utterance.lang = lang || 'de-DE';",
"  utterance.rate = rate || 0.95;",
"  btn.classList.add('tts-playing');",
"  __ttsActiveBtn = btn;",
"  const resetBtn = () => { btn.classList.remove('tts-playing'); if (__ttsActiveBtn === btn) __ttsActiveBtn = null; };",
"  utterance.onend = resetBtn;",
"  utterance.onerror = resetBtn;",
"  window.speechSynthesis.speak(utterance);",
"}",

"/* 3. Dynamic Accordion Toggler */",
"function toggleAccordion(btn) {",
"  const item = btn.parentElement;",
"  const panel = item.querySelector('.accordion-panel-content');",
"  const isOpening = !item.classList.contains('active');",
"  ",
"  document.querySelectorAll('.accordion-item-box').forEach(box => {",
"    box.classList.remove('active');",
"    box.querySelector('.accordion-panel-content').style.maxHeight = null;",
"  });",
"  ",
"  if (isOpening) {",
"    item.classList.add('active');",
"    panel.style.maxHeight = panel.scrollHeight + 'px';",
"  } else {",
"    item.classList.remove('active');",
"    panel.style.maxHeight = null;",
"  }",
"}",

"/* 4. Code Block Clipboard Copier */",
"function copyCodePayload(btn) {",
"  const box = btn.closest('.premium-code-box');",
"  const codeText = box.querySelector('code').innerText;",
"  navigator.clipboard.writeText(codeText).then(() => {",
"    const oldText = btn.innerText;",
"    btn.innerText = 'Kopyalandı!';",
"    btn.style.color = '#4fd69c';",
"    setTimeout(() => { btn.innerText = oldText; btn.style.color = ''; }, 2000);",
"  });",
"}",

"/* 5. Premium Quiz Engine */",
"document.addEventListener('DOMContentLoaded', () => {",
"  document.querySelectorAll('.premium-quiz-card').forEach(card => {",
"    card.querySelectorAll('.quiz-option-item').forEach(opt => {",
"      opt.addEventListener('click', () => {",
"        if (card.dataset.evaluated === 'true') return;",
"        card.querySelectorAll('.quiz-option-item').forEach(o => o.classList.remove('selected'));",
"        opt.classList.add('selected');",
"      });",
"    });",
"  });",
"});",
"function checkQuizAnswer(qId) {",
"  const card = document.getElementById(qId);",
"  if (!card || card.dataset.evaluated === 'true') return;",
"  const selectedOpt = card.querySelector('.quiz-option-item.selected');",
"  if (!selectedOpt) { alert('Lütfen bir seçenek işaretleyin.'); return; }",
"  ",
"  const correctIndex = parseInt(card.dataset.correct);",
"  const selectedIndex = parseInt(selectedOpt.dataset.index);",
"  card.dataset.evaluated = 'true';",
"  ",
"  if (selectedIndex === correctIndex) {",
"    selectedOpt.classList.add('correct-reveal');",
"  } else {",
"    selectedOpt.classList.add('wrong-reveal');",
"    card.querySelector('[data-index=\"' + correctIndex + '\"]').classList.add('correct-reveal');",
"  }",
"  ",
"  const explain = card.querySelector('.quiz-explain-panel');",
"  if (explain) {",
"    explain.style.maxHeight = explain.scrollHeight + 32 + 'px';",
"  }",
"  card.querySelector('.quiz-action-btn').style.display = 'none';",
"}",

"/* 5b. Dinleme Anlama (Hörverstehen) Engine */",
"function checkListenAnswer(input, correctIndex) {",
"  const qBlock = input.closest('.listen-question');",
"  if (!qBlock || qBlock.dataset.answered === 'true') return;",
"  qBlock.dataset.answered = 'true';",
"  const chosenIndex = parseInt(input.value, 10);",
"  const options = qBlock.querySelectorAll('.listen-option');",
"  options.forEach((opt, idx) => {",
"    const radio = opt.querySelector('input[type=radio]');",
"    if (radio) radio.disabled = true;",
"    if (idx === correctIndex) opt.classList.add('listen-correct');",
"    else if (idx === chosenIndex) opt.classList.add('listen-wrong');",
"  });",
"  const feedback = qBlock.querySelector('.listen-feedback');",
"  if (feedback) {",
"    if (chosenIndex === correctIndex) {",
"      feedback.textContent = 'Doğru! ✓';",
"      feedback.classList.add('is-correct');",
"    } else {",
"      feedback.textContent = 'Yanlış ✗';",
"      feedback.classList.add('is-wrong');",
"    }",
"  }",
"}",

"/* 5c. Fiil Çekim Alıştırması (Konjugation) Engine */",
"function checkKonjugation(kjId) {",
"  const card = document.getElementById(kjId);",
"  if (!card || card.dataset.evaluated === 'true') return;",
"  const inputs = card.querySelectorAll('.konj-input');",
"  let correctCount = 0;",
"  inputs.forEach(inp => {",
"    const correctAnswer = (inp.dataset.answer || '').trim().toLowerCase();",
"    const userAnswer = inp.value.trim().toLowerCase();",
"    const answerLabel = inp.closest('.konj-row').querySelector('.konj-correct-answer');",
"    inp.classList.remove('konj-correct', 'konj-wrong');",
"    if (correctAnswer !== '' && userAnswer === correctAnswer) {",
"      inp.classList.add('konj-correct');",
"      correctCount++;",
"      if (answerLabel) answerLabel.textContent = '';",
"    } else {",
"      inp.classList.add('konj-wrong');",
"      if (answerLabel) answerLabel.textContent = 'Doğrusu: ' + inp.dataset.answer;",
"    }",
"    inp.disabled = true;",
"  });",
"  card.dataset.evaluated = 'true';",
"  const resultEl = card.querySelector('.konj-result');",
"  if (resultEl) {",
"    resultEl.textContent = correctCount + ' / ' + inputs.length + ' doğru';",
"    resultEl.style.color = correctCount === inputs.length ? '#4fd69c' : (correctCount === 0 ? '#f07068' : '#ffd250');",
"  }",
"  const actionBtn = card.querySelector('.konj-action-btn');",
"  if (actionBtn) actionBtn.style.display = 'none';",
"}",

"/* 6. Boşluk Doldurma (Fill-in-the-blank) Engine */",
"function checkFillBlank(fbId) {",
"  const card = document.getElementById(fbId);",
"  if (!card) return;",
"  const inputs = card.querySelectorAll('.fib-input');",
"  let correct = 0;",
"  inputs.forEach(inp => {",
"    const answer = (inp.dataset.answer || '').trim().toLowerCase();",
"    const val = inp.value.trim().toLowerCase();",
"    inp.classList.remove('fib-correct', 'fib-wrong');",
"    if (val === answer) { inp.classList.add('fib-correct'); correct++; }",
"    else { inp.classList.add('fib-wrong'); }",
"    inp.disabled = true;",
"  });",
"  const msg = card.querySelector('.fib-result-msg');",
"  if (msg) {",
"    msg.textContent = correct + ' / ' + inputs.length + ' doğru';",
"    msg.style.color = correct === inputs.length ? '#4fd69c' : '#f07068';",
"  }",
"  card.querySelector('.fib-action-btn').style.display = 'none';",
"}",

"/* 7. Eşleştirme (Matching) Engine — gerçek sürükle-bırak + klavye desteği */",
"document.addEventListener('DOMContentLoaded', () => { initMatchingBlocks(); });",
"function initMatchingBlocks() {",
"  document.querySelectorAll('.premium-matching-card').forEach(card => {",
"    card.dataset.evaluated = 'false';",
"    card.querySelectorAll('.matching-card').forEach(wireMatchingCard);",
"    card.querySelectorAll('.matching-drop-zone').forEach(wireMatchingZone);",
"  });",
"}",
"function wireMatchingCard(c) {",
"  c.addEventListener('dragstart', (e) => {",
"    if (c.closest('.premium-matching-card').dataset.evaluated === 'true') { e.preventDefault(); return; }",
"    e.dataTransfer.setData('text/plain', c.dataset.pairIdx);",
"    e.dataTransfer.effectAllowed = 'move';",
"    c.classList.add('dragging-card');",
"  });",
"  c.addEventListener('dragend', () => c.classList.remove('dragging-card'));",
"  c.addEventListener('click', () => {",
"    const parent = c.closest('.premium-matching-card');",
"    if (parent.dataset.evaluated === 'true') return;",
"    if (c.classList.contains('placed-card')) { unplaceMatchingCard(c); return; }",
"    parent.querySelectorAll('.matching-card.kbd-selected').forEach(x => x.classList.remove('kbd-selected'));",
"    c.classList.toggle('kbd-selected');",
"  });",
"  c.addEventListener('keydown', (e) => {",
"    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); }",
"  });",
"}",
"function wireMatchingZone(z) {",
"  z.addEventListener('dragenter', (e) => { e.preventDefault(); z.classList.add('drop-hover'); });",
"  z.addEventListener('dragover', (e) => { e.preventDefault(); });",
"  z.addEventListener('dragleave', () => z.classList.remove('drop-hover'));",
"  z.addEventListener('drop', (e) => {",
"    e.preventDefault();",
"    z.classList.remove('drop-hover');",
"    const parent = z.closest('.premium-matching-card');",
"    if (parent.dataset.evaluated === 'true') return;",
"    const idx = e.dataTransfer.getData('text/plain');",
"    const cardEl = parent.querySelector('.matching-card[data-pair-idx=\"' + idx + '\"]');",
"    if (cardEl) placeMatchingCard(cardEl, z);",
"  });",
"  z.addEventListener('click', () => {",
"    const parent = z.closest('.premium-matching-card');",
"    if (parent.dataset.evaluated === 'true') return;",
"    const selected = parent.querySelector('.matching-card.kbd-selected');",
"    if (selected) { placeMatchingCard(selected, z); selected.classList.remove('kbd-selected'); }",
"  });",
"  z.addEventListener('keydown', (e) => {",
"    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); z.click(); }",
"  });",
"}",
"function placeMatchingCard(cardEl, zone) {",
"  const slot = zone.querySelector('[data-slot]');",
"  const pool = zone.closest('.premium-matching-card').querySelector('.matching-col-right');",
"  const existing = slot.querySelector('.matching-card');",
"  if (existing) { existing.classList.remove('placed-card'); existing.draggable = true; pool.appendChild(existing); }",
"  cardEl.classList.add('placed-card');",
"  cardEl.classList.remove('kbd-selected');",
"  cardEl.draggable = false;",
"  slot.appendChild(cardEl);",
"  zone.dataset.placed = cardEl.dataset.pairIdx;",
"}",
"function unplaceMatchingCard(cardEl) {",
"  const zone = cardEl.closest('.matching-drop-zone');",
"  if (zone) zone.dataset.placed = '';",
"  cardEl.classList.remove('placed-card');",
"  cardEl.draggable = true;",
"  const pool = cardEl.closest('.premium-matching-card').querySelector('.matching-col-right');",
"  pool.appendChild(cardEl);",
"}",
"function checkMatching(mId) {",
"  const card = document.getElementById(mId);",
"  if (!card) return;",
"  const zones = card.querySelectorAll('.matching-drop-zone');",
"  let correctCount = 0;",
"  let anyWrong = false;",
"  zones.forEach(zone => {",
"    zone.classList.remove('matching-correct', 'matching-wrong');",
"    const target = zone.dataset.targetIdx;",
"    const placed = zone.dataset.placed;",
"    if (placed !== undefined && placed !== '' && placed === target) {",
"      zone.classList.add('matching-correct'); correctCount++;",
"    } else {",
"      zone.classList.add('matching-wrong'); anyWrong = true;",
"    }",
"  });",
"  card.dataset.evaluated = 'true';",
"  card.querySelectorAll('.matching-card').forEach(c => { c.draggable = false; });",
"  const msg = card.querySelector('.matching-result-msg');",
"  if (msg) {",
"    msg.textContent = correctCount + ' / ' + zones.length + ' doğru eşleşme';",
"    msg.style.color = correctCount === zones.length ? '#4fd69c' : '#f07068';",
"  }",
"  card.querySelector('.matching-action-btn').style.display = 'none';",
"  const retryBtn = card.querySelector('.matching-retry-btn');",
"  if (anyWrong && retryBtn) retryBtn.style.display = '';",
"}",
"function retryMatching(mId) {",
"  const card = document.getElementById(mId);",
"  if (!card) return;",
"  const wrongZones = card.querySelectorAll('.matching-drop-zone.matching-wrong');",
"  wrongZones.forEach(zone => {",
"    const slot = zone.querySelector('[data-slot]');",
"    const placedCard = slot.querySelector('.matching-card');",
"    zone.classList.remove('matching-wrong');",
"    zone.dataset.placed = '';",
"    if (placedCard) {",
"      placedCard.classList.remove('placed-card');",
"      placedCard.draggable = true;",
"      card.querySelector('.matching-col-right').appendChild(placedCard);",
"    }",
"  });",
"  card.dataset.evaluated = 'false';",
"  card.querySelectorAll('.matching-col-right .matching-card').forEach(c => { c.draggable = true; });",
"  card.querySelector('.matching-retry-btn').style.display = 'none';",
"  card.querySelector('.matching-action-btn').style.display = '';",
"  const msg = card.querySelector('.matching-result-msg');",
"  if (msg) msg.textContent = '';",
"}",

"/* 7b. Lightbox (görsel büyütme) Engine — zoom (wheel + pinch) + ESC */",
"let lbScale = 1;",
"function openLightbox(imgId) {",
"  const srcImg = document.getElementById(imgId);",
"  const overlay = document.getElementById('lbLightboxOverlay');",
"  const lbImg = document.getElementById('lbLightboxImg');",
"  if (!srcImg || !overlay || !lbImg) return;",
"  lbImg.src = srcImg.src;",
"  lbImg.alt = srcImg.alt || '';",
"  lbScale = 1;",
"  lbImg.style.transform = 'scale(1)';",
"  overlay.classList.add('open');",
"  document.body.style.overflow = 'hidden';",
"}",
"function closeLightbox() {",
"  const overlay = document.getElementById('lbLightboxOverlay');",
"  if (!overlay) return;",
"  overlay.classList.remove('open');",
"  document.body.style.overflow = '';",
"}",
"document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });",
"document.addEventListener('DOMContentLoaded', () => {",
"  const overlay = document.getElementById('lbLightboxOverlay');",
"  if (!overlay) return;",
"  const lbImg = document.getElementById('lbLightboxImg');",
"  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });",
"  overlay.addEventListener('wheel', (e) => {",
"    e.preventDefault();",
"    lbScale += (e.deltaY < 0 ? 0.15 : -0.15);",
"    lbScale = Math.min(Math.max(lbScale, 1), 4);",
"    lbImg.style.transform = 'scale(' + lbScale + ')';",
"  }, { passive: false });",
"  let lastPinchDist = null;",
"  overlay.addEventListener('touchmove', (e) => {",
"    if (e.touches.length === 2) {",
"      e.preventDefault();",
"      const dx = e.touches[0].clientX - e.touches[1].clientX;",
"      const dy = e.touches[0].clientY - e.touches[1].clientY;",
"      const dist = Math.hypot(dx, dy);",
"      if (lastPinchDist) {",
"        lbScale += (dist - lastPinchDist) * 0.01;",
"        lbScale = Math.min(Math.max(lbScale, 1), 4);",
"        lbImg.style.transform = 'scale(' + lbScale + ')';",
"      }",
"      lastPinchDist = dist;",
"    }",
"  }, { passive: false });",
"  overlay.addEventListener('touchend', () => { lastPinchDist = null; });",
"});",

"/* 8. Cümle Sıralama (Sentence Ordering) Engine */",
"function moveSentOrderItem(btn, dir) {",
"  const item = btn.closest('.sentorder-item');",
"  const list = item.parentElement;",
"  if (dir === -1 && item.previousElementSibling) {",
"    list.insertBefore(item, item.previousElementSibling);",
"  } else if (dir === 1 && item.nextElementSibling) {",
"    list.insertBefore(item.nextElementSibling, item);",
"  }",
"}",
"function checkSentOrder(soId) {",
"  const card = document.getElementById(soId);",
"  if (!card) return;",
"  const items = Array.from(card.querySelectorAll('.sentorder-item'));",
"  let correctCount = 0;",
"  items.forEach((item, i) => {",
"    item.classList.remove('sentorder-correct', 'sentorder-wrong');",
"    if (parseInt(item.dataset.orig) === i) { item.classList.add('sentorder-correct'); correctCount++; }",
"    else { item.classList.add('sentorder-wrong'); }",
"    item.querySelectorAll('button').forEach(b => b.disabled = true);",
"  });",
"  const msg = card.querySelector('.sentorder-result-msg');",
"  if (msg) {",
"    msg.textContent = correctCount + ' / ' + items.length + ' doğru sırada';",
"    msg.style.color = correctCount === items.length ? '#4fd69c' : '#f07068';",
"  }",
"  card.querySelector('.sentorder-action-btn').style.display = 'none';",
"}",

"/* 8b. Kelime Sıralama (Duolingo-style Word Order) Engine */",
"function selectWordOrderChip(chip) {",
"  if (chip.disabled) return;",
"  const card = chip.closest('.premium-wordorder-card');",
"  const line = card.querySelector('.wordorder-answer-line');",
"  chip.disabled = true;",
"  const placed = document.createElement('button');",
"  placed.type = 'button';",
"  placed.className = 'wordorder-placed-chip';",
"  placed.textContent = chip.dataset.word;",
"  placed.dataset.orig = chip.dataset.orig;",
"  placed.dataset.chipid = chip.id;",
"  placed.setAttribute('onclick', 'unplaceWordOrderChip(this)');",
"  line.appendChild(placed);",
"}",
"function unplaceWordOrderChip(el) {",
"  const card = el.closest('.premium-wordorder-card');",
"  if (el.classList.contains('wordorder-correct')) return;",
"  const original = card.querySelector('#' + el.dataset.chipid);",
"  if (original) { original.disabled = false; }",
"  el.remove();",
"  const msg = card.querySelector('.wordorder-result-msg');",
"  if (msg) msg.textContent = '';",
"}",
"function checkWordOrder(woId) {",
"  const card = document.getElementById(woId);",
"  if (!card) return;",
"  const line = card.querySelector('.wordorder-answer-line');",
"  const placed = Array.from(line.querySelectorAll('.wordorder-placed-chip'));",
"  const total = parseInt(card.dataset.total, 10);",
"  const msg = card.querySelector('.wordorder-result-msg');",
"  if (placed.length < total) {",
"    if (msg) { msg.textContent = 'Önce tüm kelimeleri sıraya yerleştirin.'; msg.style.color = '#ffd250'; }",
"    return;",
"  }",
"  let correct = true;",
"  placed.forEach((chip, i) => { if (parseInt(chip.dataset.orig, 10) !== i) correct = false; });",
"  placed.forEach(chip => {",
"    chip.classList.remove('wordorder-correct', 'wordorder-wrong');",
"    chip.classList.add(correct ? 'wordorder-correct' : 'wordorder-wrong');",
"  });",
"  if (msg) {",
"    msg.textContent = correct ? 'Doğru! 🎉' : 'Yanlış sıra, kelimeleri çıkarıp tekrar deneyebilirsiniz.';",
"    msg.style.color = correct ? '#4fd69c' : '#f07068';",
"  }",
"  const actionBtn = card.querySelector('.wordorder-action-btn');",
"  if (correct && actionBtn) actionBtn.style.display = 'none';",
"}",
"function resetWordOrder(woId) {",
"  const card = document.getElementById(woId);",
"  if (!card) return;",
"  const line = card.querySelector('.wordorder-answer-line');",
"  Array.from(line.querySelectorAll('.wordorder-placed-chip')).forEach(chip => {",
"    const original = card.querySelector('#' + chip.dataset.chipid);",
"    if (original) { original.disabled = false; }",
"  });",
"  line.innerHTML = '';",
"  const msg = card.querySelector('.wordorder-result-msg');",
"  if (msg) msg.textContent = '';",
"  const actionBtn = card.querySelector('.wordorder-action-btn');",
"  if (actionBtn) actionBtn.style.display = '';",
"}",

"/* 8c. Diyalog / Sohbet Balonu (Chat Dialogue) Engine */",
"function unlockDialogueCard(card) {",
"  const steps = Array.from(card.querySelectorAll('.dialogue-step'));",
"  let locking = false;",
"  steps.forEach(step => {",
"    if (locking) { step.classList.add('dialogue-locked'); return; }",
"    step.classList.remove('dialogue-locked');",
"    if (step.classList.contains('dialogue-choice-step') && !step.classList.contains('dialogue-resolved')) {",
"      locking = true;",
"    }",
"  });",
"}",
"function checkDialogueChoice(btn) {",
"  const step = btn.closest('.dialogue-choice-step');",
"  const card = btn.closest('.premium-dialogue-card');",
"  if (!step || !card || step.classList.contains('dialogue-resolved')) return;",
"  if (btn.dataset.correct === 'true') {",
"    step.classList.add('dialogue-resolved');",
"    const wrap = step.querySelector('.dialogue-options-wrap');",
"    if (wrap && step.dataset.bubbleHtml) { wrap.outerHTML = step.dataset.bubbleHtml; }",
"    unlockDialogueCard(card);",
"  } else {",
"    btn.classList.add('dialogue-opt-wrong');",
"    setTimeout(() => btn.classList.remove('dialogue-opt-wrong'), 450);",
"  }",
"}",
"document.addEventListener('DOMContentLoaded', () => {",
"  document.querySelectorAll('.premium-dialogue-card').forEach(unlockDialogueCard);",
"});",

"/* 9. Dynamic Auto-TOC (Table of Contents) Generator */",
"document.addEventListener('DOMContentLoaded', () => {",
"  const tocList = document.getElementById('auto-toc-list');",
"  if (!tocList) return;",
"  const headings = Array.from(document.querySelectorAll('article.lesson-body h2, article.lesson-body h3'));",
"  ",
"  if (headings.length === 0) {",
"    const container = document.getElementById('auto-toc-container');",
"    if (container) container.style.display = 'none';",
"    return;",
"  }",
"  ",
"  tocList.innerHTML = '';",
"  headings.forEach(h => {",
"    const li = document.createElement('li');",
"    const a = document.createElement('a');",
"    a.href = '#' + h.id;",
"    a.innerText = h.innerText;",
"    a.className = 'toc-link-a';",
"    if (h.tagName.toLowerCase() === 'h3') {",
"      a.classList.add('toc-link-h3');",
"    }",
"    li.appendChild(a);",
"    tocList.appendChild(li);",
"  });",
"});",
"</" + "script>", // <-- Güvenli Script Kapanışı

"</body>",
"</html>"
    ].join("\n");
  }
  /* ══════════════════════════════════════
     YENİ: Zengin Metin (Rich Text Toolbar) Logic
     ══════════════════════════════════════ */
  const rtToolbar = document.createElement("div");
  rtToolbar.className = "rt-toolbar";
  rtToolbar.innerHTML = `
    <button data-cmd="bold" title="Kalın">` + ICO.bold + `</button>
    <button data-cmd="italic" title="İtalik">` + ICO.italic + `</button>
    <button data-cmd="underline" title="Altı Çizili">` + ICO.underline + `</button>
    <button data-cmd="createLink" title="Bağlantı">` + ICO.link + `</button>
    <button data-cmd="hiliteColor" title="Vurgula">` + ICO.highlight + `</button>
  `;
  document.body.appendChild(rtToolbar);

  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      rtToolbar.classList.remove("show");
      return;
    }
    const node = sel.anchorNode ? sel.anchorNode.parentElement : null;
    if (node && node.closest("[contenteditable='true']")) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      rtToolbar.style.top = (rect.top + window.scrollY - 42) + "px";
      rtToolbar.style.left = (rect.left + window.scrollX + (rect.width / 2) - 65) + "px";
      rtToolbar.classList.add("show");
    } else {
      rtToolbar.classList.remove("show");
    }
  });

  rtToolbar.addEventListener("mousedown", (e) => {
    e.preventDefault(); // Focus kaybını önler
    const btn = e.target.closest("button");
    if (!btn) return;
    const cmd = btn.dataset.cmd;
    if (cmd === "createLink") {
      const url = prompt("Bağlantı adresi (URL) girin:");
      if (url) document.execCommand(cmd, false, url);
    } else if (cmd === "hiliteColor") {
      // Sarı neon arka plan vurgusu
      document.execCommand(cmd, false, "#ffd250");
    } else {
      document.execCommand(cmd, false, null);
    }
  });

  /* ══════════════════════════════════════
     YENİ: JSON Proje Kaydetme & Yükleme
     ══════════════════════════════════════ */
  $("#btnSaveProject").addEventListener("click", () => {
    if (!blocks.length) { toast("Kaydedilecek blok bulunamadı.", "err"); return; }
    const projectData = JSON.stringify({ seq, blocks }, null, 2);
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

  /* ══════════════════════════════════════
     Hazır Şablonlar Sistemi
     ══════════════════════════════════════ */
  function loadIntoCanvas(newBlocks, newSeq) {
    blocks = newBlocks;
    seq = newSeq || blocks.reduce((m, b) => {
      const n = parseInt(String(b.id).replace(/^b/, ""), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, blocks.length);
    renderAll();
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
        loadIntoCanvas(JSON.parse(JSON.stringify(tpl.blocks)), tpl.seq);
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
      blockCount: blocks.length,
      savedAtLabel: new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })
    });
    setCustomTemplates(list);
    renderCustomTemplates();
    toast('"' + trimmed + '" şablon olarak kaydedildi ✓');
  });

  renderCustomTemplates();
  renderAll();
})();