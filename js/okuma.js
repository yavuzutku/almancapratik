import { saveWord } from "./firebase.js";

document.addEventListener("DOMContentLoaded", ()=>{

  const text = sessionStorage.getItem("savedText");
  const reader = document.getElementById("readerText");

  if(!text || text.trim().length < 1){
    reader.innerHTML = "<h2>Metin Bulunamadı</h2>";
    return;
  }

  loadText(text);
  createTranslateUI();
  initModalTagChips();

  document.getElementById("modalMeaningInput")
    .addEventListener("keydown", (e) => {
      if(e.key === "Enter") saveWordFromModal();
    });
});

function goBack(){
  const returnPage = sessionStorage.getItem("returnPage") || "metin.html";
  sessionStorage.removeItem("returnPage");
  window.location.href = returnPage;
}

let currentSize = 20;

function increaseFont(){
  currentSize += 2;
  document.getElementById("readerText").style.fontSize = currentSize + "px";
}

function decreaseFont(){
  currentSize = Math.max(12, currentSize - 2);
  document.getElementById("readerText").style.fontSize = currentSize + "px";
}

function toggleDark(){
  document.body.classList.toggle("light-mode");
}

const readerText = document.getElementById("readerText");

function loadText(text) {
  readerText.innerText = text;
}

window.goBack             = goBack;
window.increaseFont       = increaseFont;
window.decreaseFont       = decreaseFont;
window.toggleDark         = toggleDark;
window.openAddWordModal   = openAddWordModal;
window.closeAddWordModal  = closeAddWordModal;
window.saveWordFromModal  = saveWordFromModal;
window.closeMiniTranslate = closeMiniTranslate;
window.saveWordFromPopup  = saveWordFromPopup;


// =====================
// MODAL TAG CHİPS
// =====================

function initModalTagChips(){
  document.querySelectorAll("#modalTagChips .tag-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
    });
  });
}

function getSelectedModalTags(){
  return [...document.querySelectorAll("#modalTagChips .tag-chip.selected")]
    .map(c => c.dataset.tag);
}

function resetModalTags(){
  document.querySelectorAll("#modalTagChips .tag-chip")
    .forEach(c => c.classList.remove("selected"));
}


// =====================
// ÇEVIRI POPUP SİSTEMİ
// =====================

let selectedWordGlobal = "";

function createTranslateUI(){

  const btn = document.createElement("button");
  btn.id = "floatingMeaningBtn";
  btn.innerText = "💬 Anlam";
  btn.style.cssText = `
    display: none;
    position: absolute;
    z-index: 9999;
    padding: 6px 12px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  `;
  btn.onclick = openMiniTranslate;
  document.body.appendChild(btn);

  const popup = document.createElement("div");
  popup.id = "miniTranslatePopup";
  popup.style.cssText = `
    display: none;
    position: absolute;
    z-index: 9999;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px;
    min-width: 200px;
    max-width: 280px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    font-size: 14px;
    color: #1e293b;
  `;
  document.body.appendChild(popup);

  readerText.addEventListener("mouseup", function(){
    const selectionObj = window.getSelection();
    if(!selectionObj || selectionObj.rangeCount === 0){
      btn.style.display = "none";
      return;
    }
    let selection = selectionObj.toString().trim();
    selection = selection.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
    if(selection.length === 0){
      btn.style.display = "none";
      return;
    }
    selectedWordGlobal = selection;
    const range = selectionObj.getRangeAt(0);
    const rect  = range.getBoundingClientRect();
    if(!rect || rect.width === 0){
      btn.style.display = "none";
      return;
    }
    popup.style.display = "none";
    btn.style.display   = "block";
    btn.style.top  = (window.scrollY + rect.bottom + 8) + "px";
    btn.style.left = (window.scrollX + rect.left) + "px";
  });

  document.addEventListener("mousedown", function(e){
    const leftToolbar      = document.querySelector(".left-toolbar");
    const wordModalOverlay = document.getElementById("wordModalOverlay");

    const clickedInside =
      readerText.contains(e.target)     ||
      btn.contains(e.target)            ||
      popup.contains(e.target)          ||
      (leftToolbar && leftToolbar.contains(e.target))  ||
      (wordModalOverlay && wordModalOverlay.contains(e.target));

    if(!clickedInside){
      btn.style.display   = "none";
      popup.style.display = "none";
      window.getSelection().removeAllRanges();
      selectedWordGlobal  = "";
    }
  });
}

// Popup'ta kullanılan seçili tag'leri tutmak için
let _popupSelectedTags = [];

