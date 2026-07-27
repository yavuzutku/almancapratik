"use strict";
/* ═══════════════════════════════════════════════════════════
   JS — GEMİNİ AI ASİSTANI (ActionPatch mimarisi)
   Bu dosya, 01-04 script'lerinin tanımladığı global değişken/fonksiyonlara
   (blocks, renderAll, defaultsFor, TYPE_LABEL, FONT_OPTIONS, toast,
   applyTheme, themeSelect, themeColorInput, nextId, esc, projectTabs,
   genTabKey, applyAutoTextColorsForPageBg vb.) VE canvas-action-runner.js
   dosyasının yayınladığı `window.CanvasActionRunner` motoruna ihtiyaç duyar
   — bu yüzden index.html'de 04'ten SONRA, canvas-action-runner.js'ten
   HEMEN SONRA yüklenmelidir.

   Amaç: Kullanıcının girdiği Gemini API anahtarıyla, doğal dilde verilen
   bir talimata göre sayfadaki blokları (stil, içerik, ekleme/silme/
   sıralama) ve genel sayfa temasını güncellemektir — ama artık sayfanın
   TAMAMINI yeniden yazdırarak değil:

     1) UUID/kararlı-id bazlı hedefleme: Gemini komutlarında hedef HER ZAMAN
        bir bloğun değişmez `id`'sidir; dizi indeksi asla hedef olarak
        kullanılmaz (bkz. canvas-action-runner.js → ActionPatch.targetId).
     2) Dinamik bağlam: stil/tema/sıralama istekleri için sadece hafif bir
        { id, type, currentStyle } özeti gönderilir; içerik/metin
        düzenlemeleri için tam blok içeriği gönderilir (bkz.
        classifyContextMode / buildBlockContext).
     3) Atomik patch + rollback: Gemini bir `ActionPatch[]` listesi döner;
        bu liste CanvasActionRunner.validateAndApplyPatch() ile İKİ FAZLI
        olarak (önce tamamen doğrula, sonra snapshot alıp uygula; herhangi
        bir adım patlarsa rollback) işlenir — kanvas asla yarım kalmaz.
     4) Genişletilebilirlik: UPDATE_STYLE, UPDATE_CONTENT, REORDER_BLOCKS,
        ADD_BLOCK, REMOVE_BLOCK, APPLY_THEME + şema dışı/karmaşık istekler
        için esnek bir REPLACE_BLOCK_TREE fallback'i.

   Bu dosyanın kendisi bir IIFE içine sarılmıştır; yerel değişkenleri
   (overlay, el, data, url... gibi) diğer dosyalardaki aynı isimli
   değişkenlerle ÇAKIŞMAZ, ama paylaşılan global scope'a (blocks,
   renderAll, TYPE_LABEL, CanvasActionRunner, ...) closure zinciri
   üzerinden erişir.
   ═══════════════════════════════════════════════════════════ */

