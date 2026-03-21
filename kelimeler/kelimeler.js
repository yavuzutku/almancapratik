import { getWords, deleteWord, updateWord, onAuthChange } from "../js/firebase.js";
import { showLemmaHintOnce } from '../src/components/lemmaHint.js';
import { renderTagChips, getSelectedTags, extractAllTags } from "../js/tag.js";

let allWords        = [];
let activeTagFilter = null;
const exampleCache  = new Map();

/* ═══════════════════════════════════════════════════════════
   GÜVENLİK: HTML ESCAPE
   ═══════════════════════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ═══════════════════════════════════════════════════════════
   ÇOKLU ANLAM YARDIMCILARI
   meanings dizisi yoksa meaning string'inden oluştur (geriye dönük uyumluluk)
   ═══════════════════════════════════════════════════════════ */
function getMeanings(item) {
  if (Array.isArray(item.meanings) && item.meanings.length > 0) return item.meanings;
  if (item.meaning) return [item.meaning];
  return [];
}

function primaryMeaning(item) {
  return getMeanings(item)[0] || "";
}

function extraMeanings(item) {
  return getMeanings(item).slice(1);
}

/* ─── Wikitext temizleyici ─────────────────────────────── */
function wordCount(text) { return text.trim().split(/\s+/).length; }