function openMiniTranslate(){
  const btn   = document.getElementById("floatingMeaningBtn");
  const popup = document.getElementById("miniTranslatePopup");
  btn.style.display   = "none";
  popup.style.display = "block";
  popup.style.top  = btn.style.top;
  popup.style.left = btn.style.left;
  popup.innerHTML  = "⏳ Çevriliyor...";
  _popupSelectedTags = [];

  const TAG_OPTIONS = ["fiil","isim","sıfat","zarf","B1","B2","seyahat","iş"];

  fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=tr&dt=t&q=${encodeURIComponent(selectedWordGlobal)}`)
    .then(res => res.json())
    .then(data => {
      const translated = data[0][0][0];
      window._lastTranslated = translated;

      const chipsHTML = TAG_OPTIONS.map(tag =>
        `<button
          type="button"
          class="popup-tag-chip"
          data-tag="${tag}"
          onclick="togglePopupTag(this)"
          style="
            padding:3px 9px;
            border-radius:20px;
            border:1px solid #cbd5e1;
            background:white;
            color:#64748b;
            font-size:11px;
            cursor:pointer;
            transition:0.15s;
          "
        >${tag}</button>`
      ).join("");

      popup.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-weight:700;color:#3b82f6;font-size:15px;">${selectedWordGlobal}</span>
          <button onclick="closeMiniTranslate()" style="background:none;border:none;cursor:pointer;font-size:16px;color:#94a3b8;">✕</button>
        </div>
        <div style="color:#334155;margin-bottom:10px;">${translated}</div>
        <div style="margin-bottom:10px;">
          <div style="font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Etiket (opsiyonel)</div>
          <div style="display:flex;flex-wrap:wrap;gap:5px;">${chipsHTML}</div>
        </div>
        <button
          id="popupSaveBtn"
          onclick="saveWordFromPopup()"
          style="
            width:100%;
            padding:7px 0;
            background:#3b82f6;
            color:white;
            border:none;
            border-radius:8px;
            font-size:13px;
            font-weight:600;
            cursor:pointer;
          "
        >➕ Sözlüğe Ekle</button>
      `;
    })
    .catch(() => {
      popup.innerHTML = `<span style="color:red;">Çeviri başarısız oldu.</span>`;
    });
}

window.togglePopupTag = function(el){
  const tag = el.dataset.tag;
  const isSelected = _popupSelectedTags.includes(tag);
  if(isSelected){
    _popupSelectedTags = _popupSelectedTags.filter(t => t !== tag);
    el.style.background = "white";
    el.style.color      = "#64748b";
    el.style.borderColor = "#cbd5e1";
    el.style.fontWeight  = "400";
  } else {
    _popupSelectedTags.push(tag);
    el.style.background  = "#3b82f6";
    el.style.color       = "white";
    el.style.borderColor = "#3b82f6";
    el.style.fontWeight  = "700";
  }
};

function closeMiniTranslate(){
  document.getElementById("miniTranslatePopup").style.display = "none";
  selectedWordGlobal   = "";
  _popupSelectedTags   = [];
}

async function saveWordFromPopup(){
  const word    = selectedWordGlobal;
  const meaning = window._lastTranslated;

  if(!word || !meaning){
    showToast("❌ Kelime veya çeviri bulunamadı.", true);
    return;
  }

  const saveBtn = document.getElementById("popupSaveBtn");
  if(saveBtn){
    saveBtn.disabled    = true;
    saveBtn.textContent = "Kaydediliyor...";
  }

  try {
    const userId = window.getUserId();
    if(!userId) throw new Error("Oturum yok");

    await saveWord(userId, word, meaning, _popupSelectedTags);
    closeMiniTranslate();
    window._lastTranslated = "";
    showToast("✅ Kelime kaydedildi!");

  } catch(err){
    console.error("Kelime kayıt hatası:", err);
    showToast("❌ Kayıt başarısız.", true);
    if(saveBtn){
      saveBtn.disabled    = false;
      saveBtn.textContent = "➕ Sözlüğe Ekle";
    }
  }
}


// =====================
// KELİME EKLEME (MANUEL MODAL)
// =====================

function openAddWordModal(){
  if(!selectedWordGlobal){
    alert("Önce metinden bir kelime seç.");
    return;
  }
  document.getElementById("modalWordDisplay").textContent = selectedWordGlobal;
  document.getElementById("modalMeaningInput").value      = "";
  resetModalTags();
  document.getElementById("wordModalOverlay").classList.add("active");
  setTimeout(() => document.getElementById("modalMeaningInput").focus(), 100);
}

function closeAddWordModal(){
  document.getElementById("wordModalOverlay").classList.remove("active");
  resetModalTags();
}

async function saveWordFromModal(){
  const meaning = document.getElementById("modalMeaningInput").value.trim();
  if(!meaning){
    document.getElementById("modalMeaningInput").focus();
    return;
  }

  const tags    = getSelectedModalTags();
  const saveBtn = document.querySelector(".word-modal-save");
  saveBtn.disabled    = true;
  saveBtn.textContent = "Kaydediliyor...";

  try {
    const userId = window.getUserId();
    if(!userId) throw new Error("Oturum yok");

    await saveWord(userId, selectedWordGlobal, meaning, tags);

    closeAddWordModal();
    selectedWordGlobal = "";
    showToast("✅ Kelime kaydedildi!");

  } catch(err) {
    console.error("Kelime kayıt hatası:", err);
    showToast("❌ Kayıt başarısız.", true);
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = "Kaydet ✓";
  }
}

function showToast(msg, isError = false){
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: ${isError ? "#ef4444" : "#22c55e"};
    color: white;
    padding: 10px 22px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    z-index: 99999;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}