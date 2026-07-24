"use strict";
/* ═══════════════════════════════════════════════════════════
   JS 5/5 — GEMİNİ AI ASİSTANI
   Bu dosya, index.html'deki diğer 4 script'in tanımladığı global
   değişken/fonksiyonlara (blocks, renderAll, addBlock, defaultsFor,
   TYPE_LABEL, FONT_OPTIONS, toast, applyTheme, themeSelect,
   themeColorInput, nextId, esc, applyAutoTextColorsForPageBg vb.)
   İHTİYAÇ DUYAR — bu yüzden index.html'de EN SONA eklenmelidir.

   Amaç: Kullanıcının girdiği Gemini API anahtarıyla, doğal dilde
   verilen bir talimata göre sayfadaki TÜM blokları (yazı tipi, renk,
   arka plan, boyut, hizalama, boşluk, blok ekleme/silme/sıralama)
   ve genel sayfa temasını -- sanki kullanıcının kendisi ayar
   panelinden elle düzenliyormuş gibi -- tam yetkiyle güncellemektir.

   Bu dosyanın kendisi bir IIFE (kendi kendini çağıran fonksiyon)
   içine sarılmıştır; böylece burada tanımlanan yerel değişkenler
   (overlay, el, state, data, url, type, raw... gibi) diğer
   dosyalardaki aynı isimli global değişkenlerle ÇAKIŞMAZ. Yine de
   dışarıdaki (blocks, renderAll, TYPE_LABEL, ...) paylaşılan global
   scope'a erişebilir, çünkü kapanış (closure) zinciri üzerinden
   onlara ulaşır.
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

  function buildSchemaText() {
    var typeLines = Object.keys(TYPE_LABEL).map(function (t) {
      return "- " + t + " (" + TYPE_LABEL[t] + "): { " + typeFieldsDoc(t) + " }";
    }).join("\n");
    var fontKeys = (typeof FONT_OPTIONS !== "undefined")
      ? FONT_OPTIONS.map(function (f) { return f[0]; }).join(", ")
      : "body, display, serif, merriweather, playfair, poppins, montserrat, nunito";

    return [
      "Sen, Türkçe bir ders (statik HTML sayfa) oluşturma aracı için tam yetkili bir tasarım/içerik asistanısın.",
      "Kullanıcı, aşağıda vereceğim sayfanın TAMAMI üzerinde -- her bloğun yazı tipi, rengi, arka planı, boyutu, hizalaması, boşlukları dahil -- sana tam yetki veriyor. Sanki kullanıcının kendisi ayar panelinden elle düzenliyormuş gibi davran.",
      "",
      "KURALLAR:",
      "1) SADECE geçerli JSON döndür. Açıklama, markdown, ```json işareti YOK. Cevabın tamamı tek bir JSON nesnesi olmalı:",
      '   { "blocks": [ {...}, {...} ], "theme": {"name": "...", "color": "#hex"}, "summary": "..." }',
      "   'theme' alanı isteğe bağlıdır; sadece kullanıcı sayfanın GENEL temasını/arka planını değiştirmemi istediyse ekle.",
      "   'summary' alanına, ne yaptığını 1-2 cümlelik doğal Türkçe ile kısaca özetle.",
      "",
      "2) Her blok nesnesinde MUTLAKA 'id' ve 'type' alanları bulunmalı.",
      "   - Var olan bir bloğu düzenliyorsan id'sini AŞAĞIDAKİ 'MEVCUT DURUM' içindeki haliyle AYNEN koru.",
      "   - YENİ bir blok ekliyorsan id alanını \"NEW\" yaz, otomatik id verilecek.",
      "   - Bir bloğu SİLMEK istiyorsan onu döndürdüğün 'blocks' dizisine hiç KOYMA.",
      "   - Dizideki SIRA = sayfadaki görünüm sırasıdır; sıralama isteğine göre diziyi düzenle.",
      "   - Kullanıcı sadece 1-2 bloğu değiştirmemi istese bile, döndürdüğün 'blocks' dizisi HER ZAMAN sayfanın TÜM bloklarını (değişmeyenler dahil, aynı sırayla) eksiksiz içermeli çünkü bu dizi sayfanın yeni tam hali olarak doğrudan kullanılacak.",
      "",
      "3) TÜM blok türlerinde bulunabilen ortak alanlar (hepsi isteğe bağlı; verilmezse eskisi korunur):",
      "   - padY (0-120, dikey iç boşluk px), padX (0-120, yatay iç boşluk px), marginY (0-80, dikey dış boşluk px)",
      "   - bgColor (\"\" = şeffaf, yoksa \"#rrggbb\" hex — bloğun KENDİ arka plan rengi)",
      "   - bgOpacity (0-100, bgColor opaklık yüzdesi)",
      "",
      "4) Blok türleri ve düzenlenebilir alanları (örnek varsayılan değerlerle):",
      typeLines,
      "",
      "5) Alan kısıtlamaları:",
      "   - Renk alanları (color, bgColor gibi) HER ZAMAN \"#rrggbb\" hex formatında olmalı (kısaltma yok).",
      "   - font alanı şu değerlerden biri olmalı: " + fontKeys,
      "   - weight alanı: \"400\", \"500\", \"600\", \"700\" veya \"800\" (metin/string olarak, tırnaklı).",
      "   - paragraph.align: \"left\", \"center\", \"right\", \"justify\". image.align: \"left\", \"center\", \"right\".",
      "   - heading.level: \"h1\", \"h2\" veya \"h3\".",
      "   - callout.theme: \"amber\" (sarı/uyarı), \"green\" (başarı), \"blue\" (bilgi), \"rose\" (hata/tehlike).",
      "   - image.objectFit: \"cover\" veya \"contain\"; image.shadow / image.lazy: \"0\" veya \"1\".",
      "   - table.rows bir dizi-dizisidir (satır x sütun); table.headers sütun başlıkları dizisidir; boyutları değiştirirsen audioHeaders/audioCells dizilerini de aynı boyuta getir (false ile doldur).",
      "",
      "6) Sayfa geneli tema (isteğe bağlı 'theme' alanı) şu isimlerden biri olabilir:",
      "   " + THEME_NAMES.join(", "),
      "   \"none\" = tema yok (varsayılan koyu zemin), \"custom\" = düz özel renk (bu durumda theme.color'ı da hex ver), diğerleri hazır gradyan temalardır.",
      "",
      "7) Kullanıcının istemediği alanları/blokları GEREKSİZ YERE değiştirme. Ama 'daha premium görünsün', 'kontrastı artır' gibi açık tasarım istekleri gelirse profesyonel bir tasarım zevkiyle uygula (uyumlu renk paletleri, okunabilir kontrast, tutarlı boşluklar)."
    ].join("\n");
  }

  /* ---------- Gemini API çağrısı ---------- */
  function callGeminiApi(apiKey, model, userPrompt) {
    var schema = buildSchemaText();
    var snapshot = {
      blocks: blocks,
      currentTheme: (typeof themeSelect !== "undefined" && themeSelect) ? themeSelect.value : "none",
      currentThemeColor: (typeof themeColorInput !== "undefined" && themeColorInput) ? themeColorInput.value : "#0b1220"
    };
    var fullPrompt = schema +
      "\n\n=== MEVCUT DURUM (JSON) ===\n" + JSON.stringify(snapshot) +
      "\n\n=== KULLANICI İSTEĞİ ===\n" + userPrompt +
      "\n\nYukarıdaki kurallara göre SADECE JSON döndür.";

    var url = "https://generativelanguage.googleapis.com/v1beta/models/" +
      encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(apiKey);

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

  /* ---------- Yalnızca renk-benzeri alanları doğrula, geçersizse ele ---------- */
  function sanitizeRawFields(raw) {
    var out = {};
    Object.keys(raw).forEach(function (k) {
      if (k === "id" || k === "type") return;
      var v = raw[k];
      if (/color/i.test(k)) {
        if (v === "" || (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v))) out[k] = v;
        return; // geçersiz hex ise atla, eski/varsayılan değer korunur
      }
      out[k] = v;
    });
    return out;
  }

  /* ---------- Gemini'nin döndürdüğü sonucu sayfaya uygula ---------- */
  function applyGeminiResult(result) {
    if (!result || !Array.isArray(result.blocks)) {
      throw new Error("Yanıt beklenen formatta değil ('blocks' dizisi bulunamadı).");
    }
    var existingById = {};
    blocks.forEach(function (b) { existingById[b.id] = b; });

    var seenIds = {};
    var newBlocks = [];

    result.blocks.forEach(function (raw) {
      if (!raw || typeof raw !== "object") return;
      var type = raw.type;
      if (!TYPE_LABEL[type]) return; // bilinmeyen tür -> atla

      var finalId = (raw.id && existingById[raw.id] && !seenIds[raw.id]) ? raw.id : null;
      if (!finalId) finalId = nextId();
      seenIds[finalId] = true;

      var base = defaultsFor(type);
      var prior = (existingById[raw.id] && existingById[raw.id].type === type) ? existingById[raw.id] : {};
      var safeRaw = sanitizeRawFields(raw);
      var merged = Object.assign({}, base, prior, safeRaw);

      // Sayısal/boolean alanları varsayılan tipe göre otomatik düzelt
      Object.keys(base).forEach(function (k) {
        if (typeof base[k] === "number") {
          var n = Number(merged[k]);
          merged[k] = isNaN(n) ? base[k] : n;
        } else if (typeof base[k] === "boolean") {
          merged[k] = !!merged[k];
        }
      });

      merged.id = finalId;
      merged.type = type;
      newBlocks.push(merged);
    });

    if (!newBlocks.length) {
      throw new Error("Sonuçta hiç geçerli blok bulunamadı; hiçbir değişiklik uygulanmadı.");
    }

    blocks = newBlocks;
    if (typeof activeBlockId !== "undefined") activeBlockId = null;
    if (typeof focusedBlockId !== "undefined") focusedBlockId = null;
    renderAll();

    if (result.theme && result.theme.name && THEME_NAMES.indexOf(result.theme.name) !== -1 &&
        typeof themeSelect !== "undefined" && themeSelect) {
      themeSelect.value = result.theme.name;
      if (typeof applyTheme === "function") applyTheme(themeSelect.value);
      themeColorInput.style.display = (result.theme.name === "custom") ? "" : "none";
      if (result.theme.name === "custom" && result.theme.color && /^#[0-9a-fA-F]{6}$/.test(result.theme.color)) {
        themeColorInput.value = result.theme.color;
        document.body.style.setProperty("--custom-bg", result.theme.color);
      }
      if (typeof applyAutoTextColorsForPageBg === "function") applyAutoTextColorsForPageBg();
    }
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
        applyGeminiResult(result);
        var summary = (result && result.summary) ? result.summary : "Değişiklikler uygulandı.";
        showLog('<div class="gl-title">✅ Tamamlandı</div>' + esc(summary), "ok");
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