function cleanWikitext(text) {
  return text
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\}\}/g, "").replace(/\{\{/g, "")
    .replace(/'{2,3}/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/[„""‟«»'']/g, "")
    .replace(/\s*[A-ZÄÖÜ][^.!?]*\d{4}\s*\.?\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* ─── Wiktionary örnek cümleler ───────────────────────── */
async function fetchFromWiktionary(word) {
  const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
  const params = new URLSearchParams({ action: "parse", page: capitalized, prop: "wikitext", format: "json", origin: "*" });
  const res  = await fetch("https://de.wiktionary.org/w/api.php?" + params);
  const data = await res.json();
  const wikitext = data?.parse?.wikitext?.["*"] || "";
  const lines = wikitext.split("\n");
  const sentences = [];
  let inBeispiele = false;
  for (const line of lines) {
    if (line.includes("Beispiele}}") || line.includes("Beispiele:")) { inBeispiele = true; continue; }
    if (inBeispiele && line.match(/^\s*:?\{\{(Herkunft|Synonyme|Übersetzungen|Wortbildungen|Bedeutungen|Redewendungen)/)) { inBeispiele = false; continue; }
    if (inBeispiele && line.trim()) {
      const match = line.match(/^::?\[\d+\]\s*(.+)/);
      if (match) {
        const text = cleanWikitext(match[1]);
        if (text.length > 10 && wordCount(text) > 5) sentences.push(text);
      }
    }
  }
  return sentences.sort((a, b) => wordCount(a) - wordCount(b)).slice(0, 2).map(s => ({ original: s, turkish: null }));
}

async function fetchFromTatoeba(word) {
  const url = `https://api.tatoeba.org/v1/sentences?q=${encodeURIComponent(word)}&lang=deu&min_length=6`;
  const res  = await fetch(url);
  const data = await res.json();
  if (!data.data || data.data.length === 0) return [];
  return data.data.filter(s => wordCount(s.text) > 5).sort((a, b) => wordCount(a.text) - wordCount(b.text)).slice(0, 2).map(s => ({ original: s.text, turkish: null }));
}

async function fetchExampleSentences(word) {
  if (exampleCache.has(word)) return exampleCache.get(word);
  let sentences = [];
  try { sentences = await fetchFromWiktionary(word); } catch (_) {}
  if (sentences.length < 2) {
    try {
      const tatoeba = await fetchFromTatoeba(word);
      sentences = [...sentences, ...tatoeba.slice(0, 2 - sentences.length)];
    } catch (_) {}
  }
  if (sentences.length === 0) sentences = [{ original: "Cümle bulunamadı.", turkish: "Bu kelime için örnek yok." }];
  exampleCache.set(word, sentences);
  return sentences;
}

/* ════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {

  const wordList       = document.getElementById("wordList");
  const emptyState     = document.getElementById("emptyState");
  const wordCountBadge = document.getElementById("wordCountBadge");
  const searchInput    = document.getElementById("searchInput");
  const filterTagList  = document.getElementById("filterTagList");

  function showError(msg) {
    wordCountBadge.textContent = "Hata";
    wordList.innerHTML = `<div style="padding:24px;border-radius:12px;background:rgba(224,82,82,0.08);border:1px solid rgba(224,82,82,0.2);color:#e05252;font-size:14px;text-align:center;">⚠️ ${escapeHtml(msg)}</div>`;
  }

  onAuthChange(async (user) => {
    if (user) await loadWords(user.uid);
  });

  async function loadWords(userId) {
    wordCountBadge.textContent = "Yükleniyor...";
    try {
      allWords = await getWords(userId);
      buildFilterSidebar();
      renderFiltered();
    } catch (err) {
      showError(err.message);
    }
  }

  /* ─── Filtre Sidebar ─────────────────────────────────── */
  function buildFilterSidebar() {
    const tagMap = new Map();
    allWords.forEach(w => {
      if (Array.isArray(w.tags)) w.tags.forEach(t => tagMap.set(t, (tagMap.get(t) || 0) + 1));
    });
    filterTagList.innerHTML = "";

    const allItem = document.createElement("button");
    allItem.className = "filter-tag-item all-item" + (activeTagFilter === null ? " active" : "");
    allItem.innerHTML = `<span>Tüm Kelimeler</span><span class="filter-count-badge">${allWords.length}</span>`;
    allItem.addEventListener("click", () => { activeTagFilter = null; buildFilterSidebar(); renderFiltered(); });
    filterTagList.appendChild(allItem);

    if (tagMap.size > 0) {
      [...tagMap.entries()].sort((a, b) => b[1] - a[1]).forEach(([tag, count]) => {
        const item = document.createElement("button");
        item.className = "filter-tag-item" + (activeTagFilter === tag ? " active" : "");
        item.innerHTML = `<span>${escapeHtml(tag)}</span><span class="filter-count-badge">${count}</span>`;
        item.addEventListener("click", () => {
          activeTagFilter = (activeTagFilter === tag) ? null : tag;
          buildFilterSidebar(); renderFiltered();
        });
        filterTagList.appendChild(item);
      });
    }

    const untagged = allWords.filter(w => !Array.isArray(w.tags) || w.tags.length === 0).length;
    if (untagged > 0) {
      const sep = document.createElement("div");
      sep.style.cssText = "margin:10px 0 6px;border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;";
      const untaggedItem = document.createElement("button");
      untaggedItem.className = "filter-tag-item" + (activeTagFilter === "__untagged__" ? " active" : "");
      untaggedItem.innerHTML = `<span>Etiketsiz</span><span class="filter-count-badge">${untagged}</span>`;
      untaggedItem.addEventListener("click", () => {
        activeTagFilter = (activeTagFilter === "__untagged__") ? null : "__untagged__";
        buildFilterSidebar(); renderFiltered();
      });
      filterTagList.appendChild(sep);
      filterTagList.appendChild(untaggedItem);
    }
  }

  function renderFiltered() {
    const q = searchInput.value.toLowerCase();
    let list = allWords;
    if (activeTagFilter === "__untagged__") {
      list = list.filter(w => !Array.isArray(w.tags) || w.tags.length === 0);
    } else if (activeTagFilter) {
      list = list.filter(w => Array.isArray(w.tags) && w.tags.includes(activeTagFilter));
    }
    if (q) list = list.filter(w => {
      const allM = getMeanings(w).join(" ").toLowerCase();
      return w.word.toLowerCase().includes(q) || allM.includes(q);
    });
    render(list);
  }

  /* ─── Render ─────────────────────────────────────────── */
  function render(list) {
    [...wordList.querySelectorAll(".word-card")].forEach(el => el.remove());
    wordCountBadge.textContent = allWords.length + " kelime";
    if (list.length === 0) { emptyState.style.display = "block"; return; }
    emptyState.style.display = "none";

    list.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "word-card";
      card.style.animationDelay = (idx * 30) + "ms";

      /* Sol: kelime + anlamlar */
      const leftDiv = document.createElement("div");
      leftDiv.className = "word-left";

      /* Almanca kelime → örnek cümle modali */
      const germanEl = document.createElement("div");
      germanEl.className = "word-german";
      germanEl.textContent = item.word;
      germanEl.style.cursor = "pointer";
      germanEl.title = "Örnek cümleleri gör";
      germanEl.addEventListener("click", e => { e.stopPropagation(); openExampleModal(item.word, primaryMeaning(item)); });

      /* Ana anlam */
      const turkishEl = document.createElement("div");
      turkishEl.className = "word-turkish";
      turkishEl.textContent = primaryMeaning(item);

      /* Ek anlamlar */
      const extrasDiv = buildExtraMeaningsRow(item);

      /* Etiketler */
      const tagsDiv = document.createElement("div");
      tagsDiv.className = "word-tags";
      const hasTags = Array.isArray(item.tags) && item.tags.length > 0;
      if (hasTags) {
        item.tags.forEach(t => {
          const badge = document.createElement("span");
          badge.className = "word-tag-badge";
          badge.textContent = t;
          tagsDiv.appendChild(badge);
        });
      }
      const addTagBtn = document.createElement("button");
      addTagBtn.className = "add-tag-inline";
      addTagBtn.textContent = hasTags ? "+ etiket" : "+ etiket ekle";
      addTagBtn.addEventListener("click", () => {
        const userId = window.getUserId();
        if (!userId) return;
        openEditModal(userId, item, "tags");
      });
      tagsDiv.appendChild(addTagBtn);

      const dateEl = document.createElement("div");
      dateEl.className = "word-date";
      dateEl.textContent = formatDate(item.date);

      leftDiv.appendChild(germanEl);
      leftDiv.appendChild(turkishEl);
      leftDiv.appendChild(extrasDiv);
      leftDiv.appendChild(tagsDiv);
      leftDiv.appendChild(dateEl);

      /* Sağ: butonlar */
      const rightDiv = document.createElement("div");
      rightDiv.className = "word-right";

      /* Anlam ekle butonu */
      const addMeaningBtn = document.createElement("button");
      addMeaningBtn.className = "word-meaning-btn";
      addMeaningBtn.textContent = "+ Anlam";
      addMeaningBtn.title = "Ek anlam ekle";
      addMeaningBtn.addEventListener("click", () => {
        const userId = window.getUserId();
        if (!userId) return;
        openEditModal(userId, item, "meanings");
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "word-delete-btn";
      deleteBtn.textContent = "🗑 Sil";
      deleteBtn.addEventListener("click", async () => {
        const userId = window.getUserId();
        if (!userId) return;
        if (!confirm(`"${item.word}" silinsin mi?`)) return;
        try {
          await deleteWord(userId, item.id);
          allWords = allWords.filter(w => w.id !== item.id);
          buildFilterSidebar(); renderFiltered();
        } catch (err) { alert("Silme hatası: " + err.message); }
      });

      const editBtn = document.createElement("button");
      editBtn.className = "word-edit-btn";
      editBtn.textContent = "✏️ Düzenle";
      editBtn.addEventListener("click", () => {
        const userId = window.getUserId();
        if (!userId) return;
        openEditModal(userId, item, "word");
      });

      rightDiv.appendChild(addMeaningBtn);
      rightDiv.appendChild(editBtn);
      rightDiv.appendChild(deleteBtn);

      card.appendChild(leftDiv);
      card.appendChild(rightDiv);
      wordList.appendChild(card);
    });
  }

  /* ─── Ek anlamlar satırı ───────────────────────────── */
  function buildExtraMeaningsRow(item) {
    const extras = extraMeanings(item);
    const row = document.createElement("div");
    row.className = "word-extra-meanings";
    if (!extras.length) return row;

    extras.forEach(m => {
      const chip = document.createElement("span");
      chip.className = "meaning-chip";
      chip.textContent = m;
      row.appendChild(chip);
    });
    return row;
  }

  /* ═══════════════════════════════════════════════════════
     DÜZENLEME MODALİ
     mode: "word" | "tags" | "meanings"
     ═══════════════════════════════════════════════════════ */
  function openEditModal(userId, item, mode = "word") {
    document.getElementById("editModalOverlay")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "editModalOverlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:10000;display:flex;align-items:center;justify-content:center;";

    overlay.innerHTML = `
      <div class="edit-modal-box">
        <div class="edit-modal-header">
          <span id="_modalTitle"></span>
          <button id="editModalClose" class="edit-modal-close">✕</button>
        </div>

        <!-- WORD MODE -->
        <div id="_wordFields" style="display:none">
          <label class="edit-label">Kelime</label>
          <div id="editLemmaMount"></div>
          <input id="editWordInput" class="edit-input" spellcheck="false"/>
          <label class="edit-label" style="margin-top:12px">Anlam</label>
          <input id="editMeaningInput" class="edit-input" spellcheck="false"/>
        </div>

        <!-- MEANINGS MODE -->
        <div id="_meaningsFields" style="display:none">
          <div class="edit-modal-word-preview" id="_meaningsWordPreview"></div>
          <div class="meanings-section-label">Anlamlar</div>
          <div id="meaningsList" class="meanings-list"></div>
          <div class="meanings-add-row">
            <input id="newMeaningInput" class="edit-input meanings-new-input" placeholder="Yeni anlam ekle…" spellcheck="false"/>
            <button id="addMeaningBtn" class="meanings-add-btn">+ Ekle</button>
          </div>
        </div>

        <!-- TAGS MODE -->
        <div id="_tagPreview" style="display:none">
          <div id="_tagPreviewWord" class="edit-modal-word-preview"></div>
        </div>

        <label class="edit-label" style="margin-top:16px">Etiketler</label>
        <div id="editTagChips" class="edit-tag-chips"></div>

        <div class="edit-modal-actions">
          <button id="editCancelBtn" class="edit-cancel-btn">İptal</button>
          <button id="editSaveBtn" class="edit-save-btn">Kaydet ✓</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    /* ── Başlık ve mode ── */
    const titleMap = { word: "✏️ Kelimeyi Düzenle", tags: "🏷️ Etiket Düzenle", meanings: "📖 Anlamları Düzenle" };
    overlay.querySelector("#_modalTitle").textContent = titleMap[mode] || "✏️ Düzenle";

    /* ── Anlamlar state ── */
    let currentMeanings = getMeanings(item).slice();

    if (mode === "word") {
      overlay.querySelector("#_wordFields").style.display = "block";
      overlay.querySelector("#editWordInput").value    = item.word;
      overlay.querySelector("#editMeaningInput").value = primaryMeaning(item);
      const mountEl = overlay.querySelector("#editLemmaMount");
      if (mountEl && item.word) {
        showLemmaHintOnce({ word: item.word, mountEl, onApply: lemma => {
          overlay.querySelector("#editWordInput").value = lemma;
          mountEl.innerHTML = "";
        }});
      }
    } else if (mode === "meanings") {
      overlay.querySelector("#_meaningsFields").style.display = "block";
      const preview = overlay.querySelector("#_meaningsWordPreview");
      preview.textContent = item.word;
      renderMeaningsList();
    } else if (mode === "tags") {
      overlay.querySelector("#_tagPreview").style.display = "block";
      const previewWord = overlay.querySelector("#_tagPreviewWord");
      previewWord.textContent = `${item.word}  —  ${primaryMeaning(item)}`;
    }

    renderTagChips("editTagChips", item.tags || [], extractAllTags(allWords));

    /* ── Anlamlar listesini render ── */
    function renderMeaningsList() {
      const container = overlay.querySelector("#meaningsList");
      if (!container) return;
      container.innerHTML = "";
      currentMeanings.forEach((m, i) => {
        const row = document.createElement("div");
        row.className = "meaning-row" + (i === 0 ? " meaning-row--primary" : "");

        const badge = document.createElement("span");
        badge.className = "meaning-index-badge";
        badge.textContent = i === 0 ? "Ana" : `${i + 1}.`;

        const text = document.createElement("span");
        text.className = "meaning-row-text";
        text.textContent = m;

        const actions = document.createElement("div");
        actions.className = "meaning-row-actions";

        /* Yukarı taşı */
        if (i > 0) {
          const upBtn = document.createElement("button");
          upBtn.className = "meaning-action-btn";
          upBtn.title = "Ana anlam yap";
          upBtn.textContent = "↑";
          upBtn.addEventListener("click", () => {
            currentMeanings.splice(i, 1);
            currentMeanings.unshift(m);
            renderMeaningsList();
          });
          actions.appendChild(upBtn);
        }

        /* Düzenle */
        const editBtn = document.createElement("button");
        editBtn.className = "meaning-action-btn";
        editBtn.title = "Düzenle";
        editBtn.textContent = "✎";
        editBtn.addEventListener("click", () => {
          const newVal = prompt("Anlamı düzenle:", m);
          if (newVal && newVal.trim()) {
            currentMeanings[i] = newVal.trim();
            renderMeaningsList();
          }
        });
        actions.appendChild(editBtn);

        /* Sil */
        if (currentMeanings.length > 1) {
          const delBtn = document.createElement("button");
          delBtn.className = "meaning-action-btn meaning-action-btn--del";
          delBtn.title = "Kaldır";
          delBtn.textContent = "✕";
          delBtn.addEventListener("click", () => {
            currentMeanings.splice(i, 1);
            renderMeaningsList();
          });
          actions.appendChild(delBtn);
        }

        row.appendChild(badge);
        row.appendChild(text);
        row.appendChild(actions);
        container.appendChild(row);
      });
    }

    /* ── Yeni anlam ekle ── */
    overlay.querySelector("#addMeaningBtn")?.addEventListener("click", () => {
      const inp = overlay.querySelector("#newMeaningInput");
      const val = inp?.value.trim();
      if (!val) { inp?.focus(); return; }
      if (!currentMeanings.includes(val)) {
        currentMeanings.push(val);
        renderMeaningsList();
      }
      if (inp) inp.value = "";
    });
    overlay.querySelector("#newMeaningInput")?.addEventListener("keydown", e => {
      if (e.key === "Enter") overlay.querySelector("#addMeaningBtn")?.click();
    });

    /* ── Kapat ── */
    const close = () => overlay.remove();
    overlay.querySelector("#editModalClose").addEventListener("click", close);
    overlay.querySelector("#editCancelBtn").addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });

    /* ── Kaydet ── */
    overlay.querySelector("#editSaveBtn").addEventListener("click", async () => {
      let newWord, newMeaning;

      if (mode === "word") {
        newWord    = overlay.querySelector("#editWordInput").value.trim();
        newMeaning = overlay.querySelector("#editMeaningInput").value.trim();
        if (!newWord || !newMeaning) return;
        /* word modunda sadece ilk anlamı güncelle */
        currentMeanings = getMeanings(item).slice();
        currentMeanings[0] = newMeaning;
      } else if (mode === "meanings") {
        newWord    = item.word;
        newMeaning = currentMeanings[0] || item.meaning;
      } else {
        newWord    = item.word;
        newMeaning = primaryMeaning(item);
        currentMeanings = getMeanings(item).slice();
      }

      const newTags = getSelectedTags("editTagChips");
      const saveBtn = overlay.querySelector("#editSaveBtn");
      saveBtn.disabled    = true;
      saveBtn.textContent = "Kaydediliyor...";

      try {
        await updateWord(userId, item.id, {
          word:     newWord,
          meaning:  currentMeanings[0] || newMeaning,
          meanings: currentMeanings,
          tags:     newTags,
        });
        item.word     = newWord;
        item.meaning  = currentMeanings[0] || newMeaning;
        item.meanings = currentMeanings;
        item.tags     = newTags;
        close();
        buildFilterSidebar();
        renderFiltered();
      } catch (err) {
        saveBtn.disabled    = false;
        saveBtn.textContent = "Kaydet ✓";
        alert("Güncelleme hatası: " + err.message);
      }
    });

    /* Odak */
    setTimeout(() => {
      const first = overlay.querySelector(".edit-input, #newMeaningInput");
      first?.focus();
    }, 60);
  }

  /* ─── Arama ──────────────────────────────────────────── */
  searchInput.addEventListener("input", renderFiltered);

  function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  }

  /* ═══════════════════════════════════════════════════════
     ÖRNEK CÜMLE MODALİ
     ═══════════════════════════════════════════════════════ */
  async function openExampleModal(word, meaning) {
    document.getElementById("exampleModalOverlay")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "exampleModalOverlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;";

    overlay.innerHTML = `
      <div style="background:#1a1a26;border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:28px 32px;width:480px;max-width:100%;box-shadow:0 24px 60px rgba(0,0,0,0.7);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
          <div>
            <div id="_exWord" style="font-size:20px;font-weight:700;color:#e2e8f0;"></div>
            <div id="_exMeaning" style="font-size:13px;color:#c9a84c;margin-top:3px;"></div>
          </div>
          <button id="exampleModalClose" style="background:none;border:none;color:#666;font-size:18px;cursor:pointer;padding:0 0 0 12px;">✕</button>
        </div>
        <div style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">💬 Örnek Cümleler</div>
        <div id="exampleSentences" style="display:flex;flex-direction:column;gap:10px;">
          <div style="padding:14px 16px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);color:#888;font-size:14px;text-align:center;">⏳ Yükleniyor...</div>
        </div>
        <div style="margin-top:14px;font-size:11px;color:#3a3a3a;text-align:right;">Kaynak: Wiktionary · Tatoeba</div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector("#_exWord").textContent    = word;
    overlay.querySelector("#_exMeaning").textContent = meaning;
    overlay.querySelector("#exampleModalClose").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });

    const sentences = await fetchExampleSentences(word);
    const container = document.getElementById("exampleSentences");
    if (!container) return;
    container.innerHTML = sentences.map((s, i) => `
      <div style="padding:14px 16px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:11px;color:#c9a84c;font-weight:700;margin-bottom:6px;">${i + 1}. Cümle</div>
        <div style="font-size:15px;color:#e2e8f0;line-height:1.6;">${escapeHtml(s.original)}</div>
      </div>
    `).join("");
  }

});