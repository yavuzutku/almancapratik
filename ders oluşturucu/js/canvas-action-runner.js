"use strict";
/* ═══════════════════════════════════════════════════════════════════════
   CANVAS ACTION RUNNER — Atomik Patch Uygulama & Rollback Motoru
   ───────────────────────────────────────────────────────────────────────
   Bu dosya, 01-04 numaralı script'lerin tanımladığı global kanvas
   durumuna (blocks, projectTabs, canvasViewTab, seq, nextId, ...) karşı
   çalışan, herhangi bir AI/otomasyon katmanının (bkz. 05-gemini-assistant.js)
   ÜRETTİĞİ komutları güvenli şekilde uygulayan bağımsız bir state motorudur.

   Neden var?
   - Eskiden AI, sayfanın TAMAMINI (tüm blokların tüm alanlarıyla) her
     seferinde yeniden döndürmek zorundaydı: hem çok token harcar hem de
     AI'nin dokunmaması gereken bir alanı yanlışlıkla "unutup" silmesi
     riski taşırdı.
   - Bu motorla birlikte AI artık sadece DEĞİŞECEK olanı, kararlı (id
     tabanlı, index'e ASLA bağlı olmayan) hedeflerle bir "ActionPatch[]"
     listesi olarak bildirir. Liste; doğrulanır (validate), TAMAMI geçerliyse
     tek seferde uygulanır (apply); herhangi bir adım beklenmedik şekilde
     patlarsa state, işlem öncesi haline geri alınır (rollback) — kanvas
     asla yarım/bozuk bir durumda kalmaz.

   Genel prensip — İKİ FAZLI UYGULAMA:
     FAZ 1 (validateAction):  Canlı state'e HİÇBİR ŞEY YAZILMADAN, patch
                               listesindeki HER aksiyon yapısal ve iş
                               kuralları açısından doğrulanır (id var mı,
                               order tam bir permütasyon mu, tema tanınıyor
                               mu, vb). Tek bir aksiyon bile geçersizse
                               FAZ 2'ye hiç girilmez — kanvasa dokunulmaz.
     FAZ 2 (applyOneAction):  Doğrulama tamamen geçtiyse önce bir Snapshot
                               alınır, sonra aksiyonlar sırayla canlı state
                               üzerinde uygulanır. Uygulama sırasında
                               (beklenmedik/defansif) bir hata oluşursa
                               Snapshot'tan rollback yapılır ve UI hiç
                               değişmemiş gibi kalır.

   Bu dosya kendi IIFE'i içindedir ve tek bir global isim yayınlar:
   `window.CanvasActionRunner`. Diğer dosyalarla aynı global scope'u
   paylaştığı için `blocks`, `projectTabs`, `canvasViewTab`, `nextId`,
   `defaultsFor`, `TYPE_LABEL`, `genTabKey`, `renderAll`,
   `rebuildCanvasTabsUi`, `themeSelect`, `themeColorInput`, `applyTheme`,
   `applyAutoTextColorsForPageBg` gibi 01-04 script'lerinde tanımlı
   fonksiyon/değişkenlere doğrudan erişebilir (hepsi `typeof` korumalı
   kullanılır, böylece bu dosya farklı bir projede/bağlamda da güvenle
   yüklenebilir ve sessizce no-op'a düşer).
   ═══════════════════════════════════════════════════════════════════════ */