(function () {

  var LS_KEY_API = "ldbGeminiApiKey";
  var LS_KEY_MODEL = "ldbGeminiModel";

  /* index.html'deki #metaTheme select'inin option value'larıyla birebir aynı olmalı */
  var THEME_NAMES = [
    "none", "custom", "ocean", "sunset", "aurora", "forest", "midnight",
    "cyberpunk", "lavender", "desert", "volcano", "emerald", "sapphire",
    "rose", "coffee", "neon", "galaxy", "arctic", "tropical", "royal",
    "obsidian", "peach", "mint", "titanium", "ruby", "amethyst", "coral",
    "berlin", "iletisim", "buzlucam", "likitmetal", "prizma"
  ];

  function el(id) { return document.getElementById(id); }

  var openBtn      = el("btnGeminiAI");
  var overlay      = el("geminiModalOverlay");
  var closeBtn     = el("closeGeminiModal");
  var cancelBtn    = el("cancelGemini");
  var sendBtn      = el("sendGemini");
  var apiKeyInput  = el("geminiApiKey");
  var modelSelect  = el("geminiModel");
  var promptInput  = el("geminiPrompt");
  var logBox       = el("geminiLog");

  if (!openBtn || !overlay) return; // HTML yoksa sessizce çık

  /* ---------- Ayarları hatırla (API anahtarı / model) ---------- */
  try {
    var savedKey = localStorage.getItem(LS_KEY_API);
    if (savedKey) apiKeyInput.value = savedKey;
    var savedModel = localStorage.getItem(LS_KEY_MODEL);
    if (savedModel) modelSelect.value = savedModel;
  } catch (e) { /* localStorage kapalıysa sessizce yok say */ }

  function persistSettings() {
    try {
      localStorage.setItem(LS_KEY_API, apiKeyInput.value.trim());
      localStorage.setItem(LS_KEY_MODEL, modelSelect.value);
    } catch (e) {}
  }
  apiKeyInput.addEventListener("change", persistSettings);
  modelSelect.addEventListener("change", persistSettings);

  /* ---------- Modal aç/kapa ---------- */
  openBtn.addEventListener("click", function () {
    overlay.classList.add("open");
    setTimeout(function () { promptInput.focus(); }, 50);
  });
  function closeModal() { overlay.classList.remove("open"); }
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });
  promptInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendBtn.click(); }
  });

  function showLog(html, cls) {
    logBox.style.display = "block";
    logBox.className = "gemini-log" + (cls ? " " + cls : "");
    logBox.innerHTML = html;
  }

  /* ---------- Blok şeması metnini üret (defaultsFor üzerinden otomatik) ---------- */
  function typeFieldsDoc(type) {
    var d = defaultsFor(type);
    var skip = { padY: 1, padX: 1, marginY: 1, bgColor: 1, bgOpacity: 1, audioSlots: 1 };
    return Object.keys(d).filter(function (k) { return !skip[k]; })
      .map(function (k) { return k + "=" + JSON.stringify(d[k]); })
      .join(", ");
  }

  /* ═══════════════════════════════════════════════════════════
     DİNAMİK BAĞLAM YÖNETİMİ (Context Loss / Token İsrafı Önleme)
     ───────────────────────────────────────────────────────────
     Her istekte sayfanın TAMAMINI (tüm blokların TÜM alanlarıyla) Gemini'ye
     göndermek hem gereksiz token harcar hem de modelin dokunmaması gereken
     bir alanı yanlışlıkla değiştirme riskini artırır. Bunun yerine isteği
     basit bir niyet sınıflandırmasından geçiriyoruz:
       - "LIGHT"  → sadece stil/tema/sıralama isteği: her blok için YALNIZCA
                    { id, type, tab, currentStyle:{...} } gönderilir; metin/
                    içerik alanları (text, html, question, rows...) HİÇ
                    gönderilmez.
       - "FULL"   → içerik/metin/blok ekleme-silme isteği ya da niyet
                    belirsiz: güvenli taraf seçilir, bloğun TAMAMI (içerik
                    dahil) gönderilir.
     Sınıflandırma yanlış çıksa bile hiçbir veri kaybı OLMAZ: "FULL" her
     zaman güvenli varsayılandır; "LIGHT" sadece gerçek bir stil sinyali
     yakalandığında VE içerik sinyali yokken seçilir. ═══════════════════════════════════════════════════════════ */

  var CONTENT_INTENT_RX = /yaz|ekle|sil|kaldır|düzelt|çevir|kelime|cümle|paragraf|\bmetin\b|soru|quiz|örnek|açıklama|içerik|başlığ[ıi] değiştir|çeviri/i;
  var STYLE_INTENT_RX = /renk|arka ?plan|boşluk|hizala|kalınlık|yazı ?tipi|\bfont\b|boyut|büyü|küçül|padding|margin|gölge|\btema\b|kontrast|premium|şeffaf|opak|opaklık/i;
  var REORDER_INTENT_RX = /sırala|taşı|yukarı al|aşağı al|başa al|sona al|yer değiştir/i;

  /**
   * Kullanıcı isteğinin niyetini kabaca sınıflandırır.
   * @param {string} userPrompt
   * @returns {"LIGHT"|"FULL"} Bağlam modu.
   */
  function classifyContextMode(userPrompt) {
    var t = String(userPrompt || "");
    if (CONTENT_INTENT_RX.test(t)) return "FULL"; // içerikle ilgili herhangi bir sinyal varsa güvenli tarafta kal
    if (STYLE_INTENT_RX.test(t) || REORDER_INTENT_RX.test(t)) return "LIGHT";
    return "FULL";
  }

  /** LIGHT modda bir bloktan gönderilecek "sadece görsel/stil" özet alanları. */
  var STYLE_SUMMARY_KEYS = ["padY", "padX", "marginY", "bgColor", "bgOpacity", "font", "weight", "size", "align", "color", "theme", "level", "objectFit"];

  /**
   * Seçilen bağlam moduna göre AI'ye gönderilecek blok listesini üretir.
   * LIGHT modda içerik alanları (text/html/question/rows/...) hiç dahil
   * edilmez — sadece id/type/tab + görsel stil özeti gider.
   * @param {"LIGHT"|"FULL"} mode
   * @returns {Array<Object>}
   */
  function buildBlockContext(mode) {
    if (mode !== "LIGHT") return blocks; // FULL: tam içerik
    return blocks.map(function (b) {
      var style = {};
      STYLE_SUMMARY_KEYS.forEach(function (k) {
        if (b[k] !== undefined) style[k] = b[k];
      });
      return { id: b.id, type: b.type, tab: b.tab, currentStyle: style };
    });
  }

  /**
   * Gemini'ye gönderilecek tam talimat/şema metnini üretir. Yeni mimaride
   * Gemini artık sayfanın tamamını değil, kararlı `id`'lere hedefli bir
   * "ActionPatch[]" komut listesi döndürür (bkz. canvas-action-runner.js).
   * @param {"LIGHT"|"FULL"} contextMode
   */
  function buildSchemaText(contextMode) {
    var typeLines = Object.keys(TYPE_LABEL).map(function (t) {
      return "- " + t + " (" + TYPE_LABEL[t] + "): { " + typeFieldsDoc(t) + " }";
    }).join("\n");
    var fontKeys = (typeof FONT_OPTIONS !== "undefined")
      ? FONT_OPTIONS.map(function (f) { return f[0]; }).join(", ")
      : "body, display, serif, merriweather, playfair, poppins, montserrat, nunito";
    var tabList = (typeof projectTabs !== "undefined" && projectTabs.length)
      ? projectTabs.map(function (t) { return t.key + " (\"" + t.label + "\")"; }).join(", ")
      : "content (\"Ders İçeriği\")";

    return [
      "Sen, Türkçe bir ders (statik HTML sayfa) oluşturma aracı için tam yetkili bir tasarım/içerik asistanısın.",
      "Kullanıcı sana sayfanın TAMAMI üzerinde -- her bloğun yazı tipi, rengi, arka planı, boyutu, hizalaması, boşlukları, içeriği, sırası dahil -- tam yetki veriyor.",
      "",
      "ÇOK ÖNEMLİ — YENİ KOMUT FORMATI: Artık sayfanın tamamını yeniden yazmıyorsun. Bunun yerine, SADECE değişecek olan şeyi, hedefi HER ZAMAN kararlı bir 'id' ile göstererek bir 'ActionPatch' komut LİSTESİ olarak döndürüyorsun. İndeks/sıra numarası ASLA hedef olarak kullanılmaz — sadece 'MEVCUT DURUM' içinde gördüğün gerçek 'id' değerleri kullanılır.",
      "",
      "KURALLAR:",
      "1) SADECE geçerli JSON döndür. Açıklama, markdown, ```json işareti YOK. Cevabın tamamı tek bir JSON nesnesi olmalı:",
      '   { "patch": [ {...aksiyon...}, {...aksiyon...} ], "meta": {...isteğe bağlı...}, "summary": "..." }',
      "   'summary' alanına, ne yaptığını 1-2 cümlelik doğal Türkçe ile kısaca özetle.",
      "",
      "2) 'patch' dizisindeki HER eleman aşağıdaki 7 aksiyondan BİRİ olmalı (her aksiyonun kendi alanları vardır):",
      "",
      '   a) UPDATE_STYLE  — bir bloğun GÖRSEL/stil alanlarını değiştirir (renk, boşluk, hizalama, yazı tipi, boyut, tab, vb).',
      '      { "action": "UPDATE_STYLE", "targetId": "<mevcut blok id>", "patch": { "bgColor": "#112233", "padY": 40, ... } }',
      "",
      '   b) UPDATE_CONTENT — bir bloğun İÇERİK alanlarını değiştirir (text, html, question, options, rows, de/tr, vb — bloğun türüne göre).',
      '      { "action": "UPDATE_CONTENT", "targetId": "<mevcut blok id>", "patch": { "text": "Yeni başlık", ... } }',
      "      NOT: UPDATE_STYLE ve UPDATE_CONTENT'te 'patch' içine SADECE değişecek alanları yaz; değişmeyen alanlara hiç değinme, onlar olduğu gibi kalır.",
      "",
      '   c) REORDER_BLOCKS — sayfadaki TÜM blokların yeni sırasını verir (kısmi liste OLMAZ, o an var olan HER id\'yi yeni sırayla içermeli).',
      '      { "action": "REORDER_BLOCKS", "order": ["b3", "b1", "b2", ...] }',
      "",
      '   d) ADD_BLOCK — yeni bir blok ekler. id verme (otomatik atanır). "position": "start"|"end"|"before"|"after" (varsayılan "end"); "before"/"after" için "targetId" gerekir.',
      '      { "action": "ADD_BLOCK", "block": { "type": "paragraph", "html": "...", "tab": "content" }, "position": "after", "targetId": "b5" }',
      "",
      '   e) REMOVE_BLOCK — bir bloğu siler.',
      '      { "action": "REMOVE_BLOCK", "targetId": "b7" }',
      "",
      '   f) APPLY_THEME — sayfanın GENEL temasını değiştirir (sadece kullanıcı açıkça istediyse kullan).',
      '      { "action": "APPLY_THEME", "theme": "ocean", "color": "#0b1220" }',
      "      theme şu isimlerden biri olmalı: " + THEME_NAMES.join(", ") + ". \"none\"=tema yok, \"custom\"=düz özel renk (bu durumda 'color' da hex olarak ZORUNLU), diğerleri hazır gradyan temalardır.",
      "",
      '   g) REPLACE_BLOCK_TREE — SADECE yukarıdaki 6 aksiyonun karşılayamadığı, çok karmaşık/kapsamlı bir yeniden yapılandırma isteğinde (ör. "tüm dersi baştan farklı bir konuda yeniden yaz") kullanılacak ESNEK BİR KAÇIŞ KAPISI (fallback). Sayfanın TÜM bloklarını (korunacaklar dahil, aynı id değerleriyle) yeniden verir:',
      '      { "action": "REPLACE_BLOCK_TREE", "blocks": [ { "id": "b1", "type": "heading", "text": "..." }, ... ] }',
      "      Normal, günlük isteklerde (bir rengi değiştir, bir cümleyi düzelt, blok ekle/sil/taşı) bunu KULLANMA — bu, çok daha fazla token harcar ve sadece gerçekten şema dışı/global bir talep olduğunda tercih edilmelidir.",
      "",
      "3) Sekme (tab) alanı: Bu ders için TANIMLI SEKMELER şu an şunlar: " + tabList + ". Bir bloğu bu sekmelerden birine atamak için o sekmenin 'key' değerini yaz.",
      "   YENİ BİR SEKME oluşturman gerekiyorsa (ör. kullanıcı 'gramer notları için ayrı bir sekme aç' derse), tab alanına yukarıdaki listedeki hiçbir key/label ile eşleşmeyen, insan-okur YENİ bir ad yaz (örn. \"Gramer\") — otomatik olarak yeni bir sekme oluşturulur. Kullanıcı açıkça istemediyse gereksiz yere yeni sekme üretme.",
      "",
      "4) Blok türleri ve alanları (ADD_BLOCK.block ile UPDATE_CONTENT.patch için — örnek varsayılan değerlerle):",
      typeLines,
      "",
      "5) Alan kısıtlamaları:",
      "   - Renk alanları (color, bgColor gibi) HER ZAMAN \"#rrggbb\" hex formatında olmalı (kısaltma yok).",
      "   - font alanı şu değerlerden biri olmalı: " + fontKeys,
      "   - weight alanı: \"400\", \"500\", \"600\", \"700\" veya \"800\" (string olarak, tırnaklı).",
      "   - paragraph.align: \"left\", \"center\", \"right\", \"justify\". image.align: \"left\", \"center\", \"right\".",
      "   - heading.level: \"h1\", \"h2\" veya \"h3\". callout.theme: \"amber\"|\"green\"|\"blue\"|\"rose\".",
      "   - image.objectFit: \"cover\" veya \"contain\"; image.shadow / image.lazy: \"0\" veya \"1\".",
      "   - table.rows bir dizi-dizisidir (satır x sütun); boyut değiştirirsen headers/audioHeaders/audioCells dizilerini de tutarlı tut.",
      "",
      "6) BAĞLAM MODU: Bu istekte sana " + (contextMode === "LIGHT"
        ? "her blok için SADECE { id, type, tab, currentStyle } özetini gönderiyorum (içerik/metin alanları YOK) çünkü isteğin bir stil/tema/sıralama isteği gibi görünüyor. İçerikle ilgili bir şey fark edersen ya da emin değilsen, o blok için içerik alanlarını TAHMİN ETME/UYDURMA — sadece stil/sıralama aksiyonları üret."
        : "her bloğun TAM içeriğini gönderiyorum."),
      "",
      "7) Kullanıcının istemediği alanları/blokları GEREKSİZ YERE değiştirme. Ama 'daha premium görünsün', 'kontrastı artır' gibi açık tasarım istekleri gelirse profesyonel bir tasarım zevkiyle uygula.",
      "",
      "8) YENİ bir ders oluşturuyorsan (ADD_BLOCK'larla sıfırdan bir yapı kuruyorsan) ya da dersin konusunu/başlığını kökten değiştiriyorsan, cevabına ayrıca bir 'meta' nesnesi ekle — bu bilgiler \"HTML Sayfası Oluştur\" (dışa aktarma) formundaki alanları doldurmak için kullanılır. Formun o an ne durumda olduğunu 'MEVCUT DURUM' içindeki 'currentMeta' alanından görebilirsin:",
      '   "meta": { "title": "...", "description": "...", "level": "A1|A2|B1|B2|C1", "type": "iletisim|kultur|gramer", "difficulty": "Kolay|Orta|Zor", "readTime": "dakika (string, örn. \\"6\\")", "cover": "" }',
      "   - cover alanını SADECE derste kullanıcının verdiği gerçek bir görsel URL'si varsa doldur; yoksa boş string (\"\") bırak.",
      "   - 'meta' içine ASLA yazar adı ya da URL slug/klasör adı EKLEME — bunlar tamamen kullanıcıya aittir.",
      "   - Küçük/yerel bir düzenleme yapıyorsan 'meta' alanını hiç EKLEME."
    ].join("\n");
  }

  /* ---------- Gemini API çağrısı ---------- */
  /**
   * Gemini'ye kullanıcı isteğini ve DİNAMİK OLARAK seçilmiş bağlamı gönderir.
   * @param {string} apiKey
   * @param {string} model
   * @param {string} userPrompt
   * @returns {Promise<Object>} `{ patch: ActionPatch[], meta?: Object, summary?: string }`
   */
  function callGeminiApi(apiKey, model, userPrompt) {
    var contextMode = classifyContextMode(userPrompt);
    var schema = buildSchemaText(contextMode);

    function currentMetaSnapshot() {
      function v(sel) { var elx = document.querySelector(sel); return elx ? elx.value : ""; }
      return {
        title: v("#metaTitle"), description: v("#metaDesc"), level: v("#metaLevel"),
        type: v("#metaType"), difficulty: v("#metaDifficulty"), readTime: v("#metaReadTime"),
        cover: v("#metaCover")
      };
    }
    var snapshot = {
      blocks: buildBlockContext(contextMode), // ← dinamik bağlam: LIGHT'ta içerik alanları gitmez
      tabs: (typeof projectTabs !== "undefined") ? projectTabs : [],
      currentTheme: (typeof themeSelect !== "undefined" && themeSelect) ? themeSelect.value : "none",
      currentThemeColor: (typeof themeColorInput !== "undefined" && themeColorInput) ? themeColorInput.value : "#0b1220",
      currentMeta: currentMetaSnapshot()
    };
    var fullPrompt = schema +
      "\n\n=== MEVCUT DURUM (JSON, bağlam modu: " + contextMode + ") ===\n" + JSON.stringify(snapshot) +
      "\n\n=== KULLANICI İSTEĞİ ===\n" + userPrompt +
      "\n\nYukarıdaki kurallara göre SADECE JSON döndür.";

    var url = "https://generativelanguage.googleapis.com/v1beta/models/" +
      encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(apiKey);

    /* NOT (mimari karar): Gemini'nin `generationConfig.responseSchema` ile
       katı şema doğrulaması BİLİNÇLİ olarak kullanılmıyor. 'patch'/'block'
       alanları, blok türüne göre değişen AÇIK UÇLU (dinamik anahtarlı)
       nesnelerdir; Gemini'nin controlled-generation şeması bu tür serbest
       nesneleri güvenilir şekilde ifade edemiyor ve üzerinde ısrar etmek,
       geçerli patch'lerin reddedilmesine yol açabiliyor. Bunun yerine
       doğruluk garantisi, API-side şema doğrulamasından DAHA GÜÇLÜ olan
       kendi iki fazlı validateAndApplyPatch() motorumuzdan geliyor (bkz.
       canvas-action-runner.js) — id varlığı, tam permütasyon, tema adı
       gibi iş kurallarını zaten JSON Schema ifade edemez. */
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 }
      })
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (json) {
        if (!res.ok) {
          var msg = (json && json.error && json.error.message) ? json.error.message : ("HTTP " + res.status);
          throw new Error(msg);
        }
        return json;
      });
    }).then(function (json) {
      if (!json || !json.candidates || !json.candidates[0] || !json.candidates[0].content) {
        throw new Error("Gemini'den geçerli bir yanıt alınamadı.");
      }
      var parts = json.candidates[0].content.parts || [];
      var text = parts.map(function (p) { return p.text || ""; }).join("");
      var cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "").trim();
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        throw new Error("Gemini'nin yanıtı geçerli JSON değildi.");
      }
    });
  }

  /**
   * Gemini'nin döndürdüğü 'meta' nesnesini "HTML Sayfası Oluştur" formuna
   * uygular. Yazar adı ve URL slug/klasör adına KASITLI olarak dokunulmaz.
   * @param {Object} [meta]
   */
  function applyMetaFields(meta) {
    if (!meta || typeof meta !== "object") return;
    var getEl = function (sel) { return (typeof $ === "function") ? $(sel) : document.querySelector(sel); };
    var titleEl = getEl("#metaTitle");
    if (meta.title && titleEl) {
      titleEl.value = String(meta.title);
      // Mevcut slug-önerisi mantığını (02. dosyadaki input dinleyicisi) tetiklemek
      // için normal bir "input" olayı yayınlıyoruz; slug kullanıcı elle
      // değiştirmediyse başlığa göre otomatik güncellenir — burada slug'a
      // DOĞRUDAN yazmıyoruz.
      titleEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
    var descEl = getEl("#metaDesc");
    if (meta.description && descEl) descEl.value = String(meta.description);
    var levelEl = getEl("#metaLevel");
    if (meta.level && levelEl) levelEl.value = String(meta.level);
    var typeEl = getEl("#metaType");
    if (meta.type !== undefined && meta.type !== null && typeEl) typeEl.value = String(meta.type);
    var diffEl = getEl("#metaDifficulty");
    if (meta.difficulty && diffEl) diffEl.value = String(meta.difficulty);
    var readTimeEl = getEl("#metaReadTime");
    if (meta.readTime && readTimeEl) readTimeEl.value = String(meta.readTime);
    var coverEl = getEl("#metaCover");
    if (meta.cover && coverEl) coverEl.value = String(meta.cover);
  }

  /**
   * Gemini'den dönen sonucu, canvas-action-runner.js üzerinden İKİ FAZLI
   * (doğrula → snapshot al → uygula, hata olursa rollback) olarak uygular.
   * Bu fonksiyon artık kendisi state'i mutasyona UĞRATMAZ — tüm sorumluluğu
   * CanvasActionRunner.validateAndApplyPatch()'e devreder; böylece geçersiz/
   * bozuk bir patch kanvası ASLA yarım bir durumda bırakmaz.
   * @param {{patch: Array<Object>, meta?: Object, summary?: string}} result
   * @returns {{createdTabLabels: string[]}}
   */
  function applyGeminiResult(result) {
    if (!result || !Array.isArray(result.patch)) {
      throw new Error("Yanıt beklenen formatta değil ('patch' dizisi bulunamadı).");
    }
    if (typeof CanvasActionRunner === "undefined" || !CanvasActionRunner.validateAndApplyPatch) {
      throw new Error("canvas-action-runner.js yüklenmemiş; patch uygulanamıyor.");
    }
    var runResult = CanvasActionRunner.validateAndApplyPatch(result.patch, { themeNames: THEME_NAMES });
    if (!runResult.ok) {
      throw new Error(runResult.error || "Patch geçersizdi; hiçbir değişiklik uygulanmadı.");
    }
    applyMetaFields(result.meta);
    return { createdTabLabels: runResult.createdTabLabels || [] };
  }

  /* ---------- Gönder butonu ---------- */
  sendBtn.addEventListener("click", function () {
    var apiKey = apiKeyInput.value.trim();
    var model = modelSelect.value;
    var userPrompt = promptInput.value.trim();

    if (!apiKey) {
      showLog("⚠️ Lütfen önce Gemini API anahtarınızı girin.", "err");
      apiKeyInput.focus();
      return;
    }
    if (!userPrompt) {
      showLog("⚠️ Ne yapmamı istediğinizi yazın.", "err");
      promptInput.focus();
      return;
    }
    persistSettings();

    sendBtn.disabled = true;
    sendBtn.classList.add("busy");
    showLog('<div class="gl-title"><span class="gemini-spinner"></span> Gemini düşünüyor…</div>', "busy");

    callGeminiApi(apiKey, model, userPrompt)
      .then(function (result) {
        var applyInfo = applyGeminiResult(result);
        var summary = (result && result.summary) ? result.summary : "Değişiklikler uygulandı.";
        var tabNote = (applyInfo && applyInfo.createdTabLabels && applyInfo.createdTabLabels.length)
          ? ('<br><small>+ Yeni sekme oluşturuldu: ' + applyInfo.createdTabLabels.map(esc).join(", ") + '</small>')
          : "";
        showLog('<div class="gl-title">✅ Tamamlandı</div>' + esc(summary) + tabNote, "ok");
        if (typeof toast === "function") toast("Gemini AI değişiklikleri uyguladı.", "ok");
      })
      .catch(function (err) {
        console.error("Gemini AI hata:", err);
        var msg = (err && err.message) ? err.message : String(err);
        showLog('<div class="gl-title">✖ Hata</div>' + esc(msg), "err");
        if (typeof toast === "function") toast("Gemini AI isteği başarısız oldu.", "err");
      })
      .then(function () {
        sendBtn.disabled = false;
        sendBtn.classList.remove("busy");
      });
  });

})();