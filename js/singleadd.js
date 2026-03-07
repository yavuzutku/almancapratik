import { auth, getWords, saveWord } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ── DOM ── */
const backBtn       = document.getElementById("backBtn");
const stepWord      = document.getElementById("stepWord");
const stepMeaning   = document.getElementById("stepMeaning");
const wordInput     = document.getElementById("wordInput");
const wordNextBtn   = document.getElementById("wordNextBtn");
const wordPreview   = document.getElementById("wordPreview");
const meaningInput  = document.getElementById("meaningInput");
const saveBtn       = document.getElementById("saveBtn");
const statusMsg     = document.getElementById("statusMsg");
const translateHint = document.getElementById("translateHint");
const hintText      = document.getElementById("hintText");

let currentUser = null;

/* ── AUTH ── */
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

/* ── GERİ BUTONU ── */
backBtn.addEventListener("click", () => {
  window.location.href = "wordsadd.html";
});

/* ── URL'İ YAZARKEN GÜNCELLE (Google Translate tarzı) ── */
wordInput.addEventListener("input", () => {
  const val = wordInput.value.trim();
  const newUrl = new URL(window.location.href);
  if (val.length > 0) {
    newUrl.searchParams.set("word", val);
  } else {
    newUrl.searchParams.delete("word");
  }
  history.replaceState(null, "", newUrl.toString());
});

/* ── SAYFA AÇILIRKEN URL'DEN KELİMEYİ OKU ── */
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const prefilledWord = params.get("word");
  if (prefilledWord) {
    wordInput.value = prefilledWord;
  }
});

/* ── ADIM 1 → ADIM 2 GEÇİŞİ ── */
wordNextBtn.addEventListener("click", () => goToMeaningStep());
wordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") goToMeaningStep();
});

function goToMeaningStep() {
  const word = wordInput.value.trim();

  if (!word) {
    showStatus("Lütfen bir kelime gir.", "error");
    wordInput.focus();
    return;
  }

  wordPreview.textContent = word;

  stepWord.classList.add("hidden");
  stepMeaning.classList.remove("hidden");
  hideStatus();

  // Önce "yükleniyor" göster, sonra çeviriyi getir
  hintText.textContent = "⏳ yükleniyor…";
  hintText.classList.remove("hint-error");
  translateHint.classList.remove("hidden");

  fetchTranslationHint(word);

  meaningInput.focus();
}

/* ── ÇEVİRİ ÖNERİSİ ── */
// okuma.js'deki fetch mantığıyla aynı endpoint
function fetchTranslationHint(word) {
  fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=tr&dt=t&q=${encodeURIComponent(word)}`
  )
    .then((res) => res.json())
    .then((data) => {
      const translated = data[0][0][0];
      hintText.textContent = translated;
    })
    .catch(() => {
      hintText.textContent = "çeviri alınamadı";
      hintText.classList.add("hint-error");
    });
}

/* ── KAYDET ── */
saveBtn.addEventListener("click", () => addWord());
meaningInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addWord();
});

async function addWord() {
  const word    = wordInput.value.trim();
  const meaning = meaningInput.value.trim();

  if (!meaning) {
    showStatus("Lütfen bir anlam gir.", "error");
    meaningInput.focus();
    return;
  }

  if (!currentUser) {
    showStatus("Oturum bulunamadı. Lütfen tekrar giriş yap.", "error");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Kontrol ediliyor…";

  try {
    /* Duplicate kontrolü */
    const existing = await getWords(currentUser.uid);
    const normalizedWord    = word.toLowerCase().trim();
    const normalizedMeaning = meaning.toLowerCase().trim();

    const duplicate = existing.find(
      (w) =>
        w.word.toLowerCase().trim()    === normalizedWord &&
        w.meaning.toLowerCase().trim() === normalizedMeaning
    );

    if (duplicate) {
      showStatus("⚠️ Bu kelime ve anlam zaten kayıtlı.", "error");
      saveBtn.disabled = false;
      saveBtn.textContent = "Kelimeyi Ekle ✓";
      return;
    }

    /* Firebase'e kaydet */
    await saveWord(currentUser.uid, word, meaning);

    showStatus("✅ Kelime başarıyla eklendi!", "success");

    setTimeout(() => {
      resetForm();
    }, 1800);

  } catch (err) {
    console.error(err);
    showStatus("Bir hata oluştu: " + err.message, "error");
    saveBtn.disabled = false;
    saveBtn.textContent = "Kelimeyi Ekle ✓";
  }
}

/* ── FORM SIFIRLA ── */
function resetForm() {
  wordInput.value    = "";
  meaningInput.value = "";
  wordPreview.textContent = "";
  hintText.textContent    = "";
  hintText.classList.remove("hint-error");
  translateHint.classList.add("hidden");

  stepMeaning.classList.add("hidden");
  stepWord.classList.remove("hidden");

  const newUrl = new URL(window.location.href);
  newUrl.searchParams.delete("word");
  history.replaceState(null, "", newUrl.toString());

  hideStatus();
  saveBtn.disabled    = false;
  saveBtn.textContent = "Kelimeyi Ekle ✓";
  wordInput.focus();
}

/* ── YARDIMCI: DURUM MESAJI ── */
function showStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className   = `status-msg ${type}`;
  statusMsg.classList.remove("hidden");
}

function hideStatus() {
  statusMsg.classList.add("hidden");
  statusMsg.textContent = "";
  statusMsg.className   = "status-msg hidden";
}