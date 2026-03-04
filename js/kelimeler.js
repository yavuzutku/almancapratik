// Kelimeler sayfası JS
// Kaydetme sistemi daha sonra eklenecek

document.addEventListener("DOMContentLoaded", () => {

  const wordList       = document.getElementById("wordList");
  const emptyState     = document.getElementById("emptyState");
  const wordCountBadge = document.getElementById("wordCountBadge");
  const searchInput    = document.getElementById("searchInput");

  // Şu anlık örnek liste boş — kaydetme sistemi eklenince burası dolacak
  let allWords = [];

  function render(list) {

    // Sadece .word-card elemanlarını temizle
    [...wordList.querySelectorAll(".word-card")].forEach(el => el.remove());

    wordCountBadge.textContent = allWords.length + " kelime";

    if (list.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    list.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "word-card";
      card.style.animationDelay = (idx * 30) + "ms";
      card.innerHTML = `
        <div class="word-left">
          <div class="word-german">${item.word}</div>
          <div class="word-turkish">${item.meaning}</div>
          <div class="word-date">${formatDate(item.date)}</div>
        </div>
        <div class="word-right">
          <button class="word-delete-btn" data-id="${item.id}">🗑 Sil</button>
        </div>
      `;
      wordList.appendChild(card);
    });
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR", {
      day: "2-digit", month: "long", year: "numeric"
    });
  }

  // Arama
  searchInput.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allWords.filter(w =>
      w.word.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q)
    );
    render(filtered);
  });

  // İlk yükleme
  render(allWords);
});