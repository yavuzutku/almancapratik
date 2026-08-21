// Gramer konu verisi — dersler yazıldıkça buraya eklenecek.
// Örnek format: { title: "Akkusativ", level: "A1", href: "/gramer/akkusativ/" }
const GRAMER_KONULAR = [];

function renderTopics(list) {
  const grid = document.getElementById("topicsGrid");
  const empty = document.getElementById("emptyState");
  grid.innerHTML = "";

  if (!list.length) {
    grid.style.display = "none";
    empty.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  empty.style.display = "none";
  list.forEach((t) => {
    const a = document.createElement("a");
    a.className = "topic-card";
    a.href = t.href;
    a.innerHTML = `<span class="topic-badge">${t.level}</span><div class="topic-title">${t.title}</div>`;
    grid.appendChild(a);
  });
}

function applyFilter(level) {
  const filtered = level === "all"
    ? GRAMER_KONULAR
    : GRAMER_KONULAR.filter((t) => t.level === level);
  renderTopics(filtered);
}

document.getElementById("levelPillRow").addEventListener("click", (e) => {
  const btn = e.target.closest(".level-pill");
  if (!btn) return;
  document.querySelectorAll(".level-pill").forEach((p) => p.classList.remove("active"));
  btn.classList.add("active");
  applyFilter(btn.dataset.level);
});

renderTopics(GRAMER_KONULAR);