(function (global) {

  /** Desteklenen aksiyon türleri. Şema dışı/karmaşık istekler için
   *  REPLACE_BLOCK_TREE her zaman bir kaçış kapısı (fallback) olarak durur. */
  var ACTIONS = Object.freeze({
    UPDATE_STYLE: "UPDATE_STYLE",
    UPDATE_CONTENT: "UPDATE_CONTENT",
    REORDER_BLOCKS: "REORDER_BLOCKS",
    ADD_BLOCK: "ADD_BLOCK",
    REMOVE_BLOCK: "REMOVE_BLOCK",
    APPLY_THEME: "APPLY_THEME",
    REPLACE_BLOCK_TREE: "REPLACE_BLOCK_TREE"
  });

  var VALID_POSITIONS = ["start", "end", "before", "after"];

  // ────────────────────────────────────────────────────────────────────
  //  Yardımcılar
  // ────────────────────────────────────────────────────────────────────

  /** @returns {Object.<string, true>} O anki bloklara ait id -> true haritası. */
  function liveIdMap() {
    var map = {};
    (blocks || []).forEach(function (b) { map[b.id] = true; });
    return map;
  }

  /**
   * Bir patch/block nesnesindeki alanları güvenli şekilde süzer:
   *  - `id` ve `type` alanlarına dokunulmasını (üzerine yazılmasını) engeller.
   *  - Renk alanlarını ("...color...") sadece geçerli "#rrggbb" hex ise kabul eder.
   *  - İlgili blok türünün varsayılan şemasında (defaultsFor) olmayan, ya da
   *    ortak stil alanları listesinde bulunmayan HİÇ TANINMAYAN bir anahtarı
   *    sessizce eler (AI'nin uydurduğu rastgele bir alan state'e sızamaz).
   * @param {Object} raw - Ham patch/block nesnesi.
   * @param {string} type - Hedef bloğun türü (defaultsFor için).
   * @returns {Object} Temizlenmiş, uygulanmaya hazır alan kümesi.
   */
  function sanitizeFields(raw, type) {
    var out = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
    var base = (typeof defaultsFor === "function") ? (defaultsFor(type) || {}) : {};
    var commonStyleKeys = ["padY", "padX", "marginY", "bgColor", "bgOpacity", "tab"];
    var allowed = Object.keys(base).concat(commonStyleKeys);
    Object.keys(raw).forEach(function (k) {
      if (k === "id" || k === "type") return;
      if (allowed.indexOf(k) === -1) return;
      var v = raw[k];
      if (/color/i.test(k)) {
        if (v === "" || (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v))) out[k] = v;
        return; // geçersiz hex -> yok say, eski/varsayılan değer korunur
      }
      out[k] = v;
    });
    return out;
  }

  /** `defaultsFor(type)` şemasındaki sayısal/boolean alanları merged nesne
   *  üzerinde doğru tipe zorlar (AI bazen "40" gibi string sayı döndürebilir). */
  function coerceFieldTypes(merged, type) {
    var base = (typeof defaultsFor === "function") ? (defaultsFor(type) || {}) : {};
    Object.keys(base).forEach(function (k) {
      if (typeof base[k] === "number") {
        var n = Number(merged[k]);
        merged[k] = isNaN(n) ? base[k] : n;
      } else if (typeof base[k] === "boolean") {
        merged[k] = !!merged[k];
      }
    });
  }

  /**
   * Bir sekme adını (AI'den gelen insan-okur bir label ya da mevcut bir key
   * olabilir) gerçek bir sekme key'ine çözer; eşleşme yoksa YENİ bir sekme
   * otomatik oluşturur (bkz. projectTabs / genTabKey — 01-core-canvas-settings.js).
   * @param {string} rawTab
   * @param {string[]} createdTabLabels - Bu patch turunda yeni oluşturulan
   *        sekme adlarının biriktirildiği dizi (çağırana rapor için).
   * @returns {string} Geçerli bir sekme key'i.
   */
  function resolveTabKey(rawTab, createdTabLabels) {
    if (!rawTab || typeof projectTabs === "undefined") return rawTab;
    var wanted = String(rawTab).trim();
    if (!wanted) return rawTab;
    var existing = projectTabs.find(function (t) {
      return t.key === wanted || t.label.toLowerCase() === wanted.toLowerCase();
    });
    if (existing) return existing.key;
    var key = (typeof genTabKey === "function") ? genTabKey() : ("tab" + Date.now());
    projectTabs.push({ key: key, label: wanted });
    createdTabLabels.push(wanted);
    return key;
  }

  /** Yeni bloğu `position`/`targetId`'ye göre canlı `blocks` dizisine yerleştirir. */
  function insertBlock(newBlock, action) {
    var pos = action.position || "end";
    if (pos === "start") { blocks.unshift(newBlock); return; }
    if (pos === "end" || !action.targetId) { blocks.push(newBlock); return; }
    var idx = blocks.findIndex(function (b) { return b.id === action.targetId; });
    if (idx === -1) { blocks.push(newBlock); return; }
    blocks.splice(pos === "before" ? idx : idx + 1, 0, newBlock);
  }

  /** APPLY_THEME aksiyonunu mevcut tema alt sistemine (02. dosya) uygular. */
  function applyThemeAction(action) {
    if (typeof themeSelect === "undefined" || !themeSelect) return;
    themeSelect.value = action.theme;
    if (typeof applyTheme === "function") applyTheme(action.theme);
    if (typeof themeColorInput !== "undefined" && themeColorInput) {
      themeColorInput.style.display = (action.theme === "custom") ? "" : "none";
      if (action.theme === "custom" && action.color) {
        themeColorInput.value = action.color;
        document.body.style.setProperty("--custom-bg", action.color);
      }
    }
    if (typeof applyAutoTextColorsForPageBg === "function") applyAutoTextColorsForPageBg();
  }

  /**
   * REPLACE_BLOCK_TREE fallback'i için ham blok listesini gerçek blok
   * nesnelerine dönüştürür. Var olan bir id + aynı type eşleşirse önceki
   * bloğun (tanımadığımız/şemaya olmayan) alanları korunur, üzerine sadece
   * AI'nin verdiği (sanitize edilmiş) alanlar yazılır.
   */
  function buildBlocksFromRawList(rawList, createdTabLabels) {
    var existingById = {};
    (blocks || []).forEach(function (b) { existingById[b.id] = b; });
    var seenIds = {};
    var out = [];
    rawList.forEach(function (raw) {
      if (!raw || typeof raw !== "object") return;
      var type = raw.type;
      if (typeof TYPE_LABEL !== "undefined" && !TYPE_LABEL[type]) return; // bilinmeyen tür -> atla
      var finalId = (raw.id && existingById[raw.id] && !seenIds[raw.id]) ? raw.id : nextId();
      seenIds[finalId] = true;
      var base = (typeof defaultsFor === "function") ? defaultsFor(type) : {};
      var prior = (existingById[raw.id] && existingById[raw.id].type === type) ? existingById[raw.id] : {};
      var safe = sanitizeFields(raw, type);
      var merged = Object.assign({}, base, prior, safe);
      if (merged.tab) merged.tab = resolveTabKey(merged.tab, createdTabLabels);
      coerceFieldTypes(merged, type);
      merged.id = finalId;
      merged.type = type;
      out.push(merged);
    });
    if (!out.length) throw new Error("REPLACE_BLOCK_TREE içinde geçerli hiçbir blok bulunamadı.");
    return out;
  }

  // ────────────────────────────────────────────────────────────────────
  //  FAZ 1 — Salt okunur doğrulama (state'e hiçbir yazma yapılmaz)
  // ────────────────────────────────────────────────────────────────────

  /**
   * Tek bir aksiyonu, o anki CANLI (ama SALT OKUNUR şekilde kullanılan)
   * state'e karşı doğrular. Herhangi bir sorun varsa açıklayıcı bir hata
   * metni döndürür; her şey yolundaysa `null` döner.
   * @param {Object} action
   * @param {Object.<string,true>} liveIds
   * @param {{themeNames?: string[]}} opts
   * @returns {string|null}
   */
  function validateAction(action, liveIds, opts) {
    if (!action || typeof action !== "object" || typeof action.action !== "string") {
      return "Geçersiz aksiyon: 'action' alanı eksik ya da nesne değil.";
    }
    switch (action.action) {
      case ACTIONS.UPDATE_STYLE:
      case ACTIONS.UPDATE_CONTENT:
        if (!action.targetId || typeof action.targetId !== "string") {
          return action.action + ": 'targetId' eksik.";
        }
        if (!liveIds[action.targetId]) {
          return action.action + ": '" + action.targetId + "' id'li blok kanvasta bulunamadı (silinmiş ya da hatalı id olabilir).";
        }
        if (!action.patch || typeof action.patch !== "object" || Array.isArray(action.patch)) {
          return action.action + ": 'patch' bir nesne (object) olmalı.";
        }
        return null;

      case ACTIONS.REORDER_BLOCKS: {
        if (!Array.isArray(action.order) || !action.order.length) {
          return "REORDER_BLOCKS: 'order' dizisi eksik ya da boş.";
        }
        var liveKeys = Object.keys(liveIds);
        if (action.order.length !== liveKeys.length) {
          return "REORDER_BLOCKS: 'order' uzunluğu (" + action.order.length + ") mevcut blok sayısıyla (" + liveKeys.length + ") eşleşmiyor — TAM bir permütasyon olmalı.";
        }
        var seen = {};
        for (var i = 0; i < action.order.length; i++) {
          var id = action.order[i];
          if (!liveIds[id]) return "REORDER_BLOCKS: '" + id + "' geçerli/mevcut bir blok id'si değil.";
          if (seen[id]) return "REORDER_BLOCKS: '" + id + "' order dizisinde birden fazla kez geçiyor.";
          seen[id] = true;
        }
        return null;
      }

      case ACTIONS.ADD_BLOCK: {
        if (!action.block || typeof action.block !== "object") return "ADD_BLOCK: 'block' nesnesi eksik.";
        var typeLabels = (typeof TYPE_LABEL !== "undefined") ? TYPE_LABEL : null;
        if (typeLabels && !typeLabels[action.block.type]) {
          return "ADD_BLOCK: desteklenmeyen/tanınmayan blok türü: '" + action.block.type + "'.";
        }
        if (action.position && VALID_POSITIONS.indexOf(action.position) === -1) {
          return "ADD_BLOCK: geçersiz 'position': '" + action.position + "' (start|end|before|after olmalı).";
        }
        if ((action.position === "before" || action.position === "after") &&
            (!action.targetId || !liveIds[action.targetId])) {
          return "ADD_BLOCK: position '" + action.position + "' için geçerli bir 'targetId' gerekli.";
        }
        return null;
      }

      case ACTIONS.REMOVE_BLOCK:
        if (!action.targetId || typeof action.targetId !== "string") return "REMOVE_BLOCK: 'targetId' eksik.";
        if (!liveIds[action.targetId]) return "REMOVE_BLOCK: '" + action.targetId + "' id'li blok bulunamadı.";
        return null;

      case ACTIONS.APPLY_THEME: {
        if (!action.theme || typeof action.theme !== "string") return "APPLY_THEME: 'theme' alanı eksik.";
        var names = opts && opts.themeNames;
        if (Array.isArray(names) && names.indexOf(action.theme) === -1) {
          return "APPLY_THEME: '" + action.theme + "' tanınan bir tema adı değil.";
        }
        if (action.theme === "custom" && (!action.color || !/^#[0-9a-fA-F]{6}$/.test(action.color))) {
          return "APPLY_THEME: 'custom' teması için geçerli bir hex 'color' (#rrggbb) gerekli.";
        }
        return null;
      }

      case ACTIONS.REPLACE_BLOCK_TREE:
        if (!Array.isArray(action.blocks) || !action.blocks.length) {
          return "REPLACE_BLOCK_TREE: 'blocks' dizisi eksik ya da boş.";
        }
        return null;

      default:
        return "Bilinmeyen aksiyon türü: '" + action.action + "'.";
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  FAZ 2 — Uygulama (yalnızca FAZ 1 tamamen başarılıysa çağrılır)
  // ────────────────────────────────────────────────────────────────────

  /** Tek bir aksiyonu canlı state üzerinde UYGULAR (mutasyon yapar). */
  function applyOneAction(action, createdTabLabels) {
    switch (action.action) {
      case ACTIONS.UPDATE_STYLE:
      case ACTIONS.UPDATE_CONTENT: {
        var idx = blocks.findIndex(function (b) { return b.id === action.targetId; });
        if (idx === -1) throw new Error("Hedef blok uygulama anında bulunamadı: " + action.targetId);
        var block = blocks[idx];
        var patch = sanitizeFields(action.patch, block.type);
        if (patch.tab) patch.tab = resolveTabKey(patch.tab, createdTabLabels);
        var merged = Object.assign({}, block, patch);
        merged.id = block.id;
        merged.type = block.type;
        coerceFieldTypes(merged, block.type);
        blocks[idx] = merged;
        return;
      }
      case ACTIONS.REORDER_BLOCKS: {
        var byId = {};
        blocks.forEach(function (b) { byId[b.id] = b; });
        blocks = action.order.map(function (id) { return byId[id]; });
        return;
      }
      case ACTIONS.ADD_BLOCK: {
        var type = action.block.type;
        var base = (typeof defaultsFor === "function") ? defaultsFor(type) : {};
        var safe = sanitizeFields(action.block, type);
        var newBlock = Object.assign({}, base, safe);
        coerceFieldTypes(newBlock, type);
        newBlock.id = nextId();
        newBlock.type = type;
        newBlock.tab = newBlock.tab
          ? resolveTabKey(newBlock.tab, createdTabLabels)
          : (typeof canvasViewTab !== "undefined" ? canvasViewTab : newBlock.tab);
        insertBlock(newBlock, action);
        return;
      }
      case ACTIONS.REMOVE_BLOCK:
        blocks = blocks.filter(function (b) { return b.id !== action.targetId; });
        return;
      case ACTIONS.APPLY_THEME:
        applyThemeAction(action);
        return;
      case ACTIONS.REPLACE_BLOCK_TREE:
        blocks = buildBlocksFromRawList(action.blocks, createdTabLabels);
        return;
      default:
        throw new Error("Bilinmeyen aksiyon türü (uygulama anında): " + action.action);
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  Genel API — Snapshot / Restore / validateAndApplyPatch
  // ────────────────────────────────────────────────────────────────────

  /**
   * O anki kanvas durumunun derin bir kopyasını (snapshot) alır. Rollback
   * için kullanılır; ayrıca "geri al" (undo) benzeri özellikler için de
   * yeniden kullanılabilir, bağımsız bir fonksiyondur.
   * @returns {Object} Serileştirilebilir bir state snapshot'ı.
   */
  function snapshot() {
    return {
      blocks: JSON.parse(JSON.stringify(blocks || [])),
      projectTabs: (typeof projectTabs !== "undefined") ? JSON.parse(JSON.stringify(projectTabs)) : null,
      canvasViewTab: (typeof canvasViewTab !== "undefined") ? canvasViewTab : null,
      themeName: (typeof themeSelect !== "undefined" && themeSelect) ? themeSelect.value : null,
      themeColor: (typeof themeColorInput !== "undefined" && themeColorInput) ? themeColorInput.value : null
    };
  }

  /**
   * Daha önce `snapshot()` ile alınmış bir durumu canlı state'e geri yükler
   * ve kanvası yeniden çizer. Rollback'in tek giriş noktasıdır.
   * @param {Object} snap - `snapshot()`'ın döndürdüğü nesne.
   */
  function restore(snap) {
    if (!snap) return;
    blocks = snap.blocks;
    if (snap.projectTabs && typeof projectTabs !== "undefined") projectTabs = snap.projectTabs;
    if (snap.canvasViewTab !== null && typeof canvasViewTab !== "undefined") canvasViewTab = snap.canvasViewTab;
    if (snap.themeName !== null && typeof themeSelect !== "undefined" && themeSelect) {
      themeSelect.value = snap.themeName;
      if (typeof applyTheme === "function") applyTheme(snap.themeName);
    }
    if (snap.themeColor !== null && typeof themeColorInput !== "undefined" && themeColorInput) {
      themeColorInput.value = snap.themeColor;
    }
    rerender();
  }

  /** Ortak son adım: seçim state'ini temizler, sekme çubuğunu ve kanvası yeniden çizer. */
  function rerender() {
    if (typeof activeBlockId !== "undefined") activeBlockId = null;
    if (typeof focusedBlockId !== "undefined") focusedBlockId = null;
    if (typeof rebuildCanvasTabsUi === "function") rebuildCanvasTabsUi();
    if (typeof renderAll === "function") renderAll();
  }

  /**
   * Bir ActionPatch listesini İKİ FAZLI olarak doğrular ve uygular.
   *
   * @param {Array<Object>} actions - AI/otomasyon katmanının ürettiği aksiyon listesi.
   * @param {{themeNames?: string[]}} [opts] - Çağıran taraf, geçerli tema adları
   *        listesini (kendi uygulamasına özel olduğu için) burada verebilir.
   * @returns {{ok: true, appliedCount: number, createdTabLabels: string[]} |
   *           {ok: false, error: string, failedActionIndex?: number, action?: Object, rolledBack?: boolean}}
   *          Başarı durumunda `ok:true`; herhangi bir doğrulama/uygulama
   *          hatasında `ok:false` + açıklayıcı `error` metni döner. `ok:false`
   *          durumunda kanvas HER ZAMAN çağrı öncesindeki haliyle bırakılır
   *          (ya FAZ 1'de hiç dokunulmamıştır, ya da FAZ 2'de rollback yapılmıştır).
   */
  function validateAndApplyPatch(actions, opts) {
    opts = opts || {};
    if (!Array.isArray(actions) || !actions.length) {
      return { ok: false, error: "Patch listesi boş ya da bir dizi değil." };
    }

    // FAZ 1: salt okunur doğrulama — hiçbir şey mutasyona uğramaz.
    var liveIds = liveIdMap();
    for (var i = 0; i < actions.length; i++) {
      var err = validateAction(actions[i], liveIds, opts);
      if (err) {
        return { ok: false, error: err, failedActionIndex: i, action: actions[i] };
      }
    }

    // FAZ 2: tüm aksiyonlar geçerli -> snapshot al, sırayla uygula.
    var snap = snapshot();
    var createdTabLabels = [];
    try {
      for (var j = 0; j < actions.length; j++) {
        applyOneAction(actions[j], createdTabLabels);
      }
      rerender();
      return { ok: true, appliedCount: actions.length, createdTabLabels: createdTabLabels };
    } catch (e) {
      restore(snap); // ROLLBACK — kanvas işlem öncesi haline döner
      return {
        ok: false,
        rolledBack: true,
        error: "Uygulama sırasında beklenmeyen bir hata oluştu, tüm değişiklikler geri alındı: " +
          (e && e.message ? e.message : String(e))
      };
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  Dışa aktarım
  // ────────────────────────────────────────────────────────────────────
  global.CanvasActionRunner = {
    ACTIONS: ACTIONS,
    snapshot: snapshot,
    restore: restore,
    validateAndApplyPatch: validateAndApplyPatch
  };

})(window);