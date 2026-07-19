"use strict";
/* ═══════════════════════════════════════════════════════════
   10) PROJE KAYDET/YÜKLE + HAZIR ŞABLONLAR
   Bu dosya, app.js'nin bölünmesiyle oluşturulmuştur.
   Diğer js/*.js dosyalarıyla aynı global scope'u paylaşır
   (module DEĞİLDİR) — bu yüzden index.html'deki script sırası önemlidir.
   ═══════════════════════════════════════════════════════════ */
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

  // Daha önce "HTML Oluştur" ile dışa aktarılmış bir index.html dosyasını
  // tekrar yükleyip düzenlemeye devam edebilmek için: export sırasında
  // sayfanın <head> içine gizlenen JSON veriyi okuyup geri yüklüyoruz.
  const loadHtmlInput = $("#loadHtmlInput");
  $("#btnLoadHtml").addEventListener("click", () => loadHtmlInput.click());
  loadHtmlInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const html = evt.target.result;
        const m = html.match(/<script type="application\/json" id="ders-builder-data">([\s\S]*?)<\/script>/);
        if (!m) throw new Error("Bu dosyada düzenleme verisi bulunamadı");
        const data = JSON.parse(m[1]);
        if (Array.isArray(data.blocks)) {
          blocks = data.blocks;
          seq = data.seq || blocks.length;
          activeBlockId = null;
          renderAll();
          toast("Ders HTML dosyasından yüklendi, düzenlemeye devam edebilirsiniz ✓");
        } else {
          throw new Error("Geçersiz şema");
        }
      } catch (err) {
        toast("Bu HTML dosyası bu araçla oluşturulmamış ya da bozulmuş, yüklenemedi.", "err");
      }
    };
    reader.readAsText(file);
    loadHtmlInput.value = "";
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
